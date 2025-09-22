import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { Link } from "react-router-dom";
import newsData from "../../mock/news.json";
import type { NewsItem } from "../../types/news";
import NewsItemCard from "./NewsItem";

const news = newsData as NewsItem[];

export default function Feed() {
	const qc = useQueryClient();

	const prefetch = useCallback(
		async (id: number) => {
			await qc.prefetchQuery({
				queryKey: ["news", id],
				queryFn: async () => news.find((n) => n.id === id),
				staleTime: 60_000,
			});
		},
		[qc],
	);

	return (
		<section className="mt-6">
			<h2 className="text-xl font-semibold mb-4">News Feed</h2>
			<ul className="grid gap-6 sm:grid-cols-2">
				{news.map((item) => (
					<li key={item.id}>
						<Link
							to={`/news/${item.id}`}
							onMouseEnter={() => prefetch(item.id)}
							onFocus={() => prefetch(item.id)}
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
