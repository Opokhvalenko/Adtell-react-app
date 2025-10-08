export const ANALYTICS_ENDPOINT =
	(import.meta.env?.VITE_REPORTING_URL as string) || "/api/analytics/events";
