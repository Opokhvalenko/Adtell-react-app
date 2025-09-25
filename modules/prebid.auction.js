// Віртуальний модуль: сам створює слоти, вантажить Prebid/GAM, запускає аукціон.
// За замовчуванням рендеримо напряму (без GAM). GAM можна увімкнути через ENV.
import {
	ADS_DEBUG,
	BIDMATIC_SOURCE,
	ENABLE_BIDMATIC,
	ENABLE_GAM,
} from "virtual:ads-config";

const PREBID_SRC_LOCAL = "/prebid/prebid.js";
const PREBID_SRC_CDN =
	"https://cdn.jsdelivr.net/npm/prebid.js@10.10.0/dist/prebid.js";
const GPT_SRC = "https://securepubads.g.doubleclick.net/tag/js/gpt.js";

const PAGE_GAP = 24;
const SIDE_GAP_FROM_MAIN = 16;
const SIDE_WIDTH = 300;

const w = window;
w.__ads = w.__ads || {};

// utils

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

function injectStylesOnce() {
	if (w.__ads.stylesInjected) return;
	w.__ads.stylesInjected = true;

	const css = `
  .ads-wrap{position:relative;display:block;margin:0 auto}
  .ads-slot{position:relative;display:block;width:100%;height:100%;overflow:hidden;border:1px solid rgba(0,0,0,.1);border-radius:12px;background:#fafafa}
  .ads-slot iframe{display:block;border:0;width:100%;height:100%;overflow:hidden}
  .ads-placeholder{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:.5rem;font:12px/1.2 system-ui;color:#6b7280;background-image:repeating-linear-gradient(45deg,rgba(0,0,0,.03) 0 10px,rgba(0,0,0,.05) 10px 20px)}
  .ads-dot{width:8px;height:8px;border-radius:9999px;background:#9ca3af;animation:ads-pulse 1.4s ease-in-out infinite}
  @keyframes ads-pulse{0%,100%{transform:scale(1);opacity:.6}50%{transform:scale(1.3);opacity:1}}
  .ads-side-fixed{position:fixed;z-index:30}
  `;
	const style = document.createElement("style");
	style.dataset.ads = "styles";
	style.textContent = css;
	document.head.appendChild(style);
}

// containers (auto-inject & layout)

function ensureContainers() {
	injectStylesOnce();

	const main =
		document.querySelector("main") ||
		document.getElementById("root") ||
		document.body;

	// TOP: вставляємо блок ПЕРЕД main (щоб не перекривати контент)
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

	// SIDE: фіксований праворуч від основної колонки, але з відступами від країв
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

	// Плейсхолдери до рендера
	for (const id of ["ad-top", "ad-side"]) {
		const slot = document.getElementById(id);
		if (slot && !slot.querySelector(".ads-placeholder")) {
			const ph = document.createElement("div");
			ph.className = "ads-placeholder";
			ph.innerHTML = `<span class="ads-dot"></span><span>${id}: waiting for bid…</span>`;
			slot.appendChild(ph);
		}
	}

	// Позиціонування сайдбара поруч із головною колонкою,
	// але не ближче ніж PAGE_GAP до країв вікна.
	function positionSide() {
		const rect = (
			document.querySelector("main") ||
			document.getElementById("root") ||
			document.body
		).getBoundingClientRect();

		const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
		const topOffset = rect.top + scrollY + PAGE_GAP;

		//  left = правий край main + відступ
		const desiredLeft = rect.right + SIDE_GAP_FROM_MAIN;

		// межі, щоб не торкатися країв екрана
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

	// Підігнати TOP розмір під ширину контейнера
	function resizeTop() {
		const sizes = [
			[970, 90],
			[728, 90],
			[468, 60],
			[320, 50],
		];
		const cw = topWrap.getBoundingClientRect().width || window.innerWidth;
		const [wBest, hBest] = pickBestSize(cw, sizes);
		topWrap.style.maxWidth = `${wBest}px`;
		topWrap.style.height = `${hBest}px`;
	}
	resizeTop();
	if (!w.__ads.topRO) {
		w.__ads.topRO = new ResizeObserver(resizeTop);
		w.__ads.topRO.observe(topWrap);
	}

	// SIDE — 300x600 або 300x250
	function resizeSide() {
		const sizes = [
			[300, 600],
			[300, 250],
		];
		const [wBest, hBest] = pickBestSize(SIDE_WIDTH, sizes);
		sideWrap.style.width = `${wBest}px`;
		sideWrap.style.height = `${hBest}px`;
	}
	resizeSide();

	return {
		top: document.getElementById("ad-top"),
		side: document.getElementById("ad-side"),
	};
}

// singletons

async function ensurePrebid() {
	if (w.pbjs?.libLoaded || w.__ads.pbjsLoading) return;
	w.__ads.pbjsLoading = true;
	w.pbjs = w.pbjs || { que: [] };
	try {
		await loadScript(PREBID_SRC_LOCAL, "pbjs-lib");
	} catch {
		await loadScript(PREBID_SRC_CDN, "pbjs-lib");
	}
	if (ADS_DEBUG) w.pbjs.que.push(() => w.pbjs.setConfig?.({ debug: true }));

	// SizeConfig для брейкпоінтів
	w.pbjs.que.push(() => {
		w.pbjs.setConfig?.({
			sizeConfig: [
				{
					label: "desktop",
					mediaQuery: "(min-width: 1024px)",
					sizesSupported: [
						[970, 90],
						[728, 90],
						[300, 600],
						[300, 250],
					],
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
		});
	});

	// На зміну брейкпоінта — легкий refresh
	if (!w.__ads.bpBound) {
		w.__ads.bpBound = true;
		const activeLabel = () =>
			window.innerWidth >= 1024
				? "desktop"
				: window.innerWidth >= 768
					? "tablet"
					: "mobile";
		w.__ads.lastLabel = activeLabel();
		window.addEventListener(
			"resize",
			debounce(() => {
				const cur = activeLabel();
				if (cur !== w.__ads.lastLabel) {
					w.__ads.lastLabel = cur;
					refreshAds();
				}
			}, 250),
		);
	}
}

async function ensureGpt() {
	if (!ENABLE_GAM) return;
	if (w.googletag?.apiReady || w.__ads.gptLoading) return;
	w.__ads.gptLoading = true;
	w.googletag = w.googletag || { cmd: [] };
	await loadScript(GPT_SRC, "gpt-lib");
}

//  events

function hookPrebidEvents() {
	if (w.__ads.eventsHooked) return;
	w.__ads.eventsHooked = true;

	w.__adslog = w.__adslog || [];
	const push = (type, payload) => {
		const item = { ts: Date.now(), type, payload };
		w.__adslog.push(item);
		w.dispatchEvent(new CustomEvent("ads:prebid", { detail: item }));
	};
	const on = (name) =>
		w.pbjs.onEvent?.(name, (payload) => {
			// На успішний рендер прибираємо плейсхолдер
			if (
				(name === "adRenderSucceeded" || name === "bidWon") &&
				payload?.adUnitCode
			) {
				const el = document.getElementById(payload.adUnitCode);
				el?.querySelector(".ads-placeholder")?.remove();
			}
			push(name, payload);
		});

	w.pbjs.que.push(() =>
		[
			"auctionInit",
			"bidRequested",
			"bidResponse",
			"noBid",
			"auctionEnd",
			"bidWon",
			"adRenderSucceeded",
		].forEach(on),
	);
}

// config

function makeAdUnits({ top, side }) {
	const units = [];
	if (top) {
		const topSizes = [
			[970, 90],
			[728, 90],
			[468, 60],
			[320, 50],
		];
		units.push({
			code: top.id,
			mediaTypes: { banner: { sizes: topSizes } },
			// bidmatic НЕ додаємо, бо тут немає 300x250
			bids: biddersForUnit(topSizes, top.id),
		});
	}
	if (side) {
		const sideSizes = [
			[300, 600],
			[300, 250],
		];
		units.push({
			code: side.id,
			mediaTypes: { banner: { sizes: sideSizes } },
			// тут є 300x250 → підʼєднається bidmatic
			bids: biddersForUnit(sideSizes, side.id),
		});
	}
	return units;
}

// список біддерів для конкретного юніта за його розмірами
function biddersForUnit(sizes, unitId) {
	const list = [{ bidder: "adtelligent", params: { aid: 350975 } }];

	// Bidmatic працює з params.source (int). Додаємо його лише коли є 300x250
	const has300x250 = sizes?.some?.(([w, h]) => w === 300 && h === 250);
	if (
		ENABLE_BIDMATIC &&
		BIDMATIC_SOURCE &&
		(has300x250 || unitId === "ad-side")
	) {
		list.push({
			bidder: "bidmatic",
			params: { source: Number(BIDMATIC_SOURCE) },
		});
	}
	return list;
}

// rendering

function renderDirect(winner) {
	const el = document.getElementById(winner.adUnitCode);
	if (!el) return;

	// 1) Контейнер рівно під креатив — жодних скролів
	const W = Number(winner.width || 0);
	const H = Number(winner.height || 0);
	const wrap = el.parentElement;
	if (wrap) {
		wrap.style.width = `${W}px`;
		wrap.style.height = `${H}px`;
	}
	el.style.width = `${W}px`;
	el.style.height = `${H}px`;

	// 2) Прибираємо плейсхолдер і вміст
	el.querySelector(".ads-placeholder")?.remove();
	el.innerHTML = "";

	// 3) Створюємо iframe без скролів
	const ifr = document.createElement("iframe");
	ifr.setAttribute("scrolling", "no");
	ifr.setAttribute("marginwidth", "0");
	ifr.setAttribute("marginheight", "0");
	ifr.setAttribute("frameborder", "0");
	ifr.style.cssText =
		"display:block;border:0;width:100%;height:100%;overflow:hidden";
	el.appendChild(ifr);

	// 4) Рендеримо переможця
	w.pbjs.renderAd?.(ifr.contentWindow.document, winner.adId);
}

//  GPT (optional)

function slotExists(id) {
	try {
		const slots = w.googletag?.pubads?.().getSlots?.() || [];
		return slots.some((s) => s.getSlotElementId?.() === id);
	} catch {
		return false;
	}
}

function defineGptSlots({ top, side }) {
	if (!ENABLE_GAM) return;
	w.googletag.cmd.push(() => {
		const pubads = w.googletag.pubads();
		pubads.disableInitialLoad?.();
		pubads.enableSingleRequest?.();
		pubads.setCentering?.(true);
		pubads.collapseEmptyDivs?.();

		if (top && !slotExists(top.id)) {
			const s = w.googletag.defineSlot(
				"/1234567/ad-top",
				[
					[970, 90],
					[728, 90],
					[468, 60],
					[320, 50],
				],
				top.id,
			);
			if (s) s.addService(pubads);
		}
		if (side && !slotExists(side.id)) {
			const s = w.googletag.defineSlot(
				"/1234567/ad-side",
				[
					[300, 600],
					[300, 250],
				],
				side.id,
			);
			if (s) s.addService(pubads);
		}
		w.googletag.enableServices?.();
		if (top) w.googletag.display(top.id);
		if (side) w.googletag.display(side.id);
	});
}

//  public API

export async function initAds() {
	const slots = ensureContainers();
	if (!slots.top && !slots.side) return;

	await ensurePrebid();
	await ensureGpt();

	w.pbjs.que.push(() => w.pbjs.setConfig?.({ bidderTimeout: 2000 }));
	hookPrebidEvents();

	defineGptSlots(slots);

	await requestAndDisplay();
}

export async function requestAndDisplay(adUnits /* optional */) {
	const slots = ensureContainers();
	const units = adUnits || makeAdUnits(slots);

	w.pbjs.que.push(() => {
		// додаємо adUnits тільки один раз
		if (!w.__ads.unitsAdded) {
			w.__ads.unitsAdded = true;
			w.pbjs.addAdUnits?.(units);
		}
		const codes = units.map((u) => u.code);
		w.pbjs.requestBids?.({
			adUnitCodes: codes,
			timeout: 2000,
			bidsBackHandler: () => {
				const winners = w.pbjs.getHighestCpmBids?.(codes) || [];
				if (ENABLE_GAM && w.googletag?.apiReady) {
					w.pbjs.setTargetingForGPTAsync?.();
					w.googletag.cmd.push(() => w.googletag.pubads().refresh());
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

	w.pbjs.que.push(() => {
		w.pbjs.requestBids?.({
			adUnitCodes,
			timeout: 2000,
			bidsBackHandler: () => {
				const winners = w.pbjs.getHighestCpmBids?.(adUnitCodes) || [];
				if (ENABLE_GAM && w.googletag?.apiReady) {
					w.pbjs.setTargetingForGPTAsync?.();
					w.googletag.cmd.push(() => w.googletag.pubads().refresh());
				} else {
					winners.forEach(renderDirect);
				}
			},
		});
	});
}
