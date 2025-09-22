import { useCallback, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import newsData from "@/mock/news.json";
import type { NewsItem } from "@/types/news";

const news = newsData as NewsItem[];

export default function NewsModal() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const location = useLocation();

	const articleId = Number(id);
	const article = useMemo(
		() =>
			Number.isFinite(articleId)
				? news.find((n) => n.id === articleId)
				: undefined,
		[articleId],
	);

	const safeClose = useCallback(() => {
		if (window.history.length > 1) navigate(-1);
		else navigate("/", { replace: true });
	}, [navigate]);

	const openFullArticle = useCallback(() => {
		const path = location.pathname || `/news/${articleId}`;
		navigate(path, { replace: true, state: {} });
	}, [navigate, location.pathname, articleId]);

	return (
		<Modal
			open
			onClose={safeClose}
			title={article ? article.title : "Article not found"}
			size="2xl"
		>
			{article ? (
				<>
					{article.image && (
						<img
							src={article.image}
							alt={article.title}
							loading="lazy"
							decoding="async"
							width={800}
							height={480}
							className="w-full h-56 object-cover rounded-xl mb-4"
						/>
					)}

					<div className="prose dark:prose-invert max-w-none prose-img:rounded-xl">
						<p>{article.content ?? article.description}</p>
					</div>

					<div className="mt-6 flex justify-end">
						<Button
							variant="primary"
							type="button"
							onClick={openFullArticle}
							title="Open full article"
						>
							Open full article
						</Button>
					</div>
				</>
			) : (
				<p className="text-gray-700 dark:text-gray-300">
					The requested article was not found.
				</p>
			)}
		</Modal>
	);
}
