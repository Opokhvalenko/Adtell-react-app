import { ENABLE_GAM, GAM_NETWORK_CALLS } from "virtual:ads-config";
import { composeAdsCss } from "/modules/ads.styles.js";

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
	style.textContent = composeAdsCss({ includeIframe: false });
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

function ensureContainers() {
	injectStylesOnce();
	const top = document.getElementById("ad-top");
	const side = document.getElementById("ad-side");
	const beautiful = document.getElementById("ad-beautiful");
	return {
		top: top ? { id: "ad-top", element: top } : null,
		side: side ? { id: "ad-side", element: side } : null,
		beautiful: beautiful ? { id: "ad-beautiful", element: beautiful } : null,
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
		return (w.googletag?.pubads?.().getSlots?.() || []).some(
			(s) => s.getSlotElementId?.() === id,
		);
	} catch {
		return false;
	}
}

function defineSlots({ top, side, beautiful }) {
	if (!USE_GAM) return;

	w.googletag.cmd.push(() => {
		const pubads = w.googletag.pubads();
		pubads.enableSingleRequest?.();
		pubads.setCentering?.(true);

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
		if (beautiful && !slotExists(beautiful.id)) {
			const s = w.googletag.defineSlot(
				"/1234567/ad-beautiful",
				[
					[300, 250],
					[728, 90],
				],
				beautiful.id,
			);
			if (s) {
				s.addService(pubads);
				s.setTargeting("pos", "beautiful");
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
		if (beautiful) w.googletag.display(beautiful.id);
	});
}

export async function initAds() {
	const slots = ensureContainers();
	if (!slots.top && !slots.side && !slots.beautiful) return;
	await ensureGpt();
	if (!USE_GAM) {
		for (const id of ["ad-top", "ad-side", "ad-beautiful"]) {
			if (document.getElementById(id)) emitEmpty(id);
		}
		return;
	}
	defineSlots(slots);
}

export async function refreshAds() {
	if (!USE_GAM) return;
	w.googletag?.cmd.push(() => w.googletag.pubads().refresh());
}

export async function requestAndDisplay() {}
