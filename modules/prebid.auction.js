// modules/prebid.auction.js
// Prebid + (опційно) GAM із Bidmatic та Adtelligent.
// Контейнери на сторінці: #ad-top-adtelligent, #ad-left-adtelligent,
// #ad-right-bidmatic, #ad-right-beautiful, #ad-mobile-bidmatic.
// Якщо немає ставок — показуємо house-креатив (SVG).

import {
	ADS_DEBUG,
	BIDMATIC_SOURCE,
	BIDMATIC_SPN,
	ENABLE_BIDMATIC,
	ENABLE_GAM,
	GAM_NETWORK_CALLS,
} from "virtual:ads-config";
import { composeAdsCss } from "/modules/ads.styles.js";

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

const w = window;
w.__ads = w.__ads || {};
w.__adslog = w.__adslog || [];
w.__ads.rendered = w.__ads.rendered || {}; // { [adUnitCode]: boolean }
w.__ads.addedCodes = w.__ads.addedCodes || new Set();
w.__ads.adaptersRegistered = w.__ads.adaptersRegistered || new Set();
w.__ads.pbjsConfigured = w.__ads.pbjsConfigured || false;
w.__ads.pbjsInitPromise = w.__ads.pbjsInitPromise || null;

/* ----------------------------- utils ----------------------------- */

function loadScript(src, id) {
	return new Promise((resolve, reject) => {
		if (id && document.getElementById(id)) return resolve();
		const s = document.createElement("script");
		if (id) s.id = id;
		s.async = true;
		s.src = src;
		s.onload = () => resolve();
		s.onerror = (e) => reject(e);
		document.head.appendChild(s);
	});
}

function debounce(fn, ms) {
	let t;
	return (...a) => {
		clearTimeout(t);
		t = setTimeout(() => fn(...a), ms);
	};
}

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

/* --------------------- containers provided by React --------------------- */

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

function hasAny(s) {
	return !!(
		s.topAdtelligent ||
		s.leftAdtelligent ||
		s.rightBidmatic ||
		s.rightBeautiful ||
		s.mobileBidmatic
	);
}

/* ---------------------- house creatives (images) ---------------------- */

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
	img.src = `data:image/svg+xml;utf8,${encodeURIComponent(houseSVG(brandFor(unitId), W, H))}`;
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

/* ---------------------------- Prebid ---------------------------- */

const BIDMATIC_ALLOWED = [
	[300, 250],
	[300, 600],
	[320, 50],
	[468, 60],
	[728, 90],
	[970, 90],
];
const allowSize = (sizes) =>
	sizes?.some?.(([w, h]) =>
		BIDMATIC_ALLOWED.some(([aw, ah]) => aw === w && ah === h),
	);

async function registerAdaptersOnce() {
	// Bidmatic
	if (ENABLE_BIDMATIC && !w.__ads.adaptersRegistered.has("bidmatic")) {
		try {
			const mod = await import("/modules/bidmaticBidAdapter.js");
			const spec =
				mod.bidmaticBidAdapter || mod.default || mod.adapter || mod.bidderSpec;
			if (spec && !w.pbjs?.bidderRegistry?.bidmatic) {
				w.pbjs.registerBidder?.(spec);
				w.__ads.adaptersRegistered.add("bidmatic");
			}
		} catch (e) {
			console.warn("[Prebid] Bidmatic adapter load failed:", e);
		}
	}
	// Adtelligent (можна керувати через w.__ads.config.ENABLE_ADTELLIGENT)
	const enableAdt =
		typeof w.__ads?.config?.ENABLE_ADTELLIGENT !== "undefined"
			? !!w.__ads.config.ENABLE_ADTELLIGENT
			: true;
	if (enableAdt && !w.__ads.adaptersRegistered.has("adtelligent")) {
		try {
			const mod = await import("/modules/adtelligentBidAdapter.js");
			const spec =
				mod.adtelligentBidAdapter ||
				mod.default ||
				mod.adapter ||
				mod.bidderSpec;
			if (spec && !w.pbjs?.bidderRegistry?.adtelligent) {
				w.pbjs.registerBidder?.(spec);
				w.__ads.adaptersRegistered.add("adtelligent");
			}
		} catch (e) {
			console.warn("[Prebid] Adtelligent adapter load failed:", e);
		}
	}
}

async function ensurePrebid() {
	if (w.__ads.pbjsInitPromise) return w.__ads.pbjsInitPromise;
	w.pbjs = w.pbjs || { que: [] };

	w.__ads.pbjsInitPromise = (async () => {
		try {
			await loadScript(PREBID_SRC_LOCAL, "pbjs-lib");
		} catch {
			await loadScript(PREBID_SRC_CDN, "pbjs-lib");
		}

		await new Promise((resolve) => {
			w.pbjs.que.push(() => {
				if (!w.__ads.pbjsConfigured) {
					w.pbjs.setConfig?.({
						debug: !!ADS_DEBUG,
						bidderTimeout: BIDDER_TIMEOUT,
						enableSendAllBids: true,
						consentManagement: {
							gdpr: {
								cmpApi: "tcfv2",
								timeout: 8000,
								allowAuctionWithoutConsent: false,
							},
							usp: { cmpApi: "usp", timeout: 1000 },
							gpp: { timeout: 1000 },
						},
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
							iframeEnabled: true,
							filterSettings: { iframe: { bidders: "*", filter: "include" } },
							syncDelay: 1000,
						},
						activityControls: { enabled: false },
						sizeConfig: [
							{
								label: "desktop",
								mediaQuery: "(min-width:1024px)",
								sizesSupported: [...TOP_SIZES, ...SIDE_SIZES],
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
								{
									asi: location.hostname || "localhost",
									sid: "pub-0001",
									hp: 1,
								},
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
					w.__ads.pbjsConfigured = true;
				}
				resolve();
			});
		});

		await registerAdaptersOnce();

		if (!w.__ads.bpBound) {
			w.__ads.bpBound = true;
			const active = () =>
				window.innerWidth >= 1024
					? "desktop"
					: window.innerWidth >= 768
						? "tablet"
						: "mobile";
			w.__ads.lastBp = active();
			window.addEventListener(
				"resize",
				debounce(() => {
					const cur = active();
					if (cur !== w.__ads.lastBp) {
						w.__ads.lastBp = cur;
						refreshAds();
					}
				}, 250),
			);
		}
	})();

	return w.__ads.pbjsInitPromise;
}

/* ----------------------------- GAM ----------------------------- */

async function ensureGpt() {
	if (!ENABLE_GAM) return;
	if (w.googletag?.apiReady || w.__ads.gptLoading) return;
	w.__ads.gptLoading = true;
	w.googletag = w.googletag || { cmd: [] };
	await loadScript(GPT_SRC, "gpt-lib");
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

/* ---------------------------- events ---------------------------- */

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

/* --------------------------- adUnits --------------------------- */

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
	const list = [];

	// Adtelligent
	const ENABLE_ADTELLIGENT =
		typeof w.__ads?.config?.ENABLE_ADTELLIGENT !== "undefined"
			? !!w.__ads.config.ENABLE_ADTELLIGENT
			: true;
	const ADTELLIGENT_AID = w.__ads?.config?.ADTELLIGENT_AID ?? 350975;

	if (ENABLE_ADTELLIGENT && Number(ADTELLIGENT_AID) && allowSize(sizes)) {
		list.push({
			bidder: "adtelligent",
			params: { aid: Number(ADTELLIGENT_AID) },
		});
	}

	// Bidmatic
	if (ENABLE_BIDMATIC && Number(BIDMATIC_SOURCE) && allowSize(sizes)) {
		const p = { source: Number(BIDMATIC_SOURCE) };
		if (BIDMATIC_SPN) p.spn = BIDMATIC_SPN;
		list.push({ bidder: "bidmatic", params: p });
	}

	if (ADS_DEBUG) console.log("[Prebid] bidders for", unitId, list);
	return list;
}

/* --------------------------- rendering --------------------------- */

function renderDirect(winner) {
	const el = document.getElementById(winner.adUnitCode);
	if (!el) return;
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
	w.pbjs.renderAd?.(ifr.contentWindow.document, winner.adId);
	w.__ads.rendered[winner.adUnitCode] = true;
}

/* ----------------------------- public API ----------------------------- */

function initAnalytics() {
	if (w.__ads.analytics) return;
	w.__ads.uid =
		w.__ads.uid ||
		`u_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
	w.__ads.geo = w.__ads.geo || "US";
	w.__ads.analytics = { report: () => {} };
	if (ADS_DEBUG) console.log("[analytics] init", { uid: w.__ads.uid });
}

function addAdUnitsIncremental(units) {
	const fresh = units.filter((u) => !w.__ads.addedCodes.has(u.code));
	fresh.forEach((u) => {
		w.__ads.addedCodes.add(u.code);
	});
	if (fresh.length) {
		w.pbjs.addAdUnits?.(fresh);
		logEvent("hb:addAdUnits", fresh);
	}
}

let _initOnce = false;
let _auctionInFlight = false;

export async function initAds() {
	if (_initOnce) return;
	_initOnce = true;

	// чекаємо контейнери від React
	let slots = ensureContainers();
	let tries = 0;
	while (!hasAny(slots) && tries < 10) {
		await new Promise((r) => setTimeout(r, 150));
		slots = ensureContainers();
		tries++;
	}
	if (!hasAny(slots)) return;

	initAnalytics();
	await ensurePrebid();
	await ensureGpt();
	hookPrebidEvents();
	applyNetworkTargeting();
	defineGptSlots(slots);

	await requestAndDisplay();
}

export async function requestAndDisplay(adUnits /* optional */) {
	if (_auctionInFlight) return; // single-flight
	_auctionInFlight = true;

	await ensurePrebid();

	const slots = ensureContainers();
	const units = adUnits || makeAdUnits(slots);
	if (!units.length) {
		_auctionInFlight = false;
		return;
	}

	// placeholders
	for (const u of units) {
		const first = (u.mediaTypes?.banner?.sizes || [[300, 250]])[0];
		ensurePlaceholder(u.code, "auction…", first);
	}

	w.pbjs.que.push(() => {
		addAdUnitsIncremental(units);

		const codes = units.map((u) => u.code);
		w.pbjs.requestBids?.({
			adUnitCodes: codes,
			timeout: BIDDER_TIMEOUT,
			bidsBackHandler: () => {
				const winners = w.pbjs.getHighestCpmBids?.(codes) || [];
				logEvent("hb:bidsBackHandler", { codes, winners });

				// house для тих, хто не виграв
				const got = new Set(winners.map((w) => w.adUnitCode));
				codes
					.filter((c) => !got.has(c))
					.forEach((code) => {
						const u = units.find((x) => x.code === code);
						const el = document.getElementById(code);
						const width =
							el?.getBoundingClientRect().width ||
							u.mediaTypes.banner.sizes[0][0];
						const best = pickBestSize(width, u.mediaTypes.banner.sizes);
						renderHouse(code, best);
					});

				if (!winners.length) {
					_auctionInFlight = false;
					return;
				}

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
			},
		});
	});
}

export async function refreshAds(codes /* optional */) {
	await ensurePrebid();

	const slots = ensureContainers();
	const units = makeAdUnits(slots);
	const adUnitCodes = codes || units.map((u) => u.code);
	if (!adUnitCodes.length) return;

	// placeholder на рефреш
	for (const u of units) {
		if (adUnitCodes.includes(u.code)) {
			const first = (u.mediaTypes?.banner?.sizes || [[300, 250]])[0];
			ensurePlaceholder(u.code, "refresh…", first);
		}
	}

	w.pbjs.que.push(() => {
		w.pbjs.requestBids?.({
			adUnitCodes,
			timeout: BIDDER_TIMEOUT,
			bidsBackHandler: () => {
				const winners = w.pbjs.getHighestCpmBids?.(adUnitCodes) || [];
				logEvent("hb:bidsBackHandler", { adUnitCodes, winners });

				const got = new Set(winners.map((w) => w.adUnitCode));
				adUnitCodes
					.filter((c) => !got.has(c))
					.forEach((code) => {
						const u = units.find((x) => x.code === code);
						const el = document.getElementById(code);
						const width =
							el?.getBoundingClientRect().width ||
							u.mediaTypes.banner.sizes[0][0];
						const best = pickBestSize(width, u.mediaTypes.banner.sizes);
						renderHouse(code, best);
					});

				if (!winners.length) return;

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
			},
		});
	});
}

export function unmount(domId) {
	try {
		removePlaceholder(domId);
		const el = document.getElementById(domId);
		if (el) el.replaceChildren();
		w.__ads.rendered[domId] = false;
	} catch {}
}
