import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockStorage = new Map<string, string>();
vi.mock("@/lib/safe-storage", () => ({
	safeLocalStorage: {
		getItem: (k: string) => mockStorage.get(k) ?? null,
		setItem: (k: string, v: string) => mockStorage.set(k, v),
		removeItem: (k: string) => mockStorage.delete(k),
		clear: () => mockStorage.clear(),
		key: () => null,
		get length() {
			return mockStorage.size;
		},
	},
}));

import { type SavedView, useSavedViews } from "./useSavedViews";

const sampleView: SavedView = {
	name: "My View",
	metrics: ["impressions", "clicks"],
	groupBy: "date",
};

beforeEach(() => {
	mockStorage.clear();
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe("useSavedViews", () => {
	it("returns empty views initially", () => {
		const { result } = renderHook(() => useSavedViews());

		expect(result.current.views).toEqual([]);
		expect(result.current.names).toEqual([]);
	});

	it("reads views from storage on init", () => {
		mockStorage.set("stats_views", JSON.stringify([sampleView]));

		const { result } = renderHook(() => useSavedViews());

		expect(result.current.views).toHaveLength(1);
		expect(result.current.views[0].name).toBe("My View");
	});

	it("handles corrupted storage gracefully", () => {
		mockStorage.set("stats_views", "not-json");

		const { result } = renderHook(() => useSavedViews());

		expect(result.current.views).toEqual([]);
	});

	it("saves a view and persists to storage", () => {
		const { result } = renderHook(() => useSavedViews());

		act(() => {
			result.current.saveView(sampleView);
		});

		expect(result.current.views).toHaveLength(1);
		expect(result.current.names).toEqual(["My View"]);

		const stored = JSON.parse(mockStorage.get("stats_views") || "[]");
		expect(stored).toHaveLength(1);
	});

	it("updates existing view by name", () => {
		const { result } = renderHook(() => useSavedViews());

		act(() => {
			result.current.saveView(sampleView);
		});

		act(() => {
			result.current.saveView({ ...sampleView, groupBy: "hour" });
		});

		expect(result.current.views).toHaveLength(1);
		expect(result.current.views[0].groupBy).toBe("hour");
	});

	it("deletes a view by name", () => {
		const { result } = renderHook(() => useSavedViews());

		act(() => {
			result.current.saveView(sampleView);
		});

		act(() => {
			result.current.deleteView("My View");
		});

		expect(result.current.views).toHaveLength(0);

		const stored = JSON.parse(mockStorage.get("stats_views") || "[]");
		expect(stored).toHaveLength(0);
	});

	it("finds a view by name with getView", () => {
		const { result } = renderHook(() => useSavedViews());

		act(() => {
			result.current.saveView(sampleView);
		});

		expect(result.current.getView("My View")).toEqual(sampleView);
		expect(result.current.getView("Unknown")).toBeUndefined();
	});
});
