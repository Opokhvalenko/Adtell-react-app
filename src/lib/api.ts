import { API_BASE } from "./apiBase";
import { apiFetch } from "./http";

/** A failed API call. The UI picks its own text by status; the server's body is never shown. */
export class ApiRequestError extends Error {
	constructor(
		readonly endpoint: string,
		readonly status: number,
	) {
		super(`${endpoint} request failed with status ${status}`);
		this.name = "ApiRequestError";
	}
}

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
	if (!res.ok) throw new ApiRequestError("feed", res.status);

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
	if (!res.ok) throw new ApiRequestError("article", res.status);
	return (await res.json()) as { url: string; title?: string; html: string };
}

const HTTP_BAD_REQUEST = 400;
const HTTP_UNAUTHORIZED = 401;
const HTTP_TOO_MANY = 429;
const HTTP_BAD_GATEWAY = 502;

export const ARTICLE_ERROR_TEXT = {
	missingUrl: "This article has no link to open.",
	session: "Sign in to read articles here.",
	refused: "This link cannot be opened here.",
	busy: "Too many requests. Try again in a minute.",
	source:
		"The source site did not let us load this article. Open the original instead.",
	unavailable: "The article is temporarily unavailable.",
} as const;

export function articleErrorMessage(error: unknown): string {
	const status = error instanceof ApiRequestError ? error.status : 0;
	if (status === HTTP_UNAUTHORIZED) return ARTICLE_ERROR_TEXT.session;
	if (status === HTTP_BAD_REQUEST) return ARTICLE_ERROR_TEXT.refused;
	if (status === HTTP_TOO_MANY) return ARTICLE_ERROR_TEXT.busy;
	if (status === HTTP_BAD_GATEWAY) return ARTICLE_ERROR_TEXT.source;
	return ARTICLE_ERROR_TEXT.unavailable;
}
