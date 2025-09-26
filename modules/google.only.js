// modules/google.only.js
// Чистий GAM з «сірими банерами», коли інвентар порожній або мережеві виклики вимкнені.

import { ENABLE_GAM, GAM_NETWORK_CALLS } from "virtual:ads-config";

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

const DEFAULT_TOP = [728, 90];
const DEFAULT_SIDE = [300, 250];

const w = window;
w.__ads = w.__ads || {};
w.__adslog = w.__adslog || [];
w.__ads.rendered = w.__ads.rendered || {};

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

function injectStylesOnce() {
	if (w.__ads.stylesInjectedG) return;
	w.__ads.stylesInjectedG = true;
	const style = document.createElement("style");
	style.textContent = `
    .ads-wrap{position:relative;display:block;margin:0 auto}
    .ads-slot{position:relative;display:block;width:100%;height:100%;min-height:50px;
              overflow:hidden;border:1px solid rgba(0,0,0,.1);border-radius:12px;background:#f3f4f6}
    .ads-placeholder{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:.5rem;
                     font:12px/1.2 system-ui;color:#6b7280;
                     background-image:repeating-linear-gradient(45deg,rgba(0,0,0,.03) 0 10px,rgba(0,0,0,.05) 10px 20px)}
    .ads-dot{width:8px;height:8px;border-radius:9999px;background:#9ca3af;animation:ads-pulse 1.4s ease-in-out infinite}
    @keyframes ads-pulse{0%,100%{transform:scale(1);opacity:.6}50%{transform:scale(1.3);opacity:1}}
  `;
	document.head.appendChild(style);
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

function ensurePlaceholder(id, text, size) {
	const el = document.getElementById(id);
	if (!el) return;
	let ph = el.querySelector(".ads-placeholder");
	if (!ph) {
		ph = document.createElement("div");
		ph.className = "ads-placeholder";
		el.appendChild(ph);
	}
	ph.innerHTML = `<span class="ads-dot"></span><span>${id}: ${text}</span>`;
	setWrapSize(el, size || (id === "ad-top" ? DEFAULT_TOP : DEFAULT_SIDE));
}

function pushLog(type, payload) {
	const item = { ts: Date.now(), type, payload };
	w.__adslog.unshift(item);
	w.dispatchEvent(new CustomEvent("ads:gpt", { detail: item }));
	// eslint-disable-next-line no-console
	console.log("[GAM]", type, payload);
}

function emitEmpty(id) {
	ensurePlaceholder(
		id,
		"GAM network disabled (local)",
		id === "ad-top" ? DEFAULT_TOP : DEFAULT_SIDE,
	);
	const item = {
		ts: Date.now(),
		type: "gpt:slotRenderEnded",
		payload: {
			id,
			isEmpty: true,
			size: null,
			creativeId: null,
			lineItemId: null,
		},
	};
	w.__adslog.unshift(item);
	w.dispatchEvent(new CustomEvent("ads:gpt", { detail: item }));
}

/* --------------------- containers & GPT --------------------- */

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
		sideWrap.className = "ads-wrap";
		sideWrap.style.width = "300px";
		sideWrap.style.height = "600px";
		const side = document.createElement("div");
		side.id = "ad-side";
		side.className = "ads-slot";
		sideWrap.appendChild(side);
		document.body.appendChild(sideWrap);
	}

	// початкові плейсхолдери
	ensurePlaceholder("ad-top", "waiting for GAM…", DEFAULT_TOP);
	ensurePlaceholder("ad-side", "waiting for GAM…", DEFAULT_SIDE);

	return {
		top: document.getElementById("ad-top"),
		side: document.getElementById("ad-side"),
	};
}

async function ensureGpt() {
	if (!USE_GAM) return;
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

function defineSlots({ top, side }) {
	if (!USE_GAM) return;

	w.googletag.cmd.push(() => {
		const pubads = w.googletag.pubads();
		pubads.enableSingleRequest?.();
		pubads.setCentering?.(true);
		// НЕ колапсимо пусті слоти — щоб плейсхолдер не зникав
		// pubads.collapseEmptyDivs?.();

		// простий сітьовий таргетинг
		pubads.setTargeting("site", location.hostname || "localhost");
		pubads.setTargeting(
			"section",
			location.pathname.replace(/\//g, "_") || "home",
		);
		pubads.setTargeting("env", import.meta.env.MODE || "dev");

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
				ensurePlaceholder(
					id,
					"GAM empty (house)",
					id === "ad-top" ? DEFAULT_TOP : DEFAULT_SIDE,
				);
				w.__ads.rendered[id] = false;
			} else {
				document
					.getElementById(id)
					?.querySelector(".ads-placeholder")
					?.remove();
				w.__ads.rendered[id] = true;
			}
			pushLog("gpt:slotRenderEnded", {
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

/* --------------------------- API ---------------------------- */

export async function initAds() {
	const slots = ensureContainers();
	if (!slots.top && !slots.side) return;

	await ensureGpt();

	if (!USE_GAM) {
		// локальний режим без мережі: емітуємо "порожні" рендери і лишаємо плейсхолдери
		for (const id of ["ad-top", "ad-side"]) {
			emitEmpty(id);
		}
		return;
	}

	defineSlots(slots);
}

export async function refreshAds() {
	if (!USE_GAM) return;
	w.googletag?.cmd.push(() => w.googletag.pubads().refresh());
}
