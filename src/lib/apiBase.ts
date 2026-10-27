/**
 * In production the frontend calls the API on its own domain: `vercel.json` rewrites `/api/*`
 * to the backend. Same-origin requests keep the session cookies first-party (`SameSite=Lax`)
 * and need no CORS. In development Vite proxies `/api` the same way; `VITE_DEV_API_ORIGIN` can
 * point the dev build at another backend.
 */
const ORIGIN = import.meta.env.DEV
	? ((import.meta.env.VITE_DEV_API_ORIGIN as string | undefined) ?? "").replace(
			/\/$/,
			"",
		)
	: "";

export const API_ORIGIN = ORIGIN;
export const API_BASE = ORIGIN ? `${ORIGIN}/api` : "/api";
