import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch } from "./http";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

const status = (code: number) =>
	Promise.resolve({ ok: code >= 200 && code < 300, status: code } as Response);

const calledUrls = () => mockFetch.mock.calls.map(([url]) => url);

beforeEach(() => {
	mockFetch.mockReset();
});

describe("apiFetch", () => {
	it("always sends the session cookies", async () => {
		mockFetch.mockReturnValueOnce(status(200));
		await apiFetch("/api/feed");
		expect(mockFetch).toHaveBeenCalledWith("/api/feed", {
			credentials: "include",
		});
	});

	it("does not refresh on success or on errors other than 401", async () => {
		mockFetch.mockReturnValueOnce(status(200)).mockReturnValueOnce(status(403));
		await apiFetch("/api/a");
		const res = await apiFetch("/api/b");
		expect(res.status).toBe(403);
		expect(calledUrls()).toEqual(["/api/a", "/api/b"]);
	});

	it("on 401 refreshes once and retries the request", async () => {
		mockFetch
			.mockReturnValueOnce(status(401))
			.mockReturnValueOnce(status(200))
			.mockReturnValueOnce(status(200));
		const res = await apiFetch("/api/stats");
		expect(res.status).toBe(200);
		expect(calledUrls()).toEqual([
			"/api/stats",
			"/api/auth/refresh",
			"/api/stats",
		]);
	});

	it("returns the 401 without retrying when the refresh fails", async () => {
		mockFetch.mockReturnValueOnce(status(401)).mockReturnValueOnce(status(401));
		const res = await apiFetch("/api/stats");
		expect(res.status).toBe(401);
		expect(calledUrls()).toEqual(["/api/stats", "/api/auth/refresh"]);
	});

	it("parallel 401s share one refresh request (the backend rotates refresh tokens)", async () => {
		mockFetch.mockImplementation((url: string) =>
			url === "/api/auth/refresh"
				? status(200)
				: status(mockFetch.mock.calls.length <= 3 ? 401 : 200),
		);
		await Promise.all([
			apiFetch("/api/a"),
			apiFetch("/api/b"),
			apiFetch("/api/c"),
		]);
		const refreshes = calledUrls().filter((url) => url === "/api/auth/refresh");
		expect(refreshes).toHaveLength(1);
	});
});
