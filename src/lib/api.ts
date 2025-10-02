import type { FeedItem, FeedResponse, RawFeedResponse } from "@/types/feed";
import { API_BASE } from "./apiBase";

export async function fetchFeed(): Promise<FeedResponse> {
	const res = await fetch(`${API_BASE}/feed`, { credentials: "include" });
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

export async function fetchArticleByUrl(url: string) {
	const res = await fetch(
		`${API_BASE}/article?url=${encodeURIComponent(url)}`,
		{
			credentials: "include",
		},
	);
	if (!res.ok) throw new Error(await res.text());
	return (await res.json()) as { url: string; title?: string; html: string };
}
