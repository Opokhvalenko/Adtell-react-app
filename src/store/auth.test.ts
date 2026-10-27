import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "./auth";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function response(status: number, data: unknown = {}) {
	return Promise.resolve({
		ok: status >= 200 && status < 300,
		status,
		json: () => Promise.resolve(data),
		text: () => Promise.resolve(JSON.stringify(data)),
		headers: new Headers({ "content-type": "application/json" }),
	});
}

const ME = { id: "u1", email: "user@example.com" };

beforeEach(() => {
	useAuth.setState({ isLoggedIn: false, isLoading: true });
	mockFetch.mockReset();
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe("auth store", () => {
	it("keeps no token in state and persists nothing", async () => {
		mockFetch.mockReturnValueOnce(response(200, ME));
		await useAuth.getState().hydrate();
		expect(Object.keys(useAuth.getState())).not.toContain("token");
		expect(localStorage.getItem("auth")).toBeNull();
	});

	describe("hydrate", () => {
		it("logs in when /auth/me returns the user", async () => {
			mockFetch.mockReturnValueOnce(response(200, ME));

			await useAuth.getState().hydrate();

			expect(useAuth.getState().isLoggedIn).toBe(true);
			expect(useAuth.getState().isLoading).toBe(false);
		});

		it("refreshes an expired access token once and retries /auth/me", async () => {
			mockFetch
				.mockReturnValueOnce(response(401))
				.mockReturnValueOnce(response(200, ME))
				.mockReturnValueOnce(response(200, ME));

			await useAuth.getState().hydrate();

			expect(useAuth.getState().isLoggedIn).toBe(true);
			expect(mockFetch.mock.calls.map(([url]) => url)).toEqual([
				"/api/auth/me",
				"/api/auth/refresh",
				"/api/auth/me",
			]);
		});

		it("stays logged out when the refresh is rejected", async () => {
			mockFetch
				.mockReturnValueOnce(response(401))
				.mockReturnValueOnce(response(401));

			await useAuth.getState().hydrate();

			expect(useAuth.getState().isLoggedIn).toBe(false);
			expect(useAuth.getState().isLoading).toBe(false);
			expect(mockFetch).toHaveBeenCalledTimes(2);
		});

		it("handles a network error", async () => {
			mockFetch.mockRejectedValueOnce(new Error("network error"));

			await useAuth.getState().hydrate();

			expect(useAuth.getState().isLoggedIn).toBe(false);
			expect(useAuth.getState().isLoading).toBe(false);
		});
	});

	describe("logout", () => {
		it("clears auth state", async () => {
			useAuth.setState({ isLoggedIn: true });
			mockFetch.mockReturnValueOnce(response(200));

			await useAuth.getState().logout();

			expect(useAuth.getState().isLoggedIn).toBe(false);
			expect(mockFetch).toHaveBeenCalledWith("/api/auth/logout", {
				method: "POST",
				credentials: "include",
			});
		});

		it("clears state even if the API call fails", async () => {
			useAuth.setState({ isLoggedIn: true });
			mockFetch.mockRejectedValueOnce(new Error("offline"));

			await useAuth.getState().logout();

			expect(useAuth.getState().isLoggedIn).toBe(false);
		});
	});
});
