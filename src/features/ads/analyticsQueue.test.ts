import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/** Longer than the module's flush delay and its first backoff step. */
const FLUSH_WAIT_MS = 2_500;

const mockFetch = vi.fn();

function sentEvents(): string[] {
	return mockFetch.mock.calls.flatMap(([, init]) =>
		(JSON.parse(String(init.body)) as Array<{ event: string }>).map(
			(e) => e.event,
		),
	);
}

/** A fresh module per test: the queue lives in module state. */
async function loadQueue() {
	vi.resetModules();
	return import("../../../modules/analytics.module.js");
}

describe("analytics event queue", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		mockFetch.mockReset();
		vi.stubGlobal("fetch", mockFetch);
		// Force the fetch path (jsdom has no sendBeacon, but be explicit)
		vi.stubGlobal("navigator", { ...navigator, sendBeacon: undefined });
	});
	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
	});

	it("sends events to the site's own /api", async () => {
		mockFetch.mockResolvedValue(new Response(null, { status: 204 }));
		const { track } = await loadQueue();
		track("pageLoad");
		await vi.advanceTimersByTimeAsync(FLUSH_WAIT_MS);
		expect(mockFetch.mock.calls[0][0]).toBe("/api/analytics/events");
	});

	it("drops a batch the server rejected (4xx) instead of resending it forever", async () => {
		mockFetch.mockResolvedValue(new Response(null, { status: 400 }));
		const { track } = await loadQueue();
		track("rejected");
		await vi.advanceTimersByTimeAsync(FLUSH_WAIT_MS);
		mockFetch.mockResolvedValue(new Response(null, { status: 204 }));
		track("next");
		await vi.advanceTimersByTimeAsync(FLUSH_WAIT_MS * 4);
		expect(sentEvents()).toEqual(["rejected", "next"]);
	});

	it("retries a batch after a server error", async () => {
		mockFetch.mockResolvedValueOnce(new Response(null, { status: 503 }));
		mockFetch.mockResolvedValue(new Response(null, { status: 204 }));
		const { track } = await loadQueue();
		track("retried");
		await vi.advanceTimersByTimeAsync(FLUSH_WAIT_MS * 4);
		expect(sentEvents()).toEqual(["retried", "retried"]);
	});
});
