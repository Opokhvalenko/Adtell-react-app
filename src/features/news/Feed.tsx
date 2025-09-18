import newsData from "../../mock/news.json";
import type { NewsItem } from "../../types/news";
import NewsItemCard from "./NewsItem";

const news = newsData as NewsItem[];

export default function Feed() {
	const headingId = "news-feed-heading";

	return (
		<section aria-labelledby={headingId} className="mt-6">
			<h2 id={headingId} className="text-xl font-semibold mb-4">
				News Feed
			</h2>

			<ul className="grid gap-6 sm:grid-cols-2">
				{news.map((item) => (
					<li key={item.id}>
						<NewsItemCard
							item={item}
							className="rounded-xl border bg-white dark:bg-gray-800 shadow hover:shadow-md transition overflow-hidden"
						/>
					</li>
				))}
			</ul>
		</section>
	);
}
