import {
	keepPreviousData,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import newsData from "../../mock/news.json";
import type { NewsItem } from "../../types/news";

const news = newsData as NewsItem[];

async function fetchArticle(id: number) {
	return news.find((n) => n.id === id);
}

export default function ArticlePage() {
	const { id } = useParams<{ id: string }>();
	const idNum = Number(id);
	const qc = useQueryClient();

	const initial = qc.getQueryData<NewsItem | undefined>(["news", idNum]);

	const { data: article } = useQuery({
		queryKey: ["news", idNum],
		queryFn: () => fetchArticle(idNum),
		enabled: Number.isFinite(idNum),
		initialData: initial,
		placeholderData: keepPreviousData,
		staleTime: 60_000,
	});

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

			<article className="prose prose-lg dark:prose-invert max-w-none">
				<h1>{article.title}</h1>
				<p>{article.content ?? article.description}</p>
			</article>

			<div className="mt-6">
				<Link to="/" className="text-blue-600 hover:underline">
					← Back to feed
				</Link>
			</div>
		</div>
	);
}
