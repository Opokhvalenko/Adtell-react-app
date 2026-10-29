import { API_BASE } from "./apiBase";
import { apiFetch } from "./http";

export type SessionUser = { id: string; email: string };

/** A failed sign-in, registration or demo request. The UI picks its own text by status. */
export class AuthRequestError extends Error {
	constructor(readonly status: number) {
		super(`Auth request failed with status ${status}`);
		this.name = "AuthRequestError";
	}
}

/** Always a JSON body: the server refuses others, which a form on another site could send. */
async function postAuth(
	path: "login" | "register" | "demo",
	body: { email: string; password: string } | Record<string, never>,
): Promise<SessionUser> {
	const res = await fetch(`${API_BASE}/auth/${path}`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		credentials: "include",
		body: JSON.stringify(body),
	});
	if (!res.ok) throw new AuthRequestError(res.status);
	return (await res.json()) as SessionUser;
}

/** The session lives in httpOnly cookies set by the backend; the response is only the user. */
export function apiLogin(
	email: string,
	password: string,
): Promise<SessionUser> {
	return postAuth("login", { email, password });
}

export function apiRegister(
	email: string,
	password: string,
): Promise<SessionUser> {
	return postAuth("register", { email, password });
}

/** The shared demo account: the server signs in without a password (404 when not configured). */
export function apiDemoLogin(): Promise<SessionUser> {
	return postAuth("demo", {});
}

const HTTP_UNAUTHORIZED = 401;
const HTTP_NOT_FOUND = 404;
const HTTP_CONFLICT = 409;
const HTTP_TOO_MANY = 429;

export const AUTH_ERROR_TEXT = {
	credentials: "Wrong email or password.",
	taken: "This email is already registered.",
	busy: "Too many attempts. Try again in a few minutes.",
	demoUnavailable: "The demo account is not available right now.",
	failed: "Something went wrong. Please try again.",
} as const;

export function authErrorMessage(error: unknown): string {
	const status = error instanceof AuthRequestError ? error.status : 0;
	if (status === HTTP_UNAUTHORIZED) return AUTH_ERROR_TEXT.credentials;
	if (status === HTTP_CONFLICT) return AUTH_ERROR_TEXT.taken;
	if (status === HTTP_TOO_MANY) return AUTH_ERROR_TEXT.busy;
	if (status === HTTP_NOT_FOUND) return AUTH_ERROR_TEXT.demoUnavailable;
	return AUTH_ERROR_TEXT.failed;
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
