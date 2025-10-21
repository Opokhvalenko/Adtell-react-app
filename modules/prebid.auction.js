import {
	ADS_DEBUG,
	BIDMATIC_SOURCE,
	BIDMATIC_SPN,
	ENABLE_BIDMATIC,
	ENABLE_GAM,
	GAM_NETWORK_CALLS,
} from "virtual:ads-config";
import { composeAdsCss } from "/modules/ads.styles.js";

/* ───────────────────────── config & constants ─────────────────────────── */

const PORTFOLIO_MODE = true; // демо/навчальний режим
const PREBID_SRC_PRIMARY =
	"https://cdn.jsdelivr.net/npm/prebid.js@10.10.0/dist/prebid.js";
const PREBID_SRC_FALLBACK = "/prebid/prebid.js";

const GPT_SRC = "https://securepubads.g.doubleclick.net/tag/js/gpt.js";
const USE_GAM = !PORTFOLIO_MODE && ENABLE_GAM && !!GAM_NETWORK_CALLS;

const TOP_SIZES = [
	[970, 90],
	[728, 90],
	[468, 60],
	[320, 50],
];
const SIDE_SIZES = [
	[300, 600],
	[300, 250],
];

const BIDDER_TIMEOUT = 1200;
const GPT_SAFE_FALLBACK_DELAY = 300;

const BIDMATIC_ALLOWED = [
	[300, 250],
	[300, 600],
	[320, 50],
	[468, 60],
	[728, 90],
	[970, 90],
];

// Імена локальних аліасів, щоб не торкатись зовнішніх доменів
const BIDMATIC_ALIAS = "bidmatic_local";
const POKH_ALIAS = "pokhvalenko_local";

/* ─────────────────────────── globals & helpers ────────────────────────── */

const w = window;
w.__ads = w.__ads || {};
w.__adslog = w.__adslog || [];
w.__ads.rendered = w.__ads.rendered || {};
w.__ads.renderedByAdId = w.__ads.renderedByAdId || new Set();
w.__ads.registeredBidders = w.__ads.registeredBidders || new Set();
w.__ads.alias = w.__ads.alias || {};
w.__ads.lastAuctionAt = w.__ads.lastAuctionAt || 0;

const loadedScripts = new Set();
function loadScript(src, id) {
	return new Promise((resolve, reject) => {
		if (id && document.getElementById(id)) return resolve();
		if (loadedScripts.has(src)) return resolve();
		const s = document.createElement("script");
		if (id) s.id = id;
		s.async = true;
		s.src = src;
		s.onload = () => {
			loadedScripts.add(src);
			resolve();
		};
		s.onerror = (e) => reject(e);
		document.head.appendChild(s);
	});
}

const allowSize = (sizes) =>
	sizes?.some?.(([w0, h0]) =>
		BIDMATIC_ALLOWED.some(([aw, ah]) => aw === w0 && ah === h0),
	);

function pickBestSize(containerW, sizes) {
	const sorted = [...sizes].sort((a, b) => b[0] - a[0]);
	const fit = sorted.find(([w]) => w <= containerW);
	return fit ?? sorted.at(-1);
}

function setSlotSize(el, [W, H]) {
	if (!el) return;
	el.style.display = "inline-block";
	el.style.width = `${W}px`;
	el.style.height = `${H}px`;
}

function logEvent(type, payload) {
	const item = { ts: Date.now(), type, payload };
	w.__adslog.unshift(item);
	w.dispatchEvent(new CustomEvent("ads:prebid", { detail: item }));
	if (ADS_DEBUG) console.log("[ads]", type, payload);
}

function injectStylesOnce() {
	if (w.__ads.stylesInjected) return;
	w.__ads.stylesInjected = true;
	const css =
		composeAdsCss({
			includeIframe: true,
			includeSideFixed: false,
			includeHouse: false,
		}) +
		`
    .ads-slot{ display:inline-block; vertical-align:top; }
    .ads-placeholder{ display:flex; align-items:center; justify-content:center; width:100%; height:100%;
      border-radius:12px; background:repeating-linear-gradient(-45deg,#f5f6fb 0 12px,#edeff7 12px 24px); }
    .ads-placeholder span{ font:600 12px/1 system-ui,-apple-system,Segoe UI,Inter,Roboto,sans-serif; color:#6b7280 }
  `;
	const style = document.createElement("style");
	style.dataset.ads = "styles";
	style.textContent = css;
	document.head.appendChild(style);
}

/* ───────────────────── quiet demo CMP (TCF/USP/GPP robust stubs) ──────── */

(function installDemoCMP() {
	if (!PORTFOLIO_MODE) return;

	const pickCb = (...args) => args.find((a) => typeof a === "function");

	try {
		// TCF v2
		if (!w.__tcfapi) {
			const tcData = {
				gdprApplies: false,
				tcfPolicyVersion: 2,
				cmpId: 1,
				cmpVersion: 1,
				eventStatus: "tcloaded",
				cmpStatus: "loaded",
				tcString: "COxxxxOxxxxOAAAAAENAAAAAAA",
			};
			w.__tcfapi = (cmd, _ver, cb) => {
				const callback = pickCb(cb);
				if (typeof callback !== "function") return;
				if (cmd === "addEventListener") {
					try {
						callback(tcData, true);
					} catch {}
					return 1;
				}
				if (cmd === "getTCData") {
					try {
						callback(tcData, true);
					} catch {}
					return;
				}
				if (cmd === "ping") {
					try {
						callback(
							{
								gdprApplies: false,
								cmpLoaded: true,
								cmpStatus: "loaded",
								displayStatus: "hidden",
							},
							true,
						);
					} catch {}
					return;
				}
				try {
					callback(null, false);
				} catch {}
			};
		}

		// USP / USPrivacy
		if (!w.__uspapi) {
			w.__uspapi = (command, _version, callback) => {
				if (typeof callback !== "function") return;
				switch (command) {
					case "registerDeletion":
						try {
							callback(true, true);
						} catch {}
						return;
					case "getUSPData":
					case "getUSPrivacyString":
						try {
							callback({ version: 1, uspString: "1---" }, true);
						} catch {}
						return;
					case "ping":
						try {
							callback({ uspapiLoaded: true, version: 1 }, true);
						} catch {}
						return;
					case "addEventListener":
						try {
							callback({ uspString: "1---" }, true);
						} catch {}
						return;
					default:
						try {
							callback(null, false);
						} catch {}
				}
			};
		}

		// GPP
		if (typeof w.__gpp !== "function") {
			w.__gpp = (command, a, b, c) => {
				const cb = pickCb(a, b, c);
				if (typeof cb !== "function") return;
				if (command === "registerDeletion") {
					try {
						cb(true);
					} catch {}
					return;
				}
				if (command === "ping") {
					try {
						cb(
							{
								gppVersion: "1.1",
								cmpStatus: "loaded",
								signalStatus: "ready",
								supportedAPIs: ["tcfeuv2", "usnat"],
							},
							true,
						);
					} catch {}
					return;
				}
				if (command === "getGPPData") {
					try {
						cb({ gppString: "", applicableSections: [], sections: {} }, true);
					} catch {}
					return;
				}
				if (command === "addEventListener") {
					try {
						cb(
							{
								eventName: "listenerRegistered",
								listenerId: Math.random().toString(36).slice(2),
							},
							true,
						);
					} catch {}
					return;
				}
				if (command === "removeEventListener") {
					try {
						cb(true);
					} catch {}
					return;
				}
				try {
					cb(undefined, false);
				} catch {}
			};
		}
	} catch {}
})();

/* ───────────────────── containers provided by React ───────────────────── */

function ensureContainers() {
	injectStylesOnce();

	const grab = (id) => {
		const el = document.getElementById(id);
		if (!el) return null;

		el.classList?.add("ads-slot");
		if (!el.style.position || el.style.position === "static") {
			el.style.position = "relative";
		}
		el.style.overflow = "hidden";

		if (el.childNodes?.length === 1 && el.textContent?.trim().length) {
			el.innerHTML = "";
		}
		return el;
	};

	const topAdtelligent = grab("ad-top-adtelligent");
	const leftAdtelligent = grab("ad-left-adtelligent");
	const rightBidmatic = grab("ad-right-bidmatic");
	const rightBeautiful = grab("ad-right-beautiful");
	const mobileBidmatic = grab("ad-mobile-bidmatic");

	if (ADS_DEBUG) {
		console.log("[Prebid] containers", {
			topAdtelligent: !!topAdtelligent,
			leftAdtelligent: !!leftAdtelligent,
			rightBidmatic: !!rightBidmatic,
			rightBeautiful: !!rightBeautiful,
			mobileBidmatic: !!mobileBidmatic,
		});
	}
	return {
		topAdtelligent,
		leftAdtelligent,
		rightBidmatic,
		rightBeautiful,
		mobileBidmatic,
	};
}
/* ───────────────────────────── house creatives ─────────────────────────── */

function brandFor(unitId) {
	if (unitId.includes("adtelligent")) return "Adtelligent";
	if (unitId.includes("bidmatic")) return "Bidmatic";
	if (unitId.includes("beautiful")) return "Custom";
	return "Ad";
}
function houseSVG(brand, W, H) {
	const big = W >= 728 ? 26 : 18;
	const sub = 12;
	return `
  <svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <pattern id="p" width="24" height="24" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
        <rect width="24" height="24" fill="#f4f6ff"/>
        <rect width="12" height="24" fill="#eef1fb"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" rx="12" ry="12" fill="url(#p)" stroke="#e5e7eb"/>
    <g font-family="Inter,system-ui,Segoe UI,Roboto" text-anchor="middle">
      <text x="${W / 2}" y="${H / 2 - 4}" font-weight="800" font-size="${big}" fill="#4f46e5">${brand}</text>
      <text x="${W / 2}" y="${H / 2 + 16}" font-weight="600" font-size="${sub}" fill="#6b7280">${W}×${H}</text>
      <text x="${W / 2}" y="${H / 2 + 32}" font-weight="600" font-size="${sub}" fill="#9ca3af">house — no bids</text>
    </g>
  </svg>`;
}
function renderHouse(unitId, size) {
	const el = document.getElementById(unitId);
	if (!el) return;
	const [W, H] = size;
	setSlotSize(el, [W, H]);
	el.innerHTML = "";
	const img = document.createElement("img");
	img.src = `data:image/svg+xml;utf8,${encodeURIComponent(
		houseSVG(brandFor(unitId), W, H),
	)}`;
	img.alt = `${brandFor(unitId)} ${W}x${H}`;
	img.width = W;
	img.height = H;
	img.style.cssText = "display:block;width:100%;height:100%;border-radius:12px";
	el.appendChild(img);
	w.__ads.rendered[unitId] = false;
}
function ensurePlaceholder(id, text, size) {
	const el = document.getElementById(id);
	if (!el) return;
	if (el.textContent?.trim().length && !el.querySelector(".ads-placeholder")) {
		el.innerHTML = "";
	}
	let ph = el.querySelector(".ads-placeholder");
	if (!ph) {
		ph = document.createElement("div");
		ph.className = "ads-placeholder";
		el.appendChild(ph);
	}
	ph.innerHTML = `<span>${text || "loading…"}</span>`;
	setSlotSize(el, size);
}

/* ─────────────────────────────── Prebid load ───────────────────────────── */

let _prebidReady = false;
let _prebidPromise = null;

function pbjsQueueFlush() {
	w.pbjs = w.pbjs || { que: [] };
	return new Promise((res) => w.pbjs.que.push(res));
}
function pickSpec(mod, names = []) {
	if (!mod) return null;
	const candidates = [
		mod?.spec,
		mod?.default,
		mod?.bidderSpec,
		...names.map((n) => mod?.[n]),
		...Object.values(mod || {}),
	];
	for (const v of candidates) {
		if (v && typeof v === "object" && typeof v.code === "string") {
			return v;
		}
	}
	return null;
}

async function ensurePrebid() {
	if (_prebidReady) return;
	if (_prebidPromise) return _prebidPromise;

	_prebidPromise = (async () => {
		w.pbjs = w.pbjs || { que: [] };

		try {
			await loadScript(PREBID_SRC_PRIMARY, "pbjs-lib");
		} catch {
			await loadScript(PREBID_SRC_FALLBACK, "pbjs-lib");
		}

		let adtSpec = null;
		try {
			const m = await import("/modules/adtelligentBidAdapter.js").catch(
				() => null,
			);
			adtSpec = pickSpec(m, ["adtelligentBidAdapter"]);
		} catch {}

		w.pbjs.que.push(() => {
			const REGISTER_API = typeof w.pbjs.registerBidder === "function";
			const mark = (code) => w.__ads.registeredBidders.add(code);

			const makeDemoBidder = (code, cpmBase, label) => ({
				code,
				supportedMediaTypes: ["banner"],
				isBidRequestValid: () => true,
				buildRequests: (bids) =>
					bids.map((bid) => ({
						method: "GET",
						url: "about:blank",
						data: {},
						bid,
					})),
				interpretResponse: (_resp, req) => {
					const bid = req.bid;
					const sizes = bid.mediaTypes?.banner?.sizes ||
						bid.sizes || [[300, 250]];
					const [w0, h0] = sizes[0];
					const ad = `<div style="width:${w0}px;height:${h0}px;display:flex;align-items:center;justify-content:center;
       border:2px dashed #9CA3AF;border-radius:12px;background:repeating-linear-gradient(-45deg,#F9FAFB 0 12px,#F3F4F6 12px 24px);
       font:700 14px system-ui;color:#374151">${label} — demo (${w0}×${h0})</div>`;
					return [
						{
							requestId: bid.bidId,
							cpm: Number((cpmBase + Math.random() * 0.01).toFixed(2)),
							currency: "USD",
							width: w0,
							height: h0,
							ad,
							creativeId: `${code}-${Math.random().toString(36).slice(2)}`,
							netRevenue: true,
							ttl: 60,
						},
					];
				},
			});

			if (PORTFOLIO_MODE && REGISTER_API) {
				try {
					w.pbjs.registerBidder(
						makeDemoBidder("adtelligent", 2.2, "Adtelligent"),
					);
					mark("adtelligent");
					w.pbjs.registerBidder(
						makeDemoBidder(BIDMATIC_ALIAS, 2.5, "Bidmatic"),
					);
					mark(BIDMATIC_ALIAS);
					w.pbjs.registerBidder(makeDemoBidder(POKH_ALIAS, 3.0, "Pokhvalenko"));
					mark(POKH_ALIAS);
				} catch (e) {
					console.warn("[Prebid] demo bidders registration failed", e);
				}
			} else {
				if (REGISTER_API && adtSpec) {
					try {
						w.pbjs.registerBidder(adtSpec);
						mark(adtSpec.code || "adtelligent");
					} catch (_e) {}
				} else {
					mark("adtelligent");
				}
				try {
					w.pbjs.aliasBidder("adtelligent", BIDMATIC_ALIAS);
					w.pbjs.aliasBidder("adtelligent", POKH_ALIAS);
					mark(BIDMATIC_ALIAS);
					mark(POKH_ALIAS);
				} catch {}
			}

			const consent = {
				gdpr: { cmpApi: "iab", timeout: 100, allowAuctionWithoutConsent: true },
				usp: { cmpApi: "iab", timeout: 50 },
				gpp: { cmpApi: "iab", timeout: 150 },
			};

			w.pbjs.setConfig?.({
				debug: !!ADS_DEBUG,
				bidderTimeout: BIDDER_TIMEOUT,
				enableSendAllBids: true,
				enableTIDs: true,
				consentManagement: consent,
				userSync: {
					syncEnabled: false,
					iframeEnabled: false,
					pixelEnabled: false,
					filterSettings: {
						iframe: {
							bidders: ["bidmatic_local", "pokhvalenko_local"],
							filter: "include",
						},
					},
				},
				bidderSettings: PORTFOLIO_MODE
					? {
							adtelligent: { bidCpmAdjustment: (c) => c + 0.5 },
							[BIDMATIC_ALIAS]: { bidCpmAdjustment: (c) => c + 0.6 },
							[POKH_ALIAS]: { bidCpmAdjustment: (c) => c + 0.7 },
						}
					: undefined,
				floors: w.__ads?.config?.floors ?? {
					enforcement: { enforceFloors: true },
					data: {
						currency: "USD",
						schema: { fields: ["mediaType", "size"] },
						values: {
							"banner|300x250": 0.01,
							"banner|300x600": 0.02,
							"banner|728x90": 0.01,
							"banner|970x90": 0.02,
							"banner|*": 0.005,
						},
					},
				},
				sizeConfig: [
					{
						label: "desktop",
						mediaQuery: "(min-width:1024px)",
						sizesSupported: [
							[970, 90],
							[728, 90],
							[468, 60],
							[320, 50],
							[300, 600],
							[300, 250],
						],
					},
					{
						label: "tablet",
						mediaQuery: "(min-width:768px) and (max-width:1023px)",
						sizesSupported: [
							[728, 90],
							[468, 60],
							[300, 250],
						],
					},
					{
						label: "mobile",
						mediaQuery: "(max-width:767px)",
						sizesSupported: [
							[320, 50],
							[300, 250],
						],
					},
				],
				schain: {
					ver: "1.0",
					complete: 1,
					nodes: [
						{ asi: location.hostname || "localhost", sid: "pub-0001", hp: 1 },
					],
				},
				ortb2: {
					site: {
						domain: location.hostname || "localhost",
						page: location.href,
						ext: {
							data: {
								section: location.pathname.replace(/\//g, "_") || "home",
							},
						},
					},
				},
			});
		});

		_prebidReady = true;
	})();

	return _prebidPromise;
}

/* ─────────────────────────────────── GPT ───────────────────────────────── */

let _gptPromise = null;
async function ensureGpt() {
	if (!USE_GAM) return;
	if (w.googletag?.apiReady) return;
	if (_gptPromise) return _gptPromise;
	w.googletag = w.googletag || { cmd: [] };
	_gptPromise = loadScript(GPT_SRC, "gpt-lib");
	return _gptPromise;
}
function slotExists(id) {
	try {
		return (w.googletag?.pubads?.().getSlots?.() || []).some(
			(s) => s.getSlotElementId?.() === id,
		);
	} catch {
		return false;
	}
}
function applyNetworkTargeting() {
	if (!USE_GAM) return;
	w.googletag.cmd.push(() => {
		const pubads = w.googletag.pubads();
		pubads.setTargeting("site", location.hostname || "localhost");
		pubads.setTargeting(
			"section",
			location.pathname.replace(/\//g, "_") || "home",
		);
		pubads.setTargeting("env", import.meta.env.MODE || "dev");
		pubads.setTargeting("prebid", "1");
		try {
			pubads.setRequestNonPersonalizedAds(1);
		} catch {}
	});
}
function defineGptSlots({ topAdtelligent, leftAdtelligent, rightBidmatic }) {
	if (!USE_GAM) return;
	w.googletag.cmd.push(() => {
		const pubads = w.googletag.pubads();
		pubads.disableInitialLoad?.();
		pubads.enableSingleRequest?.();
		pubads.setCentering?.(true);

		if (topAdtelligent && !slotExists(topAdtelligent.id)) {
			const s = w.googletag.defineSlot(
				"/1234567/ad-top",
				TOP_SIZES,
				topAdtelligent.id,
			);
			if (s) {
				s.addService(pubads);
				s.setTargeting("pos", "top");
			}
		}
		[leftAdtelligent, rightBidmatic].forEach((node) => {
			if (node && !slotExists(node.id)) {
				const s = w.googletag.defineSlot(
					"/1234567/ad-side",
					SIDE_SIZES,
					node.id,
				);
				if (s) {
					s.addService(pubads);
					s.setTargeting("pos", "side");
				}
			}
		});

		pubads.addEventListener("slotRenderEnded", (ev) => {
			const id = ev.slot.getSlotElementId();
			if (ev.isEmpty) {
				const el = document.getElementById(id);
				const sizes = id.includes("top") ? TOP_SIZES : SIDE_SIZES;
				const width = el?.getBoundingClientRect().width || sizes[0][0];
				const best = pickBestSize(width, sizes);
				if (!w.__ads.rendered[id]) renderHouse(id, best);
			} else {
				removePlaceholder(id);
				w.__ads.rendered[id] = true;
			}
			if (ADS_DEBUG)
				console.log("[GAM] slotRenderEnded", {
					id,
					empty: ev.isEmpty,
					size: ev.size,
				});
		});

		w.googletag.enableServices?.();
		if (topAdtelligent) w.googletag.display(topAdtelligent.id);
		if (leftAdtelligent) w.googletag.display(leftAdtelligent.id);
		if (rightBidmatic) w.googletag.display(rightBidmatic.id);
	});
}

/* ───────────────────────────────── events ──────────────────────────────── */

function hookPrebidEvents() {
	if (w.__ads.eventsHooked) return;
	w.__ads.eventsHooked = true;
	w.pbjs.que.push(() => {
		const on = (name) =>
			w.pbjs.onEvent?.(name, (payload) => logEvent(`hb:${name}`, payload));
		[
			"auctionInit",
			"beforeRequestBids",
			"requestBids",
			"bidRequested",
			"bidResponse",
			"noBid",
			"bidderDone",
			"bidderError",
			"setTargeting",
			"auctionEnd",
			"bidWon",
			"adRenderSucceeded",
			"adRenderFailed",
			"bidTimeout",
		].forEach(on);
	});
}

/* ───────────────────────────────── adUnits ─────────────────────────────── */

function makeAdUnits({
	topAdtelligent,
	leftAdtelligent,
	rightBidmatic,
	rightBeautiful,
	mobileBidmatic,
}) {
	const units = [];
	const push = (node, sizes) => {
		if (!node) return;
		const bids = biddersForUnit(sizes, node.id);
		if (!bids.length) return;
		units.push({
			code: node.id,
			mediaTypes: { banner: { sizes } },
			schain: {
				ver: "1.0",
				complete: 1,
				nodes: [
					{ asi: location.hostname || "localhost", sid: "pub-0001", hp: 1 },
				],
			},
			bids,
		});
	};
	push(topAdtelligent, TOP_SIZES);
	push(leftAdtelligent, SIDE_SIZES);
	push(rightBidmatic, SIDE_SIZES);
	push(rightBeautiful, [[300, 250]]);
	push(mobileBidmatic, [[300, 250]]);
	return units;
}

function biddersForUnit(sizes, _unitId) {
	const bidders = [];
	const isRegistered = (code) => w.__ads.registeredBidders?.has(code);

	const want = PORTFOLIO_MODE
		? ["adtelligent", BIDMATIC_ALIAS, POKH_ALIAS]
		: ["adtelligent", BIDMATIC_ALIAS, POKH_ALIAS];

	function paramsFor(code) {
		const ADTELLIGENT_AID = w.__ads?.config?.ADTELLIGENT_AID ?? 350975;
		if (
			code === "adtelligent" ||
			code === BIDMATIC_ALIAS ||
			code === POKH_ALIAS
		) {
			const p = { aid: Number(ADTELLIGENT_AID) };
			if (code === BIDMATIC_ALIAS) {
				if (Number(BIDMATIC_SOURCE)) p.source = Number(BIDMATIC_SOURCE);
				if (BIDMATIC_SPN) p.spn = BIDMATIC_SPN;
			}
			return { bidder: code, params: p };
		}
		return null;
	}

	want.forEach((code) => {
		const enabled = code === BIDMATIC_ALIAS ? ENABLE_BIDMATIC !== false : true;
		if (enabled && isRegistered(code) && allowSize(sizes)) {
			const p = paramsFor(code);
			if (p) bidders.push(p);
		}
	});

	if (ADS_DEBUG) console.log("[Prebid] bidders for unit:", _unitId, bidders);
	return bidders;
}

/* ─────────────────────────────── selection ─────────────────────────────── */

function preferredBidderFor(code) {
	if (code.includes("top-adtelligent")) return "adtelligent";
	if (code.includes("right-bidmatic")) return BIDMATIC_ALIAS;
	if (code.includes("right-beautiful")) return POKH_ALIAS;
	if (code.includes("mobile-bidmatic")) return POKH_ALIAS;
	return null;
}

function getBidsForCode(code) {
	try {
		const resp = w.pbjs.getBidResponsesForAdUnitCode?.(code) || {};
		return Array.isArray(resp.bids) ? resp.bids : [];
	} catch {
		return [];
	}
}

function chooseWinners(adUnitCodes) {
	const winners = [];
	for (const code of adUnitCodes) {
		const bids = getBidsForCode(code);
		if (!bids.length) continue;

		const prefer = preferredBidderFor(code);
		const byBidder = (name) =>
			bids.find((b) => String(b.bidderCode || b.bidder) === String(name));

		let pick = prefer ? byBidder(prefer) : null;
		if (!pick) pick = byBidder("adtelligent");
		if (!pick)
			pick = bids.reduce((acc, b) => (!acc || b.cpm > acc.cpm ? b : acc), null);

		if (pick) winners.push(pick);
	}
	return winners;
}

function removePlaceholder(id) {
	const el = document.getElementById(id);
	el?.querySelector(".ads-placeholder")?.remove();
}

/* ─────────────────────────────── rendering ─────────────────────────────── */

function renderDirect(winner) {
	const id = String(winner.adUnitCode || "");
	const el = document.getElementById(id);
	if (!el) {
		console.warn("[Prebid] renderDirect: container not found:", id);
		return;
	}

	w.__ads.rendered[id] = false;

	const W = Number(winner.width || winner.size?.[0] || 300);
	const H = Number(winner.height || winner.size?.[1] || 250);

	if (!el.style.position || el.style.position === "static")
		el.style.position = "relative";
	el.style.overflow = "hidden";
	setSlotSize(el, [W, H]);
	removePlaceholder(id);

	try {
		el.innerHTML = "";
	} catch {}

	const ifr = document.createElement("iframe");
	ifr.setAttribute("scrolling", "no");
	ifr.setAttribute("frameborder", "0");
	ifr.style.cssText =
		"display:block;border:0;width:100%;height:100%;overflow:hidden;border-radius:12px";
	el.appendChild(ifr);

	const writeRaw = () => {
		try {
			const doc = ifr.contentDocument || ifr.contentWindow?.document;
			if (!doc) return;
			doc.open();
			doc.write(String(winner.ad || ""));
			doc.close();
		} catch (e) {
			console.warn("[Prebid] writeRaw error:", e);
		}
	};

	try {
		const doc = ifr.contentWindow?.document || null;
		if (w.pbjs?.renderAd && winner.adId && doc) {
			try {
				w.pbjs.renderAd(doc, winner.adId);
			} catch (_e) {
				if (winner.ad) writeRaw();
			}
		} else if (winner.ad) {
			writeRaw();
		}
	} catch (e) {
		console.warn("[Prebid] renderAd error, fallback to raw HTML:", e);
		if (winner.ad) writeRaw();
	}

	setTimeout(() => {
		try {
			const body = ifr.contentDocument?.body;
			const empty =
				!body ||
				body.childNodes.length === 0 ||
				body.innerHTML.trim().length === 0;
			if (empty && winner.ad) writeRaw();
			w.__ads.rendered[id] = true;
			if (winner.adId) w.__ads.renderedByAdId.add(winner.adId);
		} catch {
			renderHouse(id, [W, H]);
		}
	}, 60);
}

/* ───────────────────────────── public API ──────────────────────────────── */

let _initOnce = false;

export async function initAds() {
	if (_initOnce) {
		const slots = ensureContainers();
		if (!hasAny(slots)) return;
		return requestAndDisplay();
	}

	_initOnce = true;

	let slots = ensureContainers();
	let tries = 0;
	while (!hasAny(slots) && tries < 10) {
		await new Promise((r) =>
			"requestIdleCallback" in window
				? requestIdleCallback(r)
				: setTimeout(r, 50),
		);
		slots = ensureContainers();
		tries++;
	}
	if (!hasAny(slots)) return;

	initAnalytics();
	await ensurePrebid();
	await waitBiddersReady();
	await pbjsQueueFlush();

	await ensureGpt();
	hookPrebidEvents();
	applyNetworkTargeting();
	defineGptSlots(slots);

	await requestAndDisplay();
}

function hasAny(s) {
	return !!(
		s.topAdtelligent ||
		s.leftAdtelligent ||
		s.rightBidmatic ||
		s.rightBeautiful ||
		s.mobileBidmatic
	);
}

function initAnalytics() {
	if (w.__ads.analytics) return;
	w.__ads.uid =
		w.__ads.uid ||
		`u_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
	w.__ads.geo = w.__ads.geo || "US";
	w.__ads.analytics = { report: () => {} };
	if (ADS_DEBUG) console.log("[analytics] init", { uid: w.__ads.uid });
}

async function waitBiddersReady() {
	await new Promise((r) => {
		window.pbjs = window.pbjs || { que: [] };
		window.pbjs.que.push(r);
	});
	const t0 = performance.now();
	while (
		(window.__ads?.registeredBidders?.size || 0) < 1 &&
		performance.now() - t0 < 1500
	) {
		await new Promise((r) => window.pbjs.que.push(r));
	}
}

let _auctionInFlight = false;

function resetRenderFlags(codes) {
	if (!codes) return;
	codes.forEach((c) => {
		w.__ads.rendered[c] = false;
	});
}

export async function requestAndDisplay(adUnits) {
	await ensurePrebid();
	await waitBiddersReady();
	await pbjsQueueFlush();

	if (_auctionInFlight) return;
	_auctionInFlight = true;

	const slots = ensureContainers();
	const units = adUnits || makeAdUnits(slots);
	if (!units.length) {
		_auctionInFlight = false;
		return;
	}

	const codes = units.map((u) => u.code);
	resetRenderFlags(codes);

	for (const u of units) {
		const first = (u.mediaTypes?.banner?.sizes || [[300, 250]])[0];
		ensurePlaceholder(u.code, "auction…", first);
	}

	w.__lastCodes = codes.slice();

	const unitSizesByCode = Object.fromEntries(
		units.map((u) => [u.code, u.mediaTypes?.banner?.sizes || [[300, 250]]]),
	);

	w.pbjs.que.push(() => {
		if (!w.__ads.unitsAdded) {
			w.__ads.unitsAdded = true;
			w.pbjs.addAdUnits?.(units);
			logEvent("hb:addAdUnits", units);
		}

		w.pbjs.requestBids?.({
			adUnitCodes: codes,
			timeout: BIDDER_TIMEOUT,
			bidsBackHandler: () => {
				const winners = chooseWinners(codes);

				if (winners.length) {
					logEvent("hb:bidsBackHandler", { codes, winners });
					if (USE_GAM && w.googletag?.apiReady) {
						w.pbjs.setTargetingForGPTAsync?.(codes);
						w.googletag.cmd.push(() => w.googletag.pubads().refresh());
						setTimeout(() => {
							for (const wb of winners) {
								renderDirect(wb);
							}
							_auctionInFlight = false;
							w.__ads.lastAuctionAt = Date.now();
						}, GPT_SAFE_FALLBACK_DELAY);
					} else {
						for (const wb of winners) {
							renderDirect(wb);
						}
						_auctionInFlight = false;
						w.__ads.lastAuctionAt = Date.now();
					}
					return;
				}

				setTimeout(() => {
					const late = chooseWinners(codes);
					if (late.length) {
						logEvent("hb:bidsBackHandler:late", { codes, winners: late });
						for (const wb of late) {
							renderDirect(wb);
						}
						_auctionInFlight = false;
						w.__ads.lastAuctionAt = Date.now();
						return;
					}

					codes.forEach((code) => {
						const adtBids = getBidsForCode(code).filter(
							(b) => String(b.bidderCode) === "adtelligent",
						);
						if (adtBids.length) {
							renderDirect(adtBids[0]);
							return;
						}
						const el = document.getElementById(code);
						const unitSizes = unitSizesByCode[code] || [[300, 250]];
						const width = el?.getBoundingClientRect().width || unitSizes[0][0];
						const best = pickBestSize(width, unitSizes);
						renderHouse(code, best);
					});
					logEvent("hb:bidsBackHandler:none", { adUnitCodes: codes });
					_auctionInFlight = false;
					w.__ads.lastAuctionAt = Date.now();
				}, 250);
			},
		});
	});
}

export async function refreshAds(codes) {
	await ensurePrebid();
	await waitBiddersReady();
	await pbjsQueueFlush();

	if (Date.now() - (w.__ads.lastAuctionAt || 0) < 1200) return;

	const slots = ensureContainers();
	const units = makeAdUnits(slots);
	const adUnitCodes = codes || units.map((u) => u.code);
	if (!adUnitCodes.length) return;

	resetRenderFlags(adUnitCodes);

	const unitSizesByCode = Object.fromEntries(
		units.map((u) => [u.code, u.mediaTypes?.banner?.sizes || [[300, 250]]]),
	);

	w.pbjs.que.push(() => {
		w.pbjs.requestBids?.({
			adUnitCodes,
			timeout: BIDDER_TIMEOUT,
			bidsBackHandler: () => {
				const winners = chooseWinners(adUnitCodes);

				if (winners.length) {
					logEvent("hb:bidsBackHandler", { adUnitCodes, winners });
					if (USE_GAM && w.googletag?.apiReady) {
						w.pbjs.setTargetingForGPTAsync?.(adUnitCodes);
						w.googletag.cmd.push(() => w.googletag.pubads().refresh());
						setTimeout(() => {
							for (const wb of winners) {
								renderDirect(wb);
							}
							w.__ads.lastAuctionAt = Date.now();
						}, GPT_SAFE_FALLBACK_DELAY);
					} else {
						for (const wb of winners) {
							renderDirect(wb);
						}
						w.__ads.lastAuctionAt = Date.now();
					}
					return;
				}

				setTimeout(() => {
					const late = chooseWinners(adUnitCodes);
					if (late.length) {
						const seen2 = new Set();
						const uniq = late.filter((wb) => {
							const id = wb.adId;
							if (!id) return true;
							if (seen2.has(id)) return false;
							seen2.add(id);
							return true;
						});
						logEvent("hb:bidsBackHandler:late", { adUnitCodes, winners: uniq });
						for (const wb of uniq) {
							renderDirect(wb);
						}
						w.__ads.lastAuctionAt = Date.now();
						return;
					}

					adUnitCodes.forEach((code) => {
						const adtBids = getBidsForCode(code).filter(
							(b) => String(b.bidderCode) === "adtelligent",
						);
						if (adtBids.length) {
							renderDirect(adtBids[0]);
							return;
						}
						const el = document.getElementById(code);
						const unitSizes = unitSizesByCode[code] || [[300, 250]];
						const width = el?.getBoundingClientRect().width || unitSizes[0][0];
						const best = pickBestSize(width, unitSizes);
						renderHouse(code, best);
					});
					logEvent("hb:bidsBackHandler:none", { adUnitCodes });
					w.__ads.lastAuctionAt = Date.now();
				}, 250);
			},
		});
	});
}

export default {
	initAds,
	requestAndDisplay,
	refreshAds,
	mount: initAds,
	unmount: () => {},
};
