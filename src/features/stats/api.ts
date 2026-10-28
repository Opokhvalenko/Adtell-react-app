import { ANALYTICS_STATS } from "@/config/analytics";
import { apiFetch } from "@/lib/http";
import type { MetricKey, StatRow } from "./types";

export interface StatsQuery {
	from: string;
	to: string;
	groupBy: string;
	metrics: MetricKey[];
}

/** A failed stats request; the UI maps the status to its own message, never the server text. */
export class StatsRequestError extends Error {
	constructor(readonly status: number) {
		super(`Stats request failed with status ${status}`);
		this.name = "StatsRequestError";
	}
}

function isStatRowArray(v: unknown): v is StatRow[] {
	return Array.isArray(v) && v.every((x) => !!x && typeof x === "object");
}

/**
 * Server statistics only. An error is shown as an error: substituting local auction data made
 * a broken backend look like a working one.
 */
export async function fetchStats(q: StatsQuery): Promise<StatRow[]> {
	const params = new URLSearchParams({
		from: q.from,
		to: q.to,
		groupBy: q.groupBy,
	});
	if (q.metrics.length) params.set("metrics", q.metrics.join(","));

	const res = await apiFetch(`${ANALYTICS_STATS}?${params.toString()}`);
	if (!res.ok) throw new StatsRequestError(res.status);
	const data: unknown = await res.json();
	return isStatRowArray(data) ? data : [];
}

const HTTP_UNAUTHORIZED = 401;
const HTTP_BAD_REQUEST = 400;
const HTTP_TOO_MANY = 429;

export const STATS_ERROR_TEXT = {
	session: "Your session has expired. Please sign in again.",
	range: "Choose a valid date range of up to 90 days.",
	busy: "Too many requests. Try again in a minute.",
	unavailable: "Statistics are temporarily unavailable.",
} as const;

export function statsErrorMessage(error: unknown): string {
	const status = error instanceof StatsRequestError ? error.status : 0;
	if (status === HTTP_UNAUTHORIZED) return STATS_ERROR_TEXT.session;
	if (status === HTTP_BAD_REQUEST) return STATS_ERROR_TEXT.range;
	if (status === HTTP_TOO_MANY) return STATS_ERROR_TEXT.busy;
	return STATS_ERROR_TEXT.unavailable;
}
