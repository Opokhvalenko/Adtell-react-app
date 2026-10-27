import { API_BASE } from "./apiBase";
import { apiFetch } from "./http";

export interface FeedItem {
	id: string;
	title: string;
	link: string;
	date: string | null;
}
export interface FeedResponse {
	items: FeedItem[];
	cursor: string | null;
	title?: string;
}

interface ApiFeedItem {
	id: string;
	title: string;
	link: string;
	createdAt?: string | null;
	pubDate?: string | null;
}
interface ApiFeedResponse {
	items?: ApiFeedItem[];
	cursor?: string | null;
	title?: string;
}

export async function fetchFeed(): Promise<FeedResponse> {
	const res = await apiFetch(`${API_BASE}/feed`);
	if (!res.ok) throw new Error(await res.text());

	const raw = (await res.json()) as ApiFeedResponse;

	const items: FeedItem[] = (raw.items ?? []).map((it) => ({
		id: it.id,
		title: it.title,
		link: it.link,
		date: it.createdAt ?? it.pubDate ?? null,
	}));

	return { items, cursor: raw.cursor ?? null, title: raw.title };
}

export async function fetchArticleByUrl(
	url: string,
): Promise<{ url: string; title?: string; html: string }> {
	const res = await apiFetch(
		`${API_BASE}/article?url=${encodeURIComponent(url)}`,
	);
	if (!res.ok) throw new Error(await res.text());
	return (await res.json()) as { url: string; title?: string; html: string };
}
