import type { JSX } from "react";
import { createElement, Fragment } from "react";

/**
 * Turns article HTML into React elements from an allowlist of tags — never `innerHTML`.
 * Links must be http(s); images must be https (no mixed content or tracking over plain http).
 */
export function renderSafeHtml(html: string) {
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
			if (
				isSafeUrl(src) &&
				new URL(src, window.location.href).protocol === "https:"
			) {
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
