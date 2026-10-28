import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { fetchArticleByUrl } from "@/lib/api";
import { renderSafeHtml } from "./renderSafeHtml";
import { useFeed } from "./useFeed";

type LocState = { url?: string; title?: string } | undefined;

export default function ArticlePage() {
	const { id } = useParams<{ id: string }>();
	const { state } = useLocation() as { state: LocState };
	const { items } = useFeed();

	const item = useMemo(() => items.find((i) => i.id === id), [items, id]);
	const url = state?.url ?? item?.link;
	const initialTitle = state?.title ?? item?.title ?? "Article";

	const [title, setTitle] = useState(initialTitle);
	const [html, setHtml] = useState<string>("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			if (!url) {
				setError("No URL provided");
				setLoading(false);
				return;
			}
			try {
				const a = await fetchArticleByUrl(url);
				if (!cancelled) {
					setTitle((t) => t || a.title || "Article");
					setHtml(a.html || "");
				}
			} catch (e: unknown) {
				const message =
					e instanceof Error
						? e.message
						: typeof e === "string"
							? e
							: "Failed to load article";
				if (!cancelled) setError(message);
			} finally {
				if (!cancelled) setLoading(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [url]);

	if (loading) return <div className="p-6">Loading…</div>;

	if (error) {
		return (
			<div className="max-w-3xl mx-auto p-6">
				<h1 className="text-xl font-semibold mb-2">{title}</h1>
				<p className="mb-4 text-red-500">{error}</p>
				{url && (
					<a
						href={url}
						className="underline"
						rel="noopener noreferrer"
						target="_blank"
					>
						Open original
					</a>
				)}
				<div className="mt-4">
					<Link to="/" className="underline">
						← Back to feed
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="max-w-3xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-xl border">
			<article className="prose prose-lg dark:prose-invert max-w-none">
				<h1>{title}</h1>
				{renderSafeHtml(html)}
			</article>

			{url && (
				<p className="mt-6">
					Source:{" "}
					<a
						href={url}
						className="underline"
						rel="noopener noreferrer"
						target="_blank"
					>
						{url}
					</a>
				</p>
			)}

			<div className="mt-6">
				<Link to="/" className="underline">
					← Back to feed
				</Link>
			</div>
		</div>
	);
}
