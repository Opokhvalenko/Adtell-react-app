export function ensureAdUid(): string {
	const LS = "ad_uid";
	let uid = localStorage.getItem(LS);

	if (!uid) {
		uid = Math.random().toString(36).slice(2) + Date.now().toString(36);
		localStorage.setItem(LS, uid);
	}

	window.__ads = { ...(window.__ads ?? {}), uid };
	return uid;
}
