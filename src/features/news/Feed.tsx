//src/features/new/Feed.tsx
import { Link, useLocation } from "react-router-dom";
import newsData from "../../mock/news.json";
import type { NewsItem } from "../../types/news";
import NewsItemCard from "./NewsItem";

const news = newsData as NewsItem[];

export default function Feed() {
	const headingId = "news-feed-heading";
	const location = useLocation();

	if (!news?.length) {
		return (
			<section className="mt-6">
				<h2 id={headingId} className="text-xl font-semibold mb-4">
					News Feed
				</h2>
				<p className="text-sm opacity-80">No news yet.</p>
			</section>
		);
	}

	return (
		<section aria-labelledby={headingId} className="mt-6">
			<h2 id={headingId} className="text-xl font-semibold mb-4">
				News Feed
			</h2>

			<ul className="grid gap-6 sm:grid-cols-2">
				{news.map((item) => (
					<li key={item.id}>
						<Link
							to={`/news/${item.id}`}
							state={{ backgroundLocation: location }}
							className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-xl"
							aria-label={`Open "${item.title}"`}
						>
							<NewsItemCard
								item={item}
								className="rounded-xl border bg-white dark:bg-gray-800 shadow hover:shadow-md transition overflow-hidden"
							/>
						</Link>
					</li>
				))}
			</ul>
		</section>
	);
}
