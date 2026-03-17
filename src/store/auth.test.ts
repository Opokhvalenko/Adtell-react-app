import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "./auth";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function jsonResponse(data: unknown, ok = true) {
	return Promise.resolve({
		ok,
		json: () => Promise.resolve(data),
		text: () => Promise.resolve(JSON.stringify(data)),
	});
}

beforeEach(() => {
	useAuth.setState({ isLoggedIn: false, isLoading: true, token: null });
	mockFetch.mockReset();
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe("auth store", () => {
	describe("hydrate", () => {
		it("sets isLoggedIn to true when /auth/me returns ok", async () => {
			mockFetch.mockReturnValueOnce(jsonResponse({ token: "abc123" }));

			await useAuth.getState().hydrate();

			expect(useAuth.getState().isLoggedIn).toBe(true);
			expect(useAuth.getState().token).toBe("abc123");
			expect(useAuth.getState().isLoading).toBe(false);
		});

		it("sets isLoggedIn to false when /auth/me fails", async () => {
			mockFetch.mockReturnValueOnce(jsonResponse(null, false));

			await useAuth.getState().hydrate();

			expect(useAuth.getState().isLoggedIn).toBe(false);
			expect(useAuth.getState().token).toBeNull();
			expect(useAuth.getState().isLoading).toBe(false);
		});

		it("handles network error gracefully", async () => {
			mockFetch.mockRejectedValueOnce(new Error("network error"));

			await useAuth.getState().hydrate();

			expect(useAuth.getState().isLoggedIn).toBe(false);
			expect(useAuth.getState().isLoading).toBe(false);
		});
	});

	describe("login", () => {
		it("sets isLoggedIn after successful login + hydrate", async () => {
			mockFetch
				.mockReturnValueOnce(jsonResponse({ ok: true }))
				.mockReturnValueOnce(jsonResponse({ token: "session-token" }));

			await useAuth.getState().login({
				email: "user@example.com",
				password: "secret",
			});

			expect(useAuth.getState().isLoggedIn).toBe(true);
			expect(useAuth.getState().token).toBe("session-token");
			expect(mockFetch).toHaveBeenCalledTimes(2);
		});

		it("throws on failed login", async () => {
			mockFetch.mockReturnValueOnce(
				Promise.resolve({
					ok: false,
					text: () => Promise.resolve("Invalid credentials"),
				}),
			);

			await expect(
				useAuth.getState().login({
					email: "bad@example.com",
					password: "wrong",
				}),
			).rejects.toThrow("Invalid credentials");
		});
	});

	describe("logout", () => {
		it("clears auth state", async () => {
			useAuth.setState({ isLoggedIn: true, token: "abc" });
			mockFetch.mockReturnValueOnce(jsonResponse({}));

			await useAuth.getState().logout();

			expect(useAuth.getState().isLoggedIn).toBe(false);
			expect(useAuth.getState().token).toBeNull();
		});

		it("clears state even if API call fails", async () => {
			useAuth.setState({ isLoggedIn: true, token: "abc" });
			mockFetch.mockRejectedValueOnce(new Error("offline"));

			await useAuth.getState().logout();

			expect(useAuth.getState().isLoggedIn).toBe(false);
			expect(useAuth.getState().token).toBeNull();
		});
	});
});
