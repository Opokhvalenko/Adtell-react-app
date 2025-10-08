import type { JSX } from "react";
import { createElement, Fragment, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { fetchArticleByUrl } from "@/lib/api";
import { useFeed } from "./useFeed";

type LocState = { url?: string; title?: string } | undefined;

function renderSafeHtml(html: string) {
	const allowed = new Set([
		"p",
		"a",
		"em",
		"strong",
		"ul",
		"ol",
		"li",
		"h1",
		"h2",
		"h3",
		"blockquote",
		"pre",
		"code",
		"br",
		"hr",
		"img",
	]);

	const doc = new DOMParser().parseFromString(html, "text/html");

	const isSafeUrl = (u: string) => {
		try {
			const url = new URL(u, window.location.href);
			return url.protocol === "http:" || url.protocol === "https:";
		} catch {
			return false;
		}
	};

	const isRenderable = (
		x: JSX.Element | string | null | "",
	): x is JSX.Element | string => x !== null && x !== "";

	const childrenOf = (node: Node, keyBase: string): (JSX.Element | string)[] =>
		Array.from(node.childNodes)
			.map((n, i) => toElement(n, `${keyBase}-${i}`))
			.filter(isRenderable);

	const toElement = (node: Node, key: string): JSX.Element | string | null => {
		if (node.nodeType === Node.TEXT_NODE) {
			return node.textContent ?? "";
		}
		if (node.nodeType !== Node.ELEMENT_NODE) {
			return null;
		}

		const el = node as HTMLElement;
		const tag = el.tagName.toLowerCase();

		if (!allowed.has(tag)) {
			return createElement(Fragment, { key }, ...childrenOf(el, key));
		}

		const props: Record<string, unknown> = { key };

		if (tag === "a") {
			const href = el.getAttribute("href") ?? "";
			if (isSafeUrl(href)) {
				props.href = href;
				props.target = "_blank";
				props.rel = "noopener noreferrer";
			}
		}

		if (tag === "img") {
			const src = el.getAttribute("src") ?? "";
			if (isSafeUrl(src)) {
				props.src = src;
				props.alt = el.getAttribute("alt") ?? "";
				props.loading = "lazy";
				props.decoding = "async";
				props.style = { maxWidth: "100%", height: "auto", borderRadius: "8px" };
			} else {
				return null;
			}
		}

		return createElement(tag, props, ...childrenOf(el, key));
	};

	return childrenOf(doc.body, "root");
}

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
						Відкрити оригінал
					</a>
				)}
				<div className="mt-4">
					<Link to="/" className="underline">
						← До стрічки
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
					Джерело:{" "}
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
					← До стрічки
				</Link>
			</div>
		</div>
	);
}
