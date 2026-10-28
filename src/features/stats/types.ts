/** What `GET /api/analytics/stats` can compute (it groups by `day`, `event`, `adapter`). */
export const METRIC_KEYS = ["count", "wins", "cpmAvg"] as const;

export type MetricKey = (typeof METRIC_KEYS)[number];

export const isMetricKey = (value: unknown): value is MetricKey =>
	(METRIC_KEYS as readonly unknown[]).includes(value);

/** One row of the stats response; only the requested groups and metrics are present. */
export interface StatRow {
	/** UTC calendar day, `YYYY-MM-DD`. */
	day?: string;
	event?: string;
	adapter?: string;
	count?: number;
	wins?: number;
	/** Average CPM of winning bids; `null` when there were no wins. */
	cpmAvg?: number | null;
}
