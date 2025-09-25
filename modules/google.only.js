// Чистий GAM (без Prebid): автоінʼєкція слотів + GPT + house fallback + можливість відключити мережу
import { ADS_DEBUG, ENABLE_GAM, GAM_NETWORK_CALLS } from "virtual:ads-config";

const GPT_SRC = "https://securepubads.g.doubleclick.net/tag/js/gpt.js";
const w = window;
w.__ads = w.__ads || {};

/* -------------------- utils & styles -------------------- */
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
function pickBestSize(containerW, sizes) {
	const sorted = [...sizes].sort((a, b) => b[0] - a[0]);
	const fit = sorted.find(([w]) => w <= containerW);
	return fit ?? sorted[sorted.length - 1];
}

/* -------------------- containers (auto-inject) -------------------- */
function ensureContainers() {
	injectStylesOnce();

	const main =
		document.querySelector("main") ||
		document.getElementById("root") ||
		document.body;

	// TOP — вставляємо ПЕРЕД main
	let topWrap = document.querySelector('[data-ads="top-wrap"]');
	if (!topWrap) {
		topWrap = document.createElement("div");
		topWrap.dataset.ads = "top-wrap";
		topWrap.className = "ads-wrap";
		topWrap.style.marginBottom = "16px";
		topWrap.style.width = "100%";
		const top = document.createElement("div");
		top.id = "ad-top";
		top.className = "ads-slot";
		topWrap.appendChild(top);
		main.parentElement?.insertBefore(topWrap, main);
	}

	// SIDE — фіксований праворуч
	let sideWrap = document.querySelector('[data-ads="side-wrap"]');
	if (!sideWrap) {
		sideWrap = document.createElement("div");
		sideWrap.dataset.ads = "side-wrap";
		sideWrap.className = "ads-wrap ads-side-fixed";
		sideWrap.style.width = "300px";
		sideWrap.style.height = "600px";
		const side = document.createElement("div");
		side.id = "ad-side";
		side.className = "ads-slot";
		sideWrap.appendChild(side);
		document.body.appendChild(sideWrap);
	}

	// Плейсхолдери
	for (const id of ["ad-top", "ad-side"]) {
		const slot = document.getElementById(id);
		if (slot && !slot.querySelector(".ads-placeholder")) {
			const ph = document.createElement("div");
			ph.className = "ads-placeholder";
			ph.innerHTML = `<span class="ads-dot"></span><span>${id}: waiting for GAM…</span>`;
			slot.appendChild(ph);
		}
	}

	// Позиціюємо side
	function positionSide() {
		const rect = (
			document.querySelector("main") ||
			document.getElementById("root") ||
			document.body
		).getBoundingClientRect();
		const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
		const topOffset = rect.top + scrollY + 8;
		const gap = 16;
		const left = rect.right + gap;
		sideWrap.style.top = `${topOffset}px`;
		sideWrap.style.left = `${Math.min(Math.max(left, 8), window.innerWidth - 308)}px`;
	}
	if (!w.__ads.sidePosBound) {
		w.__ads.sidePosBound = true;
		window.addEventListener("resize", positionSide);
		window.addEventListener("scroll", positionSide);
	}
	positionSide();

	// Ресайз TOP
	function resizeTop() {
		const sizes = [
			[970, 90],
			[728, 90],
			[468, 60],
			[320, 50],
		];
		const cw = topWrap.getBoundingClientRect().width || window.innerWidth;
		const [W, H] = pickBestSize(cw, sizes);
		topWrap.style.maxWidth = `${W}px`;
		topWrap.style.height = `${H}px`;
	}
	resizeTop();
	if (!w.__ads.topRO) {
		w.__ads.topRO = new ResizeObserver(resizeTop);
		w.__ads.topRO.observe(topWrap);
	}

	// Розмір SIDE
	function resizeSide() {
		const sizes = [
			[300, 600],
			[300, 250],
		];
		const [W, H] = pickBestSize(300, sizes);
		sideWrap.style.width = `${W}px`;
		sideWrap.style.height = `${H}px`;
	}
	resizeSide();

	return {
		top: document.getElementById("ad-top"),
		side: document.getElementById("ad-side"),
	};
}

/* -------------------- GPT -------------------- */
async function ensureGpt() {
	if (!ENABLE_GAM) return;
	if (w.googletag?.apiReady || w.__ads.gptLoading) return;
	w.__ads.gptLoading = true;
	// створюємо чергу ДО завантаження скрипта
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

function renderHouse(el) {
	const ph = el.querySelector(".ads-placeholder");
	if (!ph) return;
	ph.innerHTML = `<span class="ads-dot"></span><span>${el.id}: house placeholder</span>`;
	ph.style.backgroundImage =
		"repeating-linear-gradient(45deg, rgba(0,0,0,.03) 0 10px, rgba(0,0,0,.05) 10px 20px)";
}

/* -------------------- Логи GPT у UI -------------------- */
function pushLog(type, payload) {
	w.__adslog = w.__adslog || [];
	const item = { ts: Date.now(), type, payload };
	w.__adslog.unshift(item);
	w.dispatchEvent(new CustomEvent("ads:gpt", { detail: item }));
	if (ADS_DEBUG) console.log(`[GAM] ${type}`, payload);
}

/* -------------------- Реальний режим (мережеві виклики) -------------------- */
function hookGptEvents() {
	if (w.__ads.gptEventsHooked) return;
	w.__ads.gptEventsHooked = true;
	w.googletag.cmd.push(() => {
		const pubads = w.googletag.pubads();
		pubads.addEventListener("slotRenderEnded", (ev) => {
			const id = ev.slot.getSlotElementId();
			const el = document.getElementById(id);
			if (el) {
				if (ev.isEmpty) renderHouse(el);
				else el.querySelector(".ads-placeholder")?.remove();
			}
			pushLog("slotRenderEnded", {
				id,
				isEmpty: ev.isEmpty,
				size: ev.size,
				creativeId: ev.creativeId,
				lineItemId: ev.lineItemId,
			});
		});
	});
}
function defineGptSlotsReal({ top, side }) {
	if (!ENABLE_GAM) return;
	w.googletag.cmd.push(() => {
		const pubads = w.googletag.pubads();
		pubads.enableSingleRequest?.();
		pubads.setCentering?.(true);
		pubads.collapseEmptyDivs?.();

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

		if (top && !slotExists(top.id)) {
			const s = w.googletag.defineSlot("/1234567/ad-top", TOP_SIZES, top.id);
			if (s) s.addService(pubads);
			w.googletag.display(top.id);
		}
		if (side && !slotExists(side.id)) {
			const s = w.googletag.defineSlot("/1234567/ad-side", SIDE_SIZES, side.id);
			if (s) s.addService(pubads);
			w.googletag.display(side.id);
		}
		w.googletag.enableServices?.();
	});
}

/* -------------------- Мок-режим (без мережі) -------------------- */
function defineGptSlotsMock({ top, side }) {
	// просто відмалюємо плейсхолдери і кинемо події у лог
	const ids = [top?.id, side?.id].filter(Boolean);
	for (const id of ids) {
		const el = document.getElementById(id);
		if (el) renderHouse(el);
		pushLog("slotRenderEnded", {
			id,
			isEmpty: true,
			size: null,
			creativeId: null,
			lineItemId: null,
		});
	}
}

/* -------------------- Public API -------------------- */
export async function initAds() {
	const slots = ensureContainers();
	if (!slots.top && !slots.side) return;

	if (ENABLE_GAM && GAM_NETWORK_CALLS) {
		await ensureGpt(); // створює googletag.cmd
		hookGptEvents();
		defineGptSlotsReal(slots);
	} else {
		// узагалі не торкаємось googletag ⇒ ніяких 400/CORS у Network
		defineGptSlotsMock(slots);
	}
}

export async function requestAndDisplay() {
	// у реальному режимі просто робимо refresh, у мок-режимі нічого не треба
	if (ENABLE_GAM && GAM_NETWORK_CALLS) {
		await ensureGpt();
		w.googletag?.cmd.push(() => w.googletag.pubads().refresh());
	}
}

export async function refreshAds() {
	if (ENABLE_GAM && GAM_NETWORK_CALLS) {
		await ensureGpt();
		w.googletag?.cmd.push(() => w.googletag.pubads().refresh());
	}
}
