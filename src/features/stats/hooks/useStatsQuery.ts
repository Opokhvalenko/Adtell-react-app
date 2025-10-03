import { useQuery } from "@tanstack/react-query";
import { fetchStats } from "../api";
import type { MetricKey, StatRow } from "../types";

export function useStatsQuery(q: {
	from: string;
	to: string;
	groupBy: string;
	metrics: MetricKey[];
}) {
	return useQuery<StatRow[]>({
		queryKey: ["stats", q],
		queryFn: () => fetchStats(q),
		staleTime: 30_000,
	});
}
