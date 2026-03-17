let memoryUid: string | null = null;

export function ensureAdUid(): string {
	const LS = "ad_uid";

	try {
		const stored = localStorage.getItem(LS);
		if (stored) {
			memoryUid = stored;
			window.__ads = { ...(window.__ads ?? {}), uid: stored };
			return stored;
		}
	} catch {}

	if (!memoryUid) {
		memoryUid = Math.random().toString(36).slice(2) + Date.now().toString(36);
	}

	try {
		localStorage.setItem(LS, memoryUid);
	} catch {}

	window.__ads = { ...(window.__ads ?? {}), uid: memoryUid };
	return memoryUid;
}
