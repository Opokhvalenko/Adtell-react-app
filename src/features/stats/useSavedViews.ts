import { useMemo, useState } from "react";
import { safeLocalStorage } from "@/lib/safe-storage";
import { isMetricKey, type MetricKey } from "./types";

export interface SavedView {
	name: string;
	metrics: MetricKey[];
	groupBy: string;
}

const LS_KEY = "stats_views";

/** Views are stored in the browser: keep only well-formed ones and metrics the server knows. */
function toView(value: unknown): SavedView[] {
	if (!value || typeof value !== "object") return [];
	const v = value as Partial<Record<keyof SavedView, unknown>>;
	if (typeof v.name !== "string" || typeof v.groupBy !== "string") return [];
	const metrics = Array.isArray(v.metrics) ? v.metrics.filter(isMetricKey) : [];
	return [{ name: v.name, groupBy: v.groupBy, metrics }];
}

function readViews(): SavedView[] {
	try {
		const raw = safeLocalStorage.getItem(LS_KEY);
		if (!raw) return [];
		const parsed: unknown = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed.flatMap(toView) : [];
	} catch {
		return [];
	}
}

function persistViews(views: SavedView[]) {
	safeLocalStorage.setItem(LS_KEY, JSON.stringify(views));
}

export function useSavedViews() {
	const [views, setViews] = useState<SavedView[]>(() => readViews());
	const names = useMemo(() => views.map((v) => v.name), [views]);

	function saveView(view: SavedView) {
		const next = [...views.filter((v) => v.name !== view.name), view];
		setViews(next);
		persistViews(next);
	}

	function deleteView(name: string) {
		const next = views.filter((v) => v.name !== name);
		setViews(next);
		persistViews(next);
	}

	function getView(name: string) {
		return views.find((v) => v.name === name);
	}

	return { views, names, saveView, deleteView, getView };
}
