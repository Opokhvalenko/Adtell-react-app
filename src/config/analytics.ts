declare global {
	interface Window {
		__ads?: { endpoint?: string; uid?: string };
	}
}

const g = globalThis as unknown as { __ads?: { endpoint?: string } };

const BASE =
	g.__ads?.endpoint ||
	import.meta.env.VITE_ANALYTICS_BASE ||
	import.meta.env.VITE_API_URL ||
	"";

const EVENTS = import.meta.env.VITE_REPORTING_URL || "/api/analytics/events";
const STATS = import.meta.env.VITE_STATS_URL || "/api/stats";

const join = (b: string, p: string) =>
	`${b.replace(/\/$/, "")}${p.startsWith("/") ? "" : "/"}${p}`;

export const ANALYTICS_EVENTS = BASE ? join(BASE, EVENTS) : EVENTS;
export const ANALYTICS_STATS = BASE ? join(BASE, STATS) : STATS;
export const ANALYTICS_ENDPOINT = ANALYTICS_EVENTS;
