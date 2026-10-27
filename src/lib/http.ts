import { API_BASE } from "./apiBase";

const UNAUTHORIZED = 401;
const REFRESH_URL = `${API_BASE}/auth/refresh`;

let refreshing: Promise<boolean> | null = null;

/**
 * Exchanges the refresh cookie for a new session. Parallel callers share one request: the
 * backend rotates refresh tokens, so a second request with the same cookie would be rejected.
 */
export function refreshSession(): Promise<boolean> {
	refreshing ??= fetch(REFRESH_URL, { method: "POST", credentials: "include" })
		.then((res) => res.ok)
		.catch(() => false)
		.finally(() => {
			refreshing = null;
		});
	return refreshing;
}

/** `fetch` with the session cookies; on 401 refreshes the session once and retries. */
export async function apiFetch(
	url: string,
	init: RequestInit = {},
): Promise<Response> {
	const send = () => fetch(url, { ...init, credentials: "include" });
	const res = await send();
	if (res.status !== UNAUTHORIZED) return res;
	return (await refreshSession()) ? send() : res;
}
