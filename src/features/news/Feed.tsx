import { Link } from "react-router-dom";
import type { FeedItem } from "@/types/feed";
import { useFeed } from "./useFeed";

export default function Feed() {
	const { items, isLoading, isError } = useFeed();

	if (isLoading) return <div>Loading…</div>;
	if (isError) return <div>Failed to load feed</div>;

	return (
		<section className="mt-6">
			<h2 className="text-xl font-semibold mb-4">News Feed</h2>

			{items.length === 0 ? (
				<div className="text-slate-500">Nothing here yet.</div>
			) : (
				<ul className="grid gap-6 sm:grid-cols-2">
					{items.map((it: FeedItem) => (
						<li key={it.id}>
							<Link
								to={`/news/${it.id}`}
								state={{ url: it.link, title: it.title }}
								className="block rounded-xl border bg-white dark:bg-gray-800 shadow hover:shadow-md transition overflow-hidden"
								aria-label={`Open "${it.title}"`}
							>
								<div className="p-4">
									<h3 className="font-medium line-clamp-2">{it.title}</h3>
									<div className="mt-1 text-sm text-slate-500">{it.date}</div>
								</div>
							</Link>
						</li>
					))}
				</ul>
			)}
		</section>
	);
}
