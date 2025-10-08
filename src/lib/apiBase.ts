export const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
export const FEED_URL =
  (import.meta.env.VITE_FEED_URL ?? "").trim() ||
  (API_BASE ? `${API_BASE}/ads/feeds.json` : "/ads/feeds.json");