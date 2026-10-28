import { useQuery } from "@tanstack/react-query";
import { fetchStats, type StatsQuery, StatsRequestError } from "../api";
import type { StatRow } from "../types";

const MAX_RETRIES = 2;
const HTTP_CLIENT_ERROR = 400;
const HTTP_SERVER_ERROR = 500;

/** A 4xx (bad range, expired session) will not succeed on retry; show it at once. */
export const shouldRetry = (failures: number, error: unknown) =>
	failures < MAX_RETRIES &&
	!(
		error instanceof StatsRequestError &&
		error.status >= HTTP_CLIENT_ERROR &&
		error.status < HTTP_SERVER_ERROR
	);

export function useStatsQuery(q: StatsQuery) {
	return useQuery<StatRow[]>({
		queryKey: ["stats", q],
		queryFn: () => fetchStats(q),
		staleTime: 30_000,
		retry: shouldRetry,
	});
}
