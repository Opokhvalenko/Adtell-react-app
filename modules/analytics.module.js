const Q = [];
let T = null;
let backoffMs = 0;

const FLUSH_MS = 1500;
const BATCH_MAX = 50;
const ENDPOINT = "/api/report";
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
		flushNow();
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
			await fetch(ENDPOINT, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: payload,
				keepalive: true,
			});
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
		if (document.visibilityState === "hidden") {
			void flushNow();
		}
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
	};

	const pb = window.pbjs;
	if (pb?.onEvent) {
		pb.onEvent("auctionInit", (d) =>
			emit({ event: "auctionInit", adapter: "prebid", ...pickAuction(d) }),
		);
		pb.onEvent("auctionEnd", (d) =>
			emit({ event: "auctionEnd", adapter: "prebid", ...pickAuction(d) }),
		);
		pb.onEvent("bidRequested", (d) =>
			emit({ event: "bidRequested", adapter: "prebid", ...pickBidReq(d) }),
		);
		pb.onEvent("bidResponse", (d) =>
			emit({
				event: "bidResponse",
				adapter: "prebid",
				cpm: d?.cpm,
				adUnitCode: d?.adUnitCode,
				bidder: d?.bidder,
				creativeId: d?.creativeId,
				adomain: d?.meta?.advertiserDomains || [],
			}),
		);
		pb.onEvent("bidWon", (d) =>
			emit({
				event: "bidWon",
				adapter: "prebid",
				cpm: d?.cpm,
				adUnitCode: d?.adUnitCode,
				bidder: d?.bidder,
				creativeId: d?.creativeId,
				adomain: d?.meta?.advertiserDomains || [],
				wins: 1,
			}),
		);
	}
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
	Q.push({ ...base, ...ev });
	if (Q.length >= BATCH_MAX) {
		void flushNow();
	} else {
		scheduleFlush();
	}
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
function pickAuction(d) {
	return { auctionId: d?.auctionId, timeout: d?.timeout };
}
function pickBidReq(d) {
	const code =
		(Array.isArray(d?.bids) && d.bids[0]?.adUnitCode) || d?.adUnitCode;
	return { adUnitCode: code };
}
