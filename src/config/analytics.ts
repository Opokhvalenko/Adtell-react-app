import { API_BASE } from "@/lib/apiBase";

/**
 * Always the site's own `/api` (Vercel rewrites it to the backend): no env variable or global
 * can point events or stats at another origin, where the session cookie would not be sent.
 */
export const ANALYTICS_EVENTS = `${API_BASE}/analytics/events`;
export const ANALYTICS_STATS = `${API_BASE}/analytics/stats`;
