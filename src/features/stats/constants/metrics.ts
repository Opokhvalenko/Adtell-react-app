import type { MetricKey } from "../types";

export const METRICS: Record<
	MetricKey,
	{ label: string; fmt: (n: number | null | undefined) => string }
> = {
	count: { label: "Events", fmt: (n) => (n ?? 0).toLocaleString() },
	wins: { label: "Wins", fmt: (n) => (n ?? 0).toLocaleString() },
	cpmAvg: { label: "eCPM avg", fmt: (n) => (n == null ? "—" : n.toFixed(2)) },
};
