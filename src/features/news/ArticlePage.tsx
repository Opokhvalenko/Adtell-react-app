//src/features/new/ActiclePage.tsx
import { Link, useParams } from "react-router-dom";
import newsData from "../../mock/news.json";
import type { NewsItem } from "../../types/news";

const news = newsData as NewsItem[];

export default function ArticlePage() {
	const { id } = useParams<{ id: string }>();
	const article = news.find((n) => n.id === Number(id));

	if (!article) {
		return (
			<div className="max-w-3xl mx-auto p-4">
				<p className="mb-4">Article not found.</p>
				<Link to="/" className="text-blue-600 hover:underline">
					Back to feed
				</Link>
			</div>
		);
	}

	return (
		<div className="max-w-3xl mx-auto p-4 bg-white dark:bg-gray-800 rounded-xl border">
			{article.image && (
				<img
					src={article.image}
					alt={article.title}
					loading="lazy"
					decoding="async"
					className="w-full h-64 object-cover rounded-lg mb-4"
				/>
			)}
			<h1 className="text-2xl font-bold mb-2">{article.title}</h1>
			<p className="text-gray-700 dark:text-gray-300 leading-relaxed">
				{article.content ?? article.description}
			</p>
			<div className="mt-6">
				<Link to="/" className="text-blue-600 hover:underline">
					← Back to feed
				</Link>
			</div>
		</div>
	);
}
