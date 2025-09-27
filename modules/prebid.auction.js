// Prebid + (опційно) GAM. Плейсхолдери лишаються, доки нема реального рендера.
// Якщо ставок немає — показуємо сірий банер. Якщо GPT не відрендерив — safe fallback.

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

const PAGE_GAP = 24;
const SIDE_GAP_FROM_MAIN = 16;
const SIDE_WIDTH = 300;

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

const DEFAULT_TOP = [728, 90];
const DEFAULT_SIDE = [300, 250];

const BIDDER_TIMEOUT = 3000;
const GPT_SAFE_FALLBACK_DELAY = BIDDER_TIMEOUT + 1200; // якщо GPT "мовчить"

const w = window;
w.__ads = w.__ads || {};
w.__adslog = w.__adslog || [];
w.__ads.rendered = w.__ads.rendered || {}; // { [id]: boolean }

/* -------------------------- utils --------------------------- */

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
	return fit ?? sorted[sorted.length - 1];
}

function setWrapSize(el, [W, H]) {
	const wrap = el?.parentElement;
	if (wrap) {
		wrap.style.width = `${W}px`;
		wrap.style.height = `${H}px`;
	}
	if (el) {
		el.style.width = `${W}px`;
		el.style.height = `${H}px`;
	}
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
	const css = composeAdsCss({
		includeIframe: true,
		includeSideFixed: true,
		includeHouse: false,
	});
	const style = document.createElement("style");
	style.dataset.ads = "styles";
	style.textContent = css;
	document.head.appendChild(style);
}

function ensurePlaceholder(id, text = "waiting…", size) {
	const el = document.getElementById(id);
	if (!el) return;
	let ph = el.querySelector(".ads-placeholder");
	if (!ph) {
		ph = document.createElement("div");
		ph.className = "ads-placeholder";
		el.appendChild(ph);
	}
	ph.innerHTML = `<span class="ads-dot"></span><span>${id}: ${text}</span>`;

	// розмір щоб «сірий банер» був видимий навіть без креативу
	const dflt = id === "ad-top" ? DEFAULT_TOP : DEFAULT_SIDE;
	setWrapSize(el, size || dflt);
}

function removePlaceholder(id) {
	document.getElementById(id)?.querySelector(".ads-placeholder")?.remove();
}

/* --------------- containers (auto-inject & layout) ---------- */

function ensureContainers() {
	injectStylesOnce();

	const main =
		document.querySelector("main") ||
		document.getElementById("root") ||
		document.body;

	// TOP
	let topWrap = document.querySelector('[data-ads="top-wrap"]');
	if (!topWrap) {
		topWrap = document.createElement("div");
		topWrap.dataset.ads = "top-wrap";
		topWrap.className = "ads-wrap";
		topWrap.style.margin = `${PAGE_GAP}px auto ${PAGE_GAP / 2}px`;
		topWrap.style.width = "100%";
		const top = document.createElement("div");
		top.id = "ad-top";
		top.className = "ads-slot";
		topWrap.appendChild(top);
		main.parentElement?.insertBefore(topWrap, main);
	}

	// SIDE
	let sideWrap = document.querySelector('[data-ads="side-wrap"]');
	if (!sideWrap) {
		sideWrap = document.createElement("div");
		sideWrap.dataset.ads = "side-wrap";
		sideWrap.className = "ads-wrap ads-side-fixed";
		sideWrap.style.width = `${SIDE_WIDTH}px`;
		sideWrap.style.height = "600px";
		const side = document.createElement("div");
		side.id = "ad-side";
		side.className = "ads-slot";
		sideWrap.appendChild(side);
		document.body.appendChild(sideWrap);
	}

	// тримаємо плейсхолдери до реального рендера
	ensurePlaceholder("ad-top", "waiting for auction…", DEFAULT_TOP);
	ensurePlaceholder("ad-side", "waiting for auction…", DEFAULT_SIDE);

	// позиціюємо сайдбар
	function positionSide() {
		const rect = (
			document.querySelector("main") ||
			document.getElementById("root") ||
			document.body
		).getBoundingClientRect();

		const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
		const topOffset = rect.top + scrollY + PAGE_GAP;

		const desiredLeft = rect.right + SIDE_GAP_FROM_MAIN;
		const minLeft = PAGE_GAP;
		const maxLeft = window.innerWidth - (SIDE_WIDTH + PAGE_GAP);

		sideWrap.style.top = `${topOffset}px`;
		sideWrap.style.left = `${Math.min(Math.max(desiredLeft, minLeft), maxLeft)}px`;
	}
	if (!w.__ads.sidePosBound) {
		w.__ads.sidePosBound = true;
		window.addEventListener("resize", positionSide);
		window.addEventListener("scroll", positionSide);
	}
	positionSide();

	// top sizing
	function resizeTop() {
		const cw = topWrap.getBoundingClientRect().width || window.innerWidth;
		const [W, H] = pickBestSize(cw, TOP_SIZES);
		topWrap.style.maxWidth = `${W}px`;
		topWrap.style.height = `${H}px`;
	}
	resizeTop();
	if (!w.__ads.topRO) {
		w.__ads.topRO = new ResizeObserver(resizeTop);
		w.__ads.topRO.observe(topWrap);
	}

	// side sizing
	function resizeSide() {
		const [W, H] = pickBestSize(SIDE_WIDTH, SIDE_SIZES);
		sideWrap.style.width = `${W}px`;
		sideWrap.style.height = `${H}px`;
	}
	resizeSide();

	return {
		top: document.getElementById("ad-top"),
		side: document.getElementById("ad-side"),
	};
}

/* ------------------------- prebid --------------------------- */

async function ensurePrebid() {
	if (w.pbjs?.libLoaded || w.__ads.pbjsLoading) return;
	w.__ads.pbjsLoading = true;
	w.pbjs = w.pbjs || { que: [] };

	try {
		await loadScript(PREBID_SRC_LOCAL, "pbjs-lib");
	} catch {
		await loadScript(PREBID_SRC_CDN, "pbjs-lib");
	}

	w.pbjs.que.push(() => {
		const cfg = {
			debug: !!ADS_DEBUG,
			bidderTimeout: BIDDER_TIMEOUT,
			enableSendAllBids: true,
			targetingControls: {
				allowTargetingKeys: [
					"hb_bidder",
					"hb_pb",
					"hb_adid",
					"hb_size",
					"hb_format",
					"hb_source",
					"hb_uuid",
				],
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
					mediaQuery: "(min-width: 1024px)",
					sizesSupported: [...TOP_SIZES, ...SIDE_SIZES],
				},
				{
					label: "tablet",
					mediaQuery: "(min-width: 768px) and (max-width: 1023px)",
					sizesSupported: [
						[728, 90],
						[468, 60],
						[300, 250],
					],
				},
				{
					label: "mobile",
					mediaQuery: "(max-width: 767px)",
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
						data: { section: location.pathname.replace(/\//g, "_") || "home" },
					},
				},
			},
		};
		w.pbjs.setConfig?.(cfg);
	});

	// авто-refresh при зміні брейкпоінту
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
}

/* --------------------------- gpt ---------------------------- */

async function ensureGpt() {
	if (!ENABLE_GAM) return;
	if (w.googletag?.apiReady || w.__ads.gptLoading) return;
	w.__ads.gptLoading = true;
	w.googletag = w.googletag || { cmd: [] };
	await loadScript(GPT_SRC, "gpt-lib");
}

function slotExists(id) {
	try {
		const slots = w.googletag?.pubads?.().getSlots?.() || [];
		return slots.some((s) => s.getSlotElementId?.() === id);
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

function defineGptSlots({ top, side }) {
	if (!USE_GAM) return;

	w.googletag.cmd.push(() => {
		const pubads = w.googletag.pubads();
		pubads.disableInitialLoad?.();
		pubads.enableSingleRequest?.();
		pubads.setCentering?.(true);
		// НЕ колапсимо пусті слоти — щоб плейсхолдер не зникав
		//pubads.collapseEmptyDivs?.();

		if (top && !slotExists(top.id)) {
			const s = w.googletag.defineSlot("/1234567/ad-top", TOP_SIZES, top.id);
			if (s) {
				s.addService(pubads);
				s.setTargeting("pos", "top");
			}
		}
		if (side && !slotExists(side.id)) {
			const s = w.googletag.defineSlot("/1234567/ad-side", SIDE_SIZES, side.id);
			if (s) {
				s.addService(pubads);
				s.setTargeting("pos", "side");
			}
		}

		pubads.addEventListener("slotRenderEnded", (ev) => {
			const id = ev.slot.getSlotElementId();
			if (ev.isEmpty) {
				// залишаємо/повертаємо сірий банер
				ensurePlaceholder(
					id,
					"GAM empty",
					id === "ad-top" ? DEFAULT_TOP : DEFAULT_SIDE,
				);
				w.__ads.rendered[id] = false;
			} else {
				removePlaceholder(id);
				w.__ads.rendered[id] = true;
			}
			if (ADS_DEBUG)
				console.log("[GAM] slotRenderEnded", {
					id,
					isEmpty: ev.isEmpty,
					size: ev.size,
					creativeId: ev.creativeId,
					lineItemId: ev.lineItemId,
				});
		});

		w.googletag.enableServices?.();
		if (top) w.googletag.display(top.id);
		if (side) w.googletag.display(side.id);
	});
}

/* -------------------------- events -------------------------- */

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

/* -------------------- adUnits & bidders --------------------- */

function makeAdUnits({ top, side }) {
	const units = [];

	if (top) {
		units.push({
			code: top.id,
			mediaTypes: { banner: { sizes: TOP_SIZES } },
			schain: {
				ver: "1.0",
				complete: 1,
				nodes: [
					{ asi: location.hostname || "localhost", sid: "pub-0001", hp: 1 },
				],
			},
			bids: biddersForUnit(TOP_SIZES, top.id),
		});
	}

	if (side) {
		units.push({
			code: side.id,
			mediaTypes: { banner: { sizes: SIDE_SIZES } },
			schain: {
				ver: "1.0",
				complete: 1,
				nodes: [
					{ asi: location.hostname || "localhost", sid: "pub-0001", hp: 1 },
				],
			},
			bids: biddersForUnit(SIDE_SIZES, side.id),
		});
	}

	return units;
}

function biddersForUnit(sizes, unitId) {
	const list = [{ bidder: "adtelligent", params: { aid: 350975 } }];

	const has300x250 = sizes?.some?.(([w, h]) => w === 300 && h === 250);
	if (
		ENABLE_BIDMATIC &&
		BIDMATIC_SOURCE &&
		(has300x250 || unitId === "ad-side")
	) {
		const params = { source: Number(BIDMATIC_SOURCE) };
		if (BIDMATIC_SPN) params.spn = BIDMATIC_SPN;
		list.push({ bidder: "bidmatic", params });
	}
	return list;
}

/* ------------------------- rendering ------------------------ */

function renderDirect(winner) {
	const el = document.getElementById(winner.adUnitCode);
	if (!el) return;

	const W = Number(winner.width || 0);
	const H = Number(winner.height || 0);
	setWrapSize(el, [W, H]);

	removePlaceholder(winner.adUnitCode);
	el.innerHTML = "";

	const ifr = document.createElement("iframe");
	ifr.setAttribute("scrolling", "no");
	ifr.setAttribute("frameborder", "0");
	ifr.style.cssText =
		"display:block;border:0;width:100%;height:100%;overflow:hidden";
	el.appendChild(ifr);

	w.pbjs.renderAd?.(ifr.contentWindow.document, winner.adId);
	w.__ads.rendered[winner.adUnitCode] = true;
}

/* ------------------------- public API ----------------------- */

export async function initAds() {
	const slots = ensureContainers();
	if (!slots.top && !slots.side) return;

	await ensurePrebid();
	await ensureGpt();

	hookPrebidEvents();

	applyNetworkTargeting();
	defineGptSlots(slots);

	await requestAndDisplay();
}

export async function requestAndDisplay(adUnits /* optional */) {
	const slots = ensureContainers();
	const units = adUnits || makeAdUnits(slots);

	ensurePlaceholder("ad-top", "auction running…", DEFAULT_TOP);
	ensurePlaceholder("ad-side", "auction running…", DEFAULT_SIDE);

	w.pbjs.que.push(() => {
		if (!w.__ads.unitsAdded) {
			w.__ads.unitsAdded = true;
			w.pbjs.addAdUnits?.(units);
			logEvent("hb:addAdUnits", units);
		}

		const codes = units.map((u) => u.code);
		w.pbjs.requestBids?.({
			adUnitCodes: codes,
			timeout: BIDDER_TIMEOUT,
			bidsBackHandler: () => {
				const winners = w.pbjs.getHighestCpmBids?.(codes) || [];
				logEvent("hb:bidsBackHandler", { codes, winners });

				// якщо взагалі немає ставок — лишаємо сірі банери з поясненням
				if (!winners.length) {
					ensurePlaceholder("ad-top", "no bids", DEFAULT_TOP);
					ensurePlaceholder("ad-side", "no bids", DEFAULT_SIDE);
					return;
				}

				if (USE_GAM && w.googletag?.apiReady) {
					// Віддаємо hb_* у GPT і рефрешимо
					w.pbjs.setTargetingForGPTAsync?.();
					w.googletag.cmd.push(() => w.googletag.pubads().refresh());

					// safe-fallback: якщо GPT не відрендерив — малюємо напряму
					setTimeout(() => {
						winners.forEach((wBid) => {
							if (!w.__ads.rendered[wBid.adUnitCode]) {
								// GPT нічого не показав → прямий рендер
								renderDirect(wBid);
							}
						});
					}, GPT_SAFE_FALLBACK_DELAY);
				} else {
					winners.forEach(renderDirect);
				}
			},
		});
	});
}

export async function refreshAds(codes /* optional */) {
	const slots = ensureContainers();
	const units = makeAdUnits(slots);
	const adUnitCodes = codes || units.map((u) => u.code);

	ensurePlaceholder("ad-top", "refresh…", DEFAULT_TOP);
	ensurePlaceholder("ad-side", "refresh…", DEFAULT_SIDE);

	w.pbjs.que.push(() => {
		w.pbjs.requestBids?.({
			adUnitCodes,
			timeout: BIDDER_TIMEOUT,
			bidsBackHandler: () => {
				const winners = w.pbjs.getHighestCpmBids?.(adUnitCodes) || [];
				logEvent("hb:bidsBackHandler", { adUnitCodes, winners });

				if (!winners.length) {
					ensurePlaceholder("ad-top", "no bids", DEFAULT_TOP);
					ensurePlaceholder("ad-side", "no bids", DEFAULT_SIDE);
					return;
				}

				if (USE_GAM && w.googletag?.apiReady) {
					w.pbjs.setTargetingForGPTAsync?.();
					w.googletag.cmd.push(() => w.googletag.pubads().refresh());
					setTimeout(() => {
						winners.forEach((wBid) => {
							if (!w.__ads.rendered[wBid.adUnitCode]) renderDirect(wBid);
						});
					}, GPT_SAFE_FALLBACK_DELAY);
				} else {
					winners.forEach(renderDirect);
				}
			},
		});
	});
}
