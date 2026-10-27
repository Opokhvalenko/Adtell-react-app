import { API_BASE } from "./apiBase";
import { apiFetch } from "./http";

export type SessionUser = { id: string; email: string };

async function readBody(res: Response): Promise<unknown> {
	const text = await res.text();
	return (res.headers.get("content-type") || "").includes("json") && text
		? JSON.parse(text)
		: text;
}

async function postCredentials(
	path: "login" | "register",
	email: string,
	password: string,
): Promise<SessionUser> {
	const res = await fetch(`${API_BASE}/auth/${path}`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		credentials: "include",
		body: JSON.stringify({ email, password }),
	});
	const data = await readBody(res);
	if (!res.ok) throw typeof data === "string" ? new Error(data) : data;
	return data as SessionUser;
}

/** The session lives in httpOnly cookies set by the backend; the response is only the user. */
export function apiLogin(
	email: string,
	password: string,
): Promise<SessionUser> {
	return postCredentials("login", email, password);
}

export function apiRegister(
	email: string,
	password: string,
): Promise<SessionUser> {
	return postCredentials("register", email, password);
}

/** Current user, refreshing an expired access token once; `null` when not signed in. */
export async function fetchMe(): Promise<SessionUser | null> {
	const res = await apiFetch(`${API_BASE}/auth/me`);
	return res.ok ? ((await res.json()) as SessionUser) : null;
}

export async function apiLogout(): Promise<void> {
	await fetch(`${API_BASE}/auth/logout`, {
		method: "POST",
		credentials: "include",
	});
}
