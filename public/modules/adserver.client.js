const G = globalThis;
const DEFAULT_ENDPOINT =
	G.__ads?.endpoint ||
	(typeof import.meta !== "undefined"
		? import.meta.env?.VITE_ADSERVER_ENDPOINT
		: "") ||
	"";

/**
 * @returns {Promise<{
 *  lineItemId:string,cpm:number,w:number,h:number,
 *  adm:string,adomain:string[],ttl:number,cur:string
 * }|null>}
 */
export async function requestBid({
	size,
	type = "banner",
	geo,
	uid: inUid,
	floor,
	endpoint,
}) {
	const ep = (endpoint || DEFAULT_ENDPOINT || "").replace(/\/$/, "");
	const url = new URL(`${ep}/api/bid`);
	url.searchParams.set("size", size);
	url.searchParams.set("type", type);
	if (geo) url.searchParams.set("geo", geo);
	const uid = inUid ?? (G.__ads?.uid || "");
	if (uid) url.searchParams.set("uid", uid);
	if (typeof floor === "number")
		url.searchParams.set("floorCpm", String(floor));

	const res = await fetch(url.toString(), { credentials: "include" }).catch(
		() => null,
	);
	if (!res || !res.ok) return null;
	if (res.status === 204) return null;
	return await res.json();
}

export function renderBidInto(el, bid, { endpoint } = {}) {
	if (!el || !bid) return;
	const root = el.shadowRoot || el.attachShadow?.({ mode: "open" }) || el;
	const wrap = document.createElement("div");
	wrap.style.display = "contents";
	wrap.innerHTML = bid.adm;
	root.replaceChildren(wrap);

	const base = (endpoint || DEFAULT_ENDPOINT || "").replace(/\/$/, "");
	wrap.querySelectorAll('img[src^="/"]').forEach((img) => {
		const s = img.getAttribute("src") || "";
		img.src = base + s;
	});
	wrap.querySelectorAll('a[href^="/"]').forEach((a) => {
		const h = a.getAttribute("href") || "";
		a.href = base + h;
	});
}
