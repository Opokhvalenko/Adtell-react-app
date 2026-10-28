import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ANALYTICS_EVENTS, ANALYTICS_STATS } from "@/config/analytics";
import {
	fetchStats,
	STATS_ERROR_TEXT,
	StatsRequestError,
	statsErrorMessage,
} from "./api";
import { useDebouncedValue } from "./hooks/useDebouncedValue";
import { shouldRetry } from "./hooks/useStatsQuery";
import { useSavedViews } from "./useSavedViews";
import { rowsToCsv } from "./utils/csv";
import { addDays, utcToday } from "./utils/dates";

const mockFetch = vi.fn();
const json = (status: number, body: unknown) =>
	Promise.resolve(
		new Response(JSON.stringify(body), {
			status,
			headers: { "content-type": "application/json" },
		}),
	);

describe("analytics endpoints", () => {
	it("are the site's own /api, never another origin (the session cookie must be sent)", () => {
		expect(ANALYTICS_EVENTS).toBe("/api/analytics/events");
		expect(ANALYTICS_STATS).toBe("/api/analytics/stats");
	});
});

describe("fetchStats", () => {
	const query = {
		from: "2026-10-26",
		to: "2026-10-28",
		groupBy: "day,event",
		metrics: ["count", "wins"] as const,
	};

	beforeEach(() => {
		mockFetch.mockReset();
		vi.stubGlobal("fetch", mockFetch);
	});
	afterEach(() => vi.unstubAllGlobals());

	it("asks the same-origin stats endpoint with the session cookies", async () => {
		mockFetch.mockReturnValueOnce(json(200, [{ day: "2026-10-28", count: 2 }]));
		const rows = await fetchStats({ ...query, metrics: [...query.metrics] });
		const [url, init] = mockFetch.mock.calls[0];
		expect(url).toBe(
			"/api/analytics/stats?from=2026-10-26&to=2026-10-28&groupBy=day%2Cevent&metrics=count%2Cwins",
		);
		expect(init.credentials).toBe("include");
		expect(rows).toEqual([{ day: "2026-10-28", count: 2 }]);
	});

	it("a server error is an error, not local data passed off as statistics", async () => {
		mockFetch.mockReturnValueOnce(
			json(500, { error: "Internal Server Error" }),
		);
		await expect(
			fetchStats({ ...query, metrics: [...query.metrics] }),
		).rejects.toEqual(new StatsRequestError(500));
	});

	it("an empty result stays empty", async () => {
		mockFetch.mockReturnValueOnce(json(200, []));
		expect(await fetchStats({ ...query, metrics: [] })).toEqual([]);
	});
});

describe("statsErrorMessage", () => {
	it("maps statuses to fixed texts and never shows the server's message", () => {
		expect(statsErrorMessage(new StatsRequestError(401))).toBe(
			STATS_ERROR_TEXT.session,
		);
		expect(statsErrorMessage(new StatsRequestError(400))).toBe(
			STATS_ERROR_TEXT.range,
		);
		expect(statsErrorMessage(new StatsRequestError(429))).toBe(
			STATS_ERROR_TEXT.busy,
		);
		expect(statsErrorMessage(new StatsRequestError(500))).toBe(
			STATS_ERROR_TEXT.unavailable,
		);
		expect(
			statsErrorMessage(new Error("getaddrinfo ENOTFOUND db.internal")),
		).toBe(STATS_ERROR_TEXT.unavailable);
	});
});

describe("rowsToCsv", () => {
	it("neutralises values a spreadsheet would run as a formula", () => {
		const csv = rowsToCsv([
			{
				adapter: '=HYPERLINK("https://evil.test")',
				event: "+1",
				day: "-2",
				bidder: "@SUM(A1)",
			},
		]);
		const [, row] = csv.split("\n");
		expect(row).toBe(`"'=HYPERLINK(""https://evil.test"")",'+1,'-2,'@SUM(A1)`);
	});

	it("keeps ordinary values and numbers as they are", () => {
		expect(rowsToCsv([{ event: "bidWon", count: 2, cpmAvg: null }])).toBe(
			"event,count,cpmAvg\nbidWon,2,",
		);
	});

	it("does not touch numbers: a negative number is not a formula", () => {
		expect(rowsToCsv([{ delta: -2, adapter: "-x" }])).toBe(
			"delta,adapter\n-2,'-x",
		);
	});

	it("is empty for no rows", () => {
		expect(rowsToCsv([])).toBe("");
	});
});

describe("UTC days", () => {
	it("follows the UTC day, not the browser's local day (as the server groups)", () => {
		// UTC+14: here the local date is already the next day for most of the UTC day
		const original = process.env.TZ;
		process.env.TZ = "Pacific/Kiritimati";
		try {
			expect(utcToday(new Date("2026-10-27T21:30:00Z"))).toBe("2026-10-27");
		} finally {
			process.env.TZ = original;
		}
	});

	it("moves across month and year boundaries", () => {
		expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
		expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
	});
});

describe("saved views from the browser", () => {
	beforeEach(() => localStorage.clear());

	it("keep only well-formed views and metrics the server supports", () => {
		localStorage.setItem(
			"stats_views",
			JSON.stringify([
				{ name: "Old", groupBy: "day", metrics: ["revenue", "count"] },
				{ name: 42, groupBy: "day", metrics: [] },
				"garbage",
			]),
		);
		const { result } = renderHook(() => useSavedViews());
		expect(result.current.views).toEqual([
			{ name: "Old", groupBy: "day", metrics: ["count"] },
		]);
	});
});

describe("useDebouncedValue", () => {
	afterEach(() => vi.useRealTimers());

	it("passes on only the value typing stopped at", () => {
		vi.useFakeTimers();
		const { result, rerender } = renderHook(
			({ value }) => useDebouncedValue(value, 400),
			{ initialProps: { value: "d" } },
		);
		rerender({ value: "da" });
		rerender({ value: "day" });
		act(() => vi.advanceTimersByTime(399));
		expect(result.current).toBe("d");
		act(() => vi.advanceTimersByTime(1));
		expect(result.current).toBe("day");
	});
});

describe("stats retries", () => {
	it("does not retry a client error (bad range, expired session)", () => {
		expect(shouldRetry(0, new StatsRequestError(400))).toBe(false);
		expect(shouldRetry(0, new StatsRequestError(401))).toBe(false);
	});

	it("retries a server or network error a limited number of times", () => {
		expect(shouldRetry(0, new StatsRequestError(503))).toBe(true);
		expect(shouldRetry(0, new TypeError("Failed to fetch"))).toBe(true);
		expect(shouldRetry(2, new StatsRequestError(503))).toBe(false);
	});
});
