import { Link, useLocation } from "react-router-dom";
import type { NewsItem as News } from "../../types/news";

type Props = {
	item: News;
	className?: string;
};

export default function NewsItem({ item, className }: Props) {
	const location = useLocation();

	return (
		<article className={className}>
			<Link
				to={`/news/${item.id}`}
				state={{ backgroundLocation: location }}
				aria-label={`Open article: ${item.title}`}
				className="group block rounded-xl border bg-white dark:bg-gray-800 shadow hover:shadow-md transition overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500"
			>
				{item.image && (
					<img
						src={item.image}
						alt={item.title}
						loading="lazy"
						decoding="async"
						width={600}
						height={400}
						className="w-full h-40 object-cover"
					/>
				)}

				<div className="p-4">
					<h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
						{item.title}
					</h3>
					<p className="text-sm text-gray-600 dark:text-gray-300">
						{item.description}
					</p>
				</div>
			</Link>
		</article>
	);
}
