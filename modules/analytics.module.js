import { ANALYTICS_ENDPOINT as ENDPOINT } from "@/config/analytics";

const Q = [];
let T = null;
let backoffMs = 0;

const FLUSH_MS = 1500;
const BATCH_MAX = 50;
const SOFT_PAYLOAD_LIMIT = 60 * 1024;
let ctx = {};

function sizeOf(obj) {
	try {
		return new Blob([JSON.stringify(obj)]).size;
	} catch {
		return 0;
	}
}
function splitBySize(events, limitBytes) {
	const chunks = [];
	let cur = [];
	let curBytes = 2;
	for (const e of events) {
		const eBytes = sizeOf(e) + (cur.length ? 1 : 0);
		if (cur.length >= BATCH_MAX || curBytes + eBytes > limitBytes) {
			chunks.push(cur);
			cur = [];
			curBytes = 2;
		}
		cur.push(e);
		curBytes += eBytes;
	}
	if (cur.length) chunks.push(cur);
	return chunks;
}

function scheduleFlush() {
	if (T) return;
	const delay = Math.max(FLUSH_MS, backoffMs);
	T = setTimeout(() => {
		T = null;
		void flushNow();
	}, delay);
}

async function flushNow() {
	if (Q.length === 0) return;

	const take = Q.splice(0, Math.max(BATCH_MAX, Q.length));
	const batches = splitBySize(take, SOFT_PAYLOAD_LIMIT);

	for (const batch of batches) {
		const payload = JSON.stringify(batch);

		if (navigator.sendBeacon) {
			const ok = navigator.sendBeacon(
				ENDPOINT,
				new Blob([payload], { type: "application/json" }),
			);
			if (ok) {
				backoffMs = 0;
				continue;
			}
		}

		try {
			const res = await fetch(ENDPOINT, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: payload,
				keepalive: true,
			});
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			backoffMs = 0;
		} catch {
			Q.unshift(...batch);
			backoffMs = Math.min((backoffMs || 1000) * 2, 10_000);
			scheduleFlush();
			return;
		}
	}

	if (Q.length) scheduleFlush();
}

function emit(ev) {
	const base = {
		ts: Date.now(),
		uid: getUid(),
		sid: getSid(),
		page: location.href,
		ref: document.referrer || null,
		lang: navigator.language,
		tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
		cur: "USD",
		...ctx,
	};

	if (ev.event === "auctionInit") {
		window.__analytics = window.__analytics || {};
		window.__analytics.auctionCount =
			(window.__analytics.auctionCount || 0) + 1;
	}

	Q.push({ ...base, ...ev });
	if (Q.length >= BATCH_MAX) void flushNow();
	else scheduleFlush();
}

function getUid() {
	try {
		const k = "uid";
		let id = localStorage.getItem(k);
		if (!id) {
			id = crypto.randomUUID();
			localStorage.setItem(k, id);
		}
		return id;
	} catch {
		return null;
	}
}
function getSid() {
	try {
		const k = "sid";
		const now = Date.now();
		const ttl = 30 * 60 * 1000;
		const raw = sessionStorage.getItem(k);
		const sid = raw ? JSON.parse(raw) : { id: crypto.randomUUID(), ts: now };
		if (now - sid.ts > ttl) {
			sid.id = crypto.randomUUID();
			sid.ts = now;
		}
		sessionStorage.setItem(k, JSON.stringify(sid));
		return sid.id;
	} catch {
		return null;
	}
}

function collectAllBidsFromResponses(responsesObj) {
	const arr = Object.values(responsesObj || {});
	return arr.flatMap((v) => (Array.isArray(v?.bids) ? v.bids : []));
}

export function initAnalytics(options = {}) {
	const { enabled = true, context = {} } = options;
	if (!enabled) return;
	ctx = { ...context };

	emit({ event: "pageLoad" });

	addEventListener(
		"pagehide",
		() => {
			void flushNow();
		},
		{ capture: true },
	);
	addEventListener("visibilitychange", () => {
		if (document.visibilityState === "hidden") void flushNow();
	});
	addEventListener(
		"beforeunload",
		() => {
			void flushNow();
		},
		{ capture: true },
	);
	addEventListener("online", () => {
		scheduleFlush();
	});

	window.__analytics = {
		adModuleLoad(extra = {}) {
			emit({ event: "adModuleLoad", ...extra });
		},
		auctionInit(extra = {}) {
			emit({ event: "auctionInit", ...extra });
		},
		auctionEnd(extra = {}) {
			emit({ event: "auctionEnd", ...extra });
		},
		bidRequested(extra = {}) {
			emit({ event: "bidRequested", ...extra });
		},
		bidResponse(extra = {}) {
			emit({ event: "bidResponse", ...extra });
		},
		bidWon(extra = {}) {
			emit({ event: "bidWon", wins: 1, ...extra });
		},

		prebidStatus() {
			const pb = window.pbjs;
			const responses = pb?.getBidResponses?.() || {};
			return {
				loaded: !!pb?.libLoaded,
				version: pb?.version,
				config: pb?.getConfig?.(),
				adUnits: pb?.getAdUnits?.(),
				bidResponses: responses,
				highestCpmBids: pb?.getHighestCpmBids?.(),
				allBidsFlat: collectAllBidsFromResponses(responses),
			};
		},

		getAuctionMetrics(auctionId) {
			const pb = window.pbjs;
			if (!pb?.getBidResponses) return null;
			const allBids = collectAllBidsFromResponses(pb.getBidResponses());
			const auctionBids = allBids.filter((b) => b.auctionId === auctionId);
			return {
				auctionId,
				totalBids: auctionBids.length,
				winningBids: auctionBids.filter((b) => b.status === "rendered").length,
				averageCpm: auctionBids.length
					? allBids.reduce((s, b) => s + (b.cpm || 0), 0) / auctionBids.length
					: 0,
				highestCpm: auctionBids.reduce((m, b) => Math.max(m, b.cpm || 0), 0),
				bidderCount: new Set(auctionBids.map((b) => b.bidder)).size,
			};
		},

		testAuction(adUnitCodes = []) {
			const pb = window.pbjs;
			if (!pb?.requestBids) {
				console.warn("[analytics] Prebid.js not available for testing");
				return;
			}
			emit({ event: "testAuction", adUnitCodes });
			pb.que.push(() => {
				pb.requestBids({
					adUnitCodes,
					timeout: 3000,
					bidsBackHandler: () => {
						const flat = collectAllBidsFromResponses(pb.getBidResponses());
						emit({
							event: "testAuctionComplete",
							adUnitCodes,
							bidCount: flat.length,
							bids: flat,
						});
					},
				});
			});
		},

		getStats() {
			const pb = window.pbjs;
			if (!pb) return null;
			const allBids = collectAllBidsFromResponses(pb.getBidResponses?.() || {});
			return {
				totalAuctions: window.__analytics?.auctionCount || 0,
				totalBids: allBids.length,
				winningBids: allBids.filter((b) => b.status === "rendered").length,
				averageCpm: allBids.length
					? allBids.reduce((s, b) => s + (b.cpm || 0), 0) / allBids.length
					: 0,
				bidderStats: allBids.reduce((acc, b) => {
					acc[b.bidder] = (acc[b.bidder] || 0) + 1;
					return acc;
				}, {}),
				adUnitStats: allBids.reduce((acc, b) => {
					acc[b.adUnitCode] = (acc[b.adUnitCode] || 0) + 1;
					return acc;
				}, {}),
			};
		},
	};

	setupPrebidAnalytics();
}

function setupPrebidAnalytics() {
	const checkPrebid = () => {
		const pb = window.pbjs;
		if (!pb?.onEvent) {
			setTimeout(checkPrebid, 100);
			return;
		}

		pb.que.push(() => {
			const on = (name) =>
				pb.onEvent(name, (data) => {
					emit({
						event: name,
						adapter: "prebid",
						...(data || {}),
						timestamp: data?.timestamp || Date.now(),
					});
				});

			[
				"auctionInit",
				"auctionEnd",
				"bidRequested",
				"bidResponse",
				"noBid",
				"bidderDone",
				"bidderError",
				"bidTimeout",
				"setTargeting",
				"bidWon",
				"adRenderSucceeded",
				"adRenderFailed",
			].forEach(on);

			console.log("[analytics] Prebid.js events configured");
		});
	};
	checkPrebid();
}

export function track(name, payload = {}) {
	emit({ event: String(name), ...payload });
}
