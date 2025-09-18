// src/features/news/NewsModal.tsx
import { useCallback, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import newsData from "../../mock/news.json";
import type { NewsItem } from "../../types/news";

const news = newsData as NewsItem[];

export default function NewsModal() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const location = useLocation();

	const articleId = Number(id);
	const article = Number.isFinite(articleId)
		? news.find((n) => n.id === articleId)
		: undefined;

	const titleId = useId();
	const descId = useId();
	const closeBtnRef = useRef<HTMLButtonElement>(null);

	// безпечне закриття
	const safeClose = useCallback(() => {
		if (window.history.length > 1) navigate(-1);
		else navigate("/", { replace: true });
	}, [navigate]);

	// повна сторінка статті (без background state)
	const openFullArticle = useCallback(() => {
		const path = location.pathname || `/news/${articleId}`;
		navigate(path, { replace: true, state: {} });
	}, [navigate, location.pathname, articleId]);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") safeClose();
		};
		document.addEventListener("keydown", onKey);

		const prev = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		closeBtnRef.current?.focus();

		return () => {
			document.removeEventListener("keydown", onKey);
			document.body.style.overflow = prev;
		};
	}, [safeClose]);

	const modal = (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center p-4"
			role="presentation"
		>
			{/* напівпрозорий фон (семантично кнопка) */}
			<button
				type="button"
				onClick={safeClose}
				aria-label="Close dialog"
				tabIndex={-1}
				className="absolute inset-0 z-40 bg-black/50"
			/>

			{/* діалог */}
			<div
				role="dialog"
				aria-modal="true"
				aria-labelledby={titleId}
				aria-describedby={descId}
				className="relative z-50 w-full max-w-2xl rounded-2xl bg-white dark:bg-gray-800 shadow-xl overflow-hidden"
			>
				{/* Header */}
				<div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
					<h2
						id={titleId}
						className="text-xl font-semibold text-gray-900 dark:text-gray-100"
					>
						{article ? article.title : "Article not found"}
					</h2>
					<button
						type="button"
						ref={closeBtnRef}
						onClick={safeClose}
						className="
              inline-flex items-center justify-center rounded-md
              border border-gray-300 bg-white px-3 py-1 text-sm text-gray-800 hover:bg-gray-100
              dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600
              focus:outline-none focus:ring-2 focus:ring-blue-500
              focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800
            "
						aria-label="Close dialog"
						title="Close"
					>
						Close
					</button>
				</div>

				{/* Body */}
				<div className="p-5">
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
							<p
								id={descId}
								className="text-gray-700 dark:text-gray-300 leading-relaxed"
							>
								{article.content ?? article.description}
							</p>
						</>
					) : (
						<p id={descId} className="text-gray-700 dark:text-gray-300">
							The requested article was not found.
						</p>
					)}
				</div>

				{/* Footer — відкриває повну сторінку */}
				<div className="px-5 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
					{article && (
						<button
							type="button"
							onClick={openFullArticle}
							className="
                rounded-lg bg-blue-600 text-white px-4 py-2 font-medium hover:bg-blue-700 transition
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                focus:ring-offset-white dark:focus:ring-offset-gray-800
              "
							title="Open full article"
						>
							Open full article
						</button>
					)}
				</div>
			</div>
		</div>
	);

	return createPortal(modal, document.body);
}
