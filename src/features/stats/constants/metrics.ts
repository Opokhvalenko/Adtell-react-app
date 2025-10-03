import type { MetricKey } from "../types";

export const METRICS: Record<
	MetricKey,
	{ label: string; fmt?: (n: number | undefined) => string }
> = {
	count: { label: "Events", fmt: (n) => (n ?? 0).toLocaleString() },
	requests: { label: "Requests", fmt: (n) => (n ?? 0).toLocaleString() },
	responses: { label: "Responses", fmt: (n) => (n ?? 0).toLocaleString() },
	wins: { label: "Wins", fmt: (n) => (n ?? 0).toLocaleString() },
	cpmAvg: { label: "eCPM avg", fmt: (n) => (n ?? 0).toFixed(2) },
	cpmP95: { label: "eCPM p95", fmt: (n) => (n ?? 0).toFixed(2) },
	ctr: { label: "CTR", fmt: (n) => `${Math.round((n ?? 0) * 10000) / 100}%` },
	revenue: {
		label: "Revenue",
		fmt: (n) =>
			`$${(n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
	},
};
