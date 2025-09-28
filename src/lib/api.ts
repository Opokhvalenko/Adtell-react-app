import type { FeedItem, FeedResponse, RawFeedResponse } from "@/types/feed";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export async function fetchFeed(): Promise<FeedResponse> {
	const res = await fetch(`${API_URL}/feed`);
	if (!res.ok) throw new Error(await res.text());

	const raw: RawFeedResponse = await res.json();

	const items: FeedItem[] = (raw.items ?? []).map((it) => ({
		id: it.id,
		title: it.title,
		link: it.link,
		date: it.createdAt ?? it.pubDate ?? null,
	}));

	return { items, cursor: raw.cursor ?? null, title: raw.title };
}
