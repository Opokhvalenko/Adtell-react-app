import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { Link, MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	ApiRequestError,
	ARTICLE_ERROR_TEXT,
	articleErrorMessage,
	fetchArticleByUrl,
} from "@/lib/api";
import ArticlePage from "./ArticlePage";

const SOURCE_URL = "https://news.example/story";
const UPSTREAM_TEXT = "getaddrinfo ENOTFOUND news.example";

const mockFetch = vi.fn();
const reply = (status: number, body: unknown) =>
	Promise.resolve(
		new Response(JSON.stringify(body), {
			status,
			headers: { "content-type": "application/json" },
		}),
	);

beforeEach(() => {
	mockFetch.mockReset();
	vi.stubGlobal("fetch", mockFetch);
});
afterEach(() => vi.unstubAllGlobals());

describe("article errors", () => {
	it("a failed request carries its status, not the server's text", async () => {
		mockFetch.mockReturnValueOnce(
			reply(502, { error: "Bad Gateway", detail: UPSTREAM_TEXT }),
		);
		const error = await fetchArticleByUrl(SOURCE_URL).catch((e: unknown) => e);
		expect(error).toBeInstanceOf(ApiRequestError);
		expect((error as ApiRequestError).status).toBe(502);
		expect((error as Error).message).not.toContain(UPSTREAM_TEXT);
	});

	it.each([
		[401, ARTICLE_ERROR_TEXT.session],
		[400, ARTICLE_ERROR_TEXT.refused],
		[429, ARTICLE_ERROR_TEXT.busy],
		[502, ARTICLE_ERROR_TEXT.source],
		[500, ARTICLE_ERROR_TEXT.unavailable],
	])("status %i → its own message", (status, text) => {
		expect(articleErrorMessage(new ApiRequestError("article", status))).toBe(
			text,
		);
	});

	it("anything that is not an API error gets the generic message", () => {
		expect(articleErrorMessage(new TypeError("Failed to fetch"))).toBe(
			ARTICLE_ERROR_TEXT.unavailable,
		);
	});

	it("the page explains a failing source site and links to the original", async () => {
		mockFetch.mockImplementation((input: RequestInfo | URL) =>
			String(input).includes("/article")
				? reply(502, { error: "Bad Gateway", detail: UPSTREAM_TEXT })
				: reply(200, { items: [] }),
		);
		render(
			<QueryClientProvider
				client={
					new QueryClient({ defaultOptions: { queries: { retry: false } } })
				}
			>
				<MemoryRouter
					initialEntries={[
						{ pathname: "/news/1", state: { url: SOURCE_URL, title: "Story" } },
					]}
				>
					<Routes>
						<Route path="/news/:id" element={<ArticlePage />} />
					</Routes>
				</MemoryRouter>
			</QueryClientProvider>,
		);
		expect(await screen.findByText(ARTICLE_ERROR_TEXT.source)).toBeTruthy();
		expect(screen.queryByText(/Bad Gateway|ENOTFOUND|statusCode/)).toBeNull();
		expect(
			screen.getByRole("link", { name: "Open original" }).getAttribute("href"),
		).toBe(SOURCE_URL);
	});

	it("opening another article after an error shows that article, not the old error", async () => {
		const OTHER_URL = "https://news.example/other";
		mockFetch.mockImplementation((input: RequestInfo | URL) => {
			const target = String(input);
			if (!target.includes("/article")) return reply(200, { items: [] });
			return target.includes(encodeURIComponent(OTHER_URL))
				? reply(200, {
						url: OTHER_URL,
						title: "Other",
						html: "<p>Second story</p>",
					})
				: reply(502, { error: "Bad Gateway" });
		});
		render(
			<QueryClientProvider
				client={
					new QueryClient({ defaultOptions: { queries: { retry: false } } })
				}
			>
				<MemoryRouter
					initialEntries={[
						{ pathname: "/news/1", state: { url: SOURCE_URL, title: "Story" } },
					]}
				>
					<Link to="/news/2" state={{ url: OTHER_URL, title: "Other" }}>
						next
					</Link>
					<Routes>
						<Route path="/news/:id" element={<ArticlePage />} />
					</Routes>
				</MemoryRouter>
			</QueryClientProvider>,
		);
		expect(await screen.findByText(ARTICLE_ERROR_TEXT.source)).toBeTruthy();
		fireEvent.click(screen.getByText("next"));
		expect(await screen.findByText("Second story")).toBeTruthy();
		expect(screen.queryByText(ARTICLE_ERROR_TEXT.source)).toBeNull();
	});
});
