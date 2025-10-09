export const ANALYTICS_EVENTS =
	(import.meta.env.VITE_REPORTING_URL as string | undefined) ||
	"/api/analytics/events"; // лишаємо відносним: піде через proxy

export const ANALYTICS_STATS =
	(import.meta.env.VITE_STATS_URL as string | undefined) || "/api/stats"; // фронт завжди б’є по /api/stats

// для зворотної сумісності
export const ANALYTICS_ENDPOINT = ANALYTICS_EVENTS;
