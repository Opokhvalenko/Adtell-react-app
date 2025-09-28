import { useQuery } from "@tanstack/react-query";
import { fetchFeed } from "@/lib/api";
import type { FeedResponse } from "@/types/feed";

export function useFeed() {
	const query = useQuery<FeedResponse, Error>({
		queryKey: ["feed"],
		queryFn: fetchFeed,
		staleTime: 60_000,
	});

	return {
		...query,
		items: query.data?.items ?? [],
		title: query.data?.title ?? null,
		cursor: query.data?.cursor ?? null,
	};
}
