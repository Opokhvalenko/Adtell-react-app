const G = globalThis;

/* ───────────────── endpoint resolution ───────────────── */
const selfUrl = new URL(import.meta.url, location.href);
const QP_ENDPOINT = selfUrl.searchParams.get("endpoint") || "";
const META_ENDPOINT =
	document
		.querySelector('meta[name="ads-endpoint"]')
		?.getAttribute("content") || "";

const DEFAULT_ENDPOINT =
	(G.__ads && typeof G.__ads.endpoint === "string" && G.__ads.endpoint) ||
	QP_ENDPOINT ||
	META_ENDPOINT ||
	"";

/** @param {string} base */
function makeBidUrl(base) {
	if (base && typeof base === "string" && base.trim()) {
		const ep = base.replace(/\/$/, "");
		return new URL(`${ep}/api/bid`);
	}
	try {
		console.warn(
			"[adserver] endpoint is empty — using same-origin /api/bid (ensure Vercel proxy or set window.__ads.endpoint)",
		);
		return new URL("/api/bid", window.location.origin);
	} catch {
		return new URL("http://localhost:5173/api/bid");
	}
}

/**
 * @typedef {{lineItemId:string,cpm:number,w:number,h:number,adm:string,adomain:string[],ttl:number,cur:string}} Bid
 * @returns {Promise<Bid|null>}
 */
export async function requestBid({
	size,
	type = "banner",
	geo,
	uid: inUid,
	floor,
	endpoint,
}) {
	const url = makeBidUrl(endpoint || DEFAULT_ENDPOINT);
	url.searchParams.set("size", size);
	url.searchParams.set("type", type);
	if (geo) url.searchParams.set("geo", geo);
	const uid = inUid ?? (G.__ads?.uid || "");
	if (uid) url.searchParams.set("uid", uid);
	if (typeof floor === "number")
		url.searchParams.set("floorCpm", String(floor));

	const res = await fetch(String(url), { credentials: "include" }).catch(
		() => null,
	);
	if (!res || !res.ok || res.status === 204) return null;
	return res.json();
}

/** @param {HTMLElement} el @param {Bid} bid @param {{endpoint?:string}} [opts] */
export function renderBidInto(el, bid, { endpoint } = {}) {
	if (!el || !bid) return;
	const root = el.shadowRoot || el.attachShadow?.({ mode: "open" }) || el;
	const wrap = document.createElement("div");
	wrap.style.display = "contents";
	wrap.innerHTML = bid.adm;
	root.replaceChildren(wrap);

	const base = (endpoint || DEFAULT_ENDPOINT || "").replace(/\/$/, "");
	if (base) {
		wrap.querySelectorAll('img[src^="/"]').forEach((img) => {
			const s = img.getAttribute("src") || "";
			img.src = base + s;
		});
		wrap.querySelectorAll('a[href^="/"]').forEach((a) => {
			const h = a.getAttribute("href") || "";
			a.href = base + h;
		});
	}
}

/* ─────────────── глобальний доступ для креативів ─────────────── */
G.adserver = Object.freeze({
	requestBid,
	renderBidInto,
	setEndpoint(v) {
		G.__ads = { ...(G.__ads || {}), endpoint: String(v || "") };
	},
});
