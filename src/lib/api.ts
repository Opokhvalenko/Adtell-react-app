export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export type FeedItem = {
	id: string;
	title: string;
	link: string;
	createdAt: string;
};

export type FeedResponse = {
	items: FeedItem[];
	cursor?: string | null;
};

export async function fetchFeed(): Promise<FeedResponse> {
	const res = await fetch(`${API_URL}/feed`, {});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(`Failed to load feed: ${res.status} ${text}`);
	}
	return res.json();
}
