/**
 * Direct-sold line items from our own ad server (created on the "Create ad" page).
 * Like direct deals in a real ad server they outrank programmatic (Prebid) bids, and they are
 * rendered in the same sandboxed iframe as any other bid.
 *
 * The request goes to /api/bid on the site's own origin (Vercel rewrite in production,
 * Vite proxy in development), so no CORS and no third-party cookie are involved.
 */

export const OWN_AD_SERVER = "adtell";
const REQUEST_TIMEOUT_MS = 800;
const NO_LINE_ITEM = 204;

/** @param {string} code @param {[number, number]} size */
export async function fetchDirectSold(code, [width, height]) {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
	try {
		const query = new URLSearchParams({
			size: `${width}x${height}`,
			type: "banner",
		});
		const res = await fetch(`/api/bid?${query}`, {
			credentials: "same-origin",
			signal: controller.signal,
		});
		if (!res.ok || res.status === NO_LINE_ITEM) return null;
		const body = await res.json();
		if (!body?.adm) return null;
		return {
			adUnitCode: code,
			bidderCode: OWN_AD_SERVER,
			ad: String(body.adm),
			width: Number(body.w) || width,
			height: Number(body.h) || height,
			cpm: Number(body.cpm) || 0,
			creativeId: String(body.lineItemId || ""),
		};
	} catch {
		// Ad server down or slow: the programmatic auction still fills the slot
		return null;
	} finally {
		clearTimeout(timer);
	}
}

/** @param {Array<[string, [number, number]]>} slots code + chosen size per slot */
export async function fetchDirectSoldForSlots(slots) {
	const results = await Promise.all(
		slots.map(async ([code, size]) => [
			code,
			await fetchDirectSold(code, size),
		]),
	);
	return new Map(results.filter(([, winner]) => winner));
}
