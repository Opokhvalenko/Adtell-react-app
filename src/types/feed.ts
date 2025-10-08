export type RawFeedItem = {
	id: string;
	title: string;
	link: string;
	createdAt?: string;
	pubDate?: string;
};

export type RawFeedResponse = {
	items: RawFeedItem[];
	cursor?: string | null;
	title?: string;
};

export type FeedItem = {
	id: string;
	title: string;
	link: string;
	date: string | null; // createdAt || pubDate
};

export type FeedResponse = {
	items: FeedItem[];
	cursor?: string | null;
	title?: string;
};
