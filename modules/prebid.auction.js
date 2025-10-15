import {
	ADS_DEBUG,
	BIDMATIC_SOURCE,
	BIDMATIC_SPN,
	ENABLE_BIDMATIC,
	ENABLE_GAM,
	GAM_NETWORK_CALLS,
} from "virtual:ads-config";
import { composeAdsCss } from "/modules/ads.styles.js";

/* ───────────────────────────────── constants ───────────────────────────────── */

const PREBID_SRC_LOCAL = "/prebid/prebid.js";
const PREBID_SRC_CDN =
	"https://cdn.jsdelivr.net/npm/prebid.js@10.10.0/dist/prebid.js";
const GPT_SRC = "https://securepubads.g.doubleclick.net/tag/js/gpt.js";
const USE_GAM = ENABLE_GAM && !!GAM_NETWORK_CALLS;

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

const BIDDER_TIMEOUT = 3000;
const GPT_SAFE_FALLBACK_DELAY = BIDDER_TIMEOUT + 1200;

const BIDMATIC_ALLOWED = [
	[300, 250],
	[300, 600],
	[320, 50],
	[468, 60],
	[728, 90],
	[970, 90],
];

/* ──────────────────────────────── globals ──────────────────────────────── */

const w = window;
w.__ads = w.__ads || {};
w.__adslog = w.__adslog || [];
w.__ads.rendered = w.__ads.rendered || {};
w.__ads.renderedByAdId = w.__ads.renderedByAdId || new Set();
w.__ads.registeredBidders = w.__ads.registeredBidders || new Set();
w.__ads.alias = w.__ads.alias || {};

/* ───────────────────────────────── helpers ──────────────────────────────── */

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
	sizes?.some?.(([w, h]) =>
		BIDMATIC_ALLOWED.some(([aw, ah]) => aw === w && ah === h),
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

/* ───────────────────── containers provided by React ───────────────────── */

function ensureContainers() {
	injectStylesOnce();
	const topAdtelligent = document.getElementById("ad-top-adtelligent");
	const leftAdtelligent = document.getElementById("ad-left-adtelligent");
	const rightBidmatic = document.getElementById("ad-right-bidmatic");
	const rightBeautiful = document.getElementById("ad-right-beautiful");
	const mobileBidmatic = document.getElementById("ad-mobile-bidmatic");

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
	w.__ads.rendered[unitId] = true;
}

function ensurePlaceholder(id, text, size) {
	const el = document.getElementById(id);
	if (!el) return;
	let ph = el.querySelector(".ads-placeholder");
	if (!ph) {
		ph = document.createElement("div");
		ph.className = "ads-placeholder";
		el.appendChild(ph);
	}
	ph.innerHTML = `<span>${text || "loading…"}</span>`;
	setSlotSize(el, size);
}
function removePlaceholder(id) {
	document.getElementById(id)?.querySelector(".ads-placeholder")?.remove();
}

/* ──────────────────────────────── Prebid ──────────────────────────────── */

let _prebidReady = false;
let _prebidPromise = null;

// вибираємо spec з будь-якого типу експорту
function pickSpec(mod, names = []) {
	if (!mod) return null;
	const candidates = [
		mod.spec,
		mod.default,
		mod.bidderSpec,
		...names.map((n) => mod[n]),
		...Object.values(mod || {}),
	];
	for (const v of candidates) {
		if (
			v &&
			typeof v === "object" &&
			typeof v.code === "string" &&
			(typeof v.isBidRequestValid === "function" ||
				typeof v.buildRequests === "function")
		) {
			return v;
		}
	}
	return null;
}

function pbjsQueueFlush() {
	w.pbjs = w.pbjs || { que: [] };
	return new Promise((res) => w.pbjs.que.push(res));
}

async function ensurePrebid() {
	if (_prebidReady) return;
	if (_prebidPromise) return _prebidPromise;

	_prebidPromise = (async () => {
		w.pbjs = w.pbjs || { que: [] };

		// 1) підключаємо Prebid
		try {
			await loadScript(PREBID_SRC_LOCAL, "pbjs-lib");
		} catch {
			await loadScript(PREBID_SRC_CDN, "pbjs-lib");
		}

		// 2) імпортуємо адаптери
		const promises = [];
		if (ENABLE_BIDMATIC) {
			promises.push(
				import("/modules/bidmaticBidAdapter.js")
					.then((m) => ({
						name: "bidmatic",
						spec: pickSpec(m, ["bidmaticBidAdapter"]),
					}))
					.catch((e) => ({ name: "bidmatic", error: e })),
			);
		}
		promises.push(
			import("/modules/adtelligentBidAdapter.js")
				.then((m) => ({
					name: "adtelligent",
					spec: pickSpec(m, ["adtelligentBidAdapter"]),
				}))
				.catch((e) => ({ name: "adtelligent", error: e })),
		);
		promises.push(
			import("/modules/pokhvalenkoBidAdapter.js")
				.then((m) => ({
					name: "pokhvalenko",
					spec: pickSpec(m, ["pokhvalenkoBidAdapter"]),
				}))
				.catch((e) => ({ name: "pokhvalenko", error: e })),
		);

		const loaded = await Promise.all(promises);

		// 3) реєстрація / alias / конфіг
		w.pbjs.que.push(() => {
			const mark = (code) => w.__ads.registeredBidders.add(code);
			let adtelligentRegistered = false;

			loaded.forEach(({ name, spec, error }) => {
				if (error) console.warn(`[Prebid] ${name} adapter load failed:`, error);

				try {
					if (spec && typeof w.pbjs.registerBidder === "function") {
						w.pbjs.registerBidder(spec);
						mark(spec.code || name);
						if (name === "adtelligent") adtelligentRegistered = true;
						if (ADS_DEBUG) console.log(`[Prebid] ${name} registered`);
					} else {
						if (name === "adtelligent") {
							adtelligentRegistered = true;
							mark("adtelligent");
							console.warn(
								"[Prebid] adtelligent register skipped (no spec) — assuming bundled/self-registered",
							);
						} else {
							console.warn(
								`[Prebid] ${name} register skipped (no spec) — bidder won't be used`,
							);
						}
					}
				} catch (e) {
					console.warn(`[Prebid] ${name} register error:`, e);
				}
			});

			const isReg = (code) => w.__ads.registeredBidders.has(code);
			const alias = (from, to) => {
				if (
					!isReg(from) &&
					isReg(to) &&
					typeof w.pbjs.aliasBidder === "function"
				) {
					try {
						w.pbjs.aliasBidder(to, from);
						w.__ads.alias[from] = to;
						mark(from);
						console.info(`[Prebid] alias '${from}' -> '${to}'`);
					} catch (e) {
						console.warn(`[Prebid] alias failed '${from}' -> '${to}'`, e);
					}
				}
			};
			if (adtelligentRegistered) {
				alias("bidmatic", "adtelligent");
				alias("pokhvalenko", "adtelligent");
			}

			// === CONSENT / CMP handling ===
			const hasTCF = typeof w.__tcfapi === "function";
			const hasUSP = typeof w.__uspapi === "function";
			const hasGPP = typeof w.__gpp === "function";

			const _consentConfig =
				hasTCF || hasUSP || hasGPP
					? {
							...(hasTCF && {
								gdpr: {
									cmpApi: "iab",
									timeout: 8000,
								},
							}),
							...(hasUSP && { usp: { cmpApi: "iab", timeout: 1000 } }),
							...(hasGPP && { gpp: { cmpApi: "iab", timeout: 1000 } }),
						}
					: undefined;

			w.pbjs.setConfig?.({
				debug: !!ADS_DEBUG,
				bidderTimeout: 3000,
				enableSendAllBids: true,
				enableTIDs: true,

				// ...(consentConfig ? { consentManagement: consentConfig } : {}),

				coppa: !!w.__ads?.config?.coppa,

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

				userSync: {
					syncEnabled: false,
					iframeEnabled: false,
					pixelEnabled: false,
					syncDelay: 0,
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

			w.pbjs.setConfig?.({ adtelligent: { chunkSize: 1 } });
		});

		_prebidReady = true;
	})();

	return _prebidPromise;
}

/* ─────────────────────────────────── GAM ─────────────────────────────────── */

let _gptPromise = null;
async function ensureGpt() {
	if (!ENABLE_GAM) return;
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
	if (!ENABLE_GAM) return;
	w.googletag.cmd.push(() => {
		const pubads = w.googletag.pubads();
		pubads.setTargeting("site", location.hostname || "localhost");
		pubads.setTargeting(
			"section",
			location.pathname.replace(/\//g, "_") || "home",
		);
		pubads.setTargeting("env", import.meta.env.MODE || "dev");
		pubads.setTargeting("prebid", "1");
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
				renderHouse(id, best);
				w.__ads.rendered[id] = false;
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

/* ───────────────────────────────── events ───────────────────────────────── */

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

/* ───────────────────────────────── adUnits ──────────────────────────────── */

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

function biddersForUnit(sizes, unitId) {
	const bidders = [];
	const isRegistered = (code) => w.__ads.registeredBidders?.has(code);
	const aliasedTo = (code) => w.__ads.alias?.[code];

	let want;
	if (unitId.includes("adtelligent")) want = ["adtelligent"];
	else if (unitId.includes("bidmatic")) want = ["bidmatic"];
	else if (unitId.includes("beautiful") || unitId.includes("pokh"))
		want = ["pokhvalenko"];
	else want = ["adtelligent", "bidmatic", "pokhvalenko"];

	const ENABLE_ADTELLIGENT =
		typeof w.__ads?.config?.ENABLE_ADTELLIGENT !== "undefined"
			? !!w.__ads.config.ENABLE_ADTELLIGENT
			: true;
	const ADTELLIGENT_AID = w.__ads?.config?.ADTELLIGENT_AID ?? 350975;
	const _POKHVALENKO_AID = w.__ads?.config?.POKHVALENKO_AID ?? 350975;

	const paramsFor = (code) => {
		const aliasTarget = aliasedTo(code);
		if (aliasTarget === "adtelligent") {
			return { bidder: code, params: { aid: Number(ADTELLIGENT_AID) } };
		}
		if (code === "adtelligent") {
			return {
				bidder: "adtelligent",
				params: { aid: Number(ADTELLIGENT_AID) },
			};
		}
		if (code === "bidmatic") {
			const p = { source: Number(BIDMATIC_SOURCE) };
			if (BIDMATIC_SPN) p.spn = BIDMATIC_SPN;
			return { bidder: "bidmatic", params: p };
		}
		if (code === "pokhvalenko") {
			return {
				bidder: "pokhvalenko",
				params: { aid: Number(POKHVALЕНКО_AID) },
			};
		}
		return null;
	};

	// adtelligent
	if (
		want.includes("adtelligent") &&
		ENABLE_ADTELLIGENT &&
		isRegistered("adtelligent") &&
		Number(ADTELLIGENT_AID) &&
		allowSize(sizes)
	) {
		bidders.push(paramsFor("adtelligent"));
	}

	// bidmatic
	if (
		want.includes("bidmatic") &&
		isRegistered("bidmatic") &&
		allowSize(sizes) &&
		(aliasedTo("bidmatic") === "adtelligent"
			? Number(ADTELLIGENT_AID)
			: ENABLE_BIDMATIC && Number(BIDMATIC_SOURCE))
	) {
		bidders.push(paramsFor("bidmatic"));
	}

	// pokhvalenko (custom)
	if (
		want.includes("pokhvalenko") &&
		isRegistered("pokhvalenko") &&
		allowSize(sizes) &&
		(aliasedTo("pokhvalenko") === "adtelligent"
			? Number(ADTELLIGENT_AID)
			: Number(POKHVALENКО_AID))
	) {
		bidders.push(paramsFor("pokhvalenko"));
	}

	if (ADS_DEBUG) console.log("[Prebid] bidders for", unitId, bidders);
	return bidders;
}

/* ─────────────────────────────── rendering ─────────────────────────────── */

function renderDirect(winner) {
	const el = document.getElementById(winner.adUnitCode);
	if (!el) return;

	const adId = String(winner.adId || "");
	if (adId && w.__ads.renderedByAdId.has(adId)) return;

	const W = Number(winner.width || 0),
		H = Number(winner.height || 0);
	setSlotSize(el, [W, H]);
	removePlaceholder(winner.adUnitCode);
	el.innerHTML = "";
	const ifr = document.createElement("iframe");
	ifr.setAttribute("scrolling", "no");
	ifr.setAttribute("frameborder", "0");
	ifr.style.cssText =
		"display:block;border:0;width:100%;height:100%;overflow:hidden;border-radius:12px";
	el.appendChild(ifr);

	try {
		w.pbjs.renderAd?.(ifr.contentWindow.document, winner.adId);
		if (adId) w.__ads.renderedByAdId.add(adId);
		w.__ads.rendered[winner.adUnitCode] = true;
	} catch (e) {
		console.warn("[Prebid] renderAd error", e);
	}
}

/* ───────────────────────────── public API ──────────────────────────────── */

let _initOnce = false;
export async function initAds() {
	if (_initOnce) return;
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

let _auctionInFlight = false;

async function waitBiddersReady() {
	await new Promise((r) => {
		window.pbjs = window.pbjs || { que: [] };
		window.pbjs.que.push(r);
	});
	const t0 = performance.now();
	while (
		(window.__ads?.registeredBidders?.size || 0) === 0 &&
		performance.now() - t0 < 800
	) {
		await new Promise((r) => window.pbjs.que.push(r));
	}
}

export async function requestAndDisplay(adUnits) {
	if (_auctionInFlight) return;
	_auctionInFlight = true;

	await pbjsQueueFlush();

	const slots = ensureContainers();
	const units = adUnits || makeAdUnits(slots);
	if (!units.length) {
		_auctionInFlight = false;
		return;
	}

	for (const u of units) {
		const first = (u.mediaTypes?.banner?.sizes || [[300, 250]])[0];
		ensurePlaceholder(u.code, "auction…", first);
	}

	const codes = units.map((u) => u.code);
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
				const renderWinners = (winners) => {
					if (USE_GAM && w.googletag?.apiReady) {
						w.pbjs.setTargetingForGPTAsync?.();
						w.googletag.cmd.push(() => w.googletag.pubads().refresh());
						setTimeout(() => {
							winners.forEach((wb) => {
								if (!w.__ads.rendered[wb.adUnitCode]) renderDirect(wb);
							});
							_auctionInFlight = false;
						}, GPT_SAFE_FALLBACK_DELAY);
					} else {
						winners.forEach(renderDirect);
						_auctionInFlight = false;
					}
				};

				const direct = w.pbjs.getHighestCpmBids?.(codes) || [];
				if (direct.length) {
					logEvent("hb:bidsBackHandler", { codes, winners: direct });
					renderWinners(direct);
					return;
				}

				setTimeout(() => {
					const late = (w.pbjs.getAllWinningBids?.() || []).filter((b) =>
						codes.includes(b.adUnitCode),
					);
					if (late.length) {
						logEvent("hb:bidsBackHandler:late", { codes, winners: late });
						renderWinners(late);
						return;
					}

					codes.forEach((code) => {
						const el = document.getElementById(code);
						const unitSizes = unitSizesByCode[code] || [[300, 250]];
						const width = el?.getBoundingClientRect().width || unitSizes[0][0];
						const best = pickBestSize(width, unitSizes);
						renderHouse(code, best);
					});
					logEvent("hb:bidsBackHandler:none", { codes });
					_auctionInFlight = false;
				}, 300);
			},
		});
	});
}

export async function refreshAds(codes) {
	await pbjsQueueFlush();

	const slots = ensureContainers();
	const units = makeAdUnits(slots);
	const adUnitCodes = codes || units.map((u) => u.code);
	if (!adUnitCodes.length) return;

	for (const u of units) {
		if (adUnitCodes.includes(u.code)) {
			const first = (u.mediaTypes?.banner?.sizes || [[300, 250]])[0];
			ensurePlaceholder(u.code, "refresh…", first);
		}
	}

	const unitSizesByCode = Object.fromEntries(
		units.map((u) => [u.code, u.mediaTypes?.banner?.sizes || [[300, 250]]]),
	);

	w.pbjs.que.push(() => {
		w.pbjs.requestBids?.({
			adUnitCodes,
			timeout: BIDDER_TIMEOUT,
			bidsBackHandler: () => {
				const renderWinners = (winners) => {
					if (USE_GAM && w.googletag?.apiReady) {
						w.pbjs.setTargetingForGPTAsync?.();
						w.googletag.cmd.push(() => w.googletag.pubads().refresh());
						setTimeout(() => {
							winners.forEach((wb) => {
								if (!w.__ads.rendered[wb.adUnitCode]) renderDirect(wb);
							});
						}, GPT_SAFE_FALLBACK_DELAY);
					} else {
						winners.forEach(renderDirect);
					}
				};

				const direct = w.pbjs.getHighestCpmBids?.(adUnitCodes) || [];
				if (direct.length) {
					logEvent("hb:bidsBackHandler", { adUnitCodes, winners: direct });
					renderWinners(direct);
					return;
				}

				setTimeout(() => {
					const late = (w.pbjs.getAllWinningBids?.() || []).filter((b) =>
						adUnitCodes.includes(b.adUnitCode),
					);
					if (late.length) {
						logEvent("hb:bidsBackHandler:late", { adUnitCodes, winners: late });
						renderWinners(late);
						return;
					}

					adUnitCodes.forEach((code) => {
						const el = document.getElementById(code);
						const unitSizes = unitSizesByCode[code] || [[300, 250]];
						const width = el?.getBoundingClientRect().width || unitSizes[0][0];
						const best = pickBestSize(width, unitSizes);
						renderHouse(code, best);
					});
					logEvent("hb:bidsBackHandler:none", { adUnitCodes });
				}, 300);
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
