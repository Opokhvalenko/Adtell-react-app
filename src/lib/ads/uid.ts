import { reportError } from "@/reporting/errors-lazy";

export function ensureAdUid(): string {
	const KEY = "ad_uid";
	try {
		const existing = localStorage.getItem(KEY);
		if (existing) {
			window.__ads = { ...(window.__ads ?? {}), uid: existing };
			return existing;
		}
		const uid = Math.random().toString(36).slice(2) + Date.now().toString(36);
		localStorage.setItem(KEY, uid);
		window.__ads = { ...(window.__ads ?? {}), uid };
		return uid;
	} catch (err) {
		const fallback = `mem_${Math.random().toString(36).slice(2)}`;
		reportError(err, { where: "ensureAdUid", fallback });
		window.__ads = { ...(window.__ads ?? {}), uid: fallback };
		return fallback;
	}
}
