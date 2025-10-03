import { useMemo, useState } from "react";
import type { MetricKey } from "./types";

export interface SavedView {
	name: string;
	metrics: MetricKey[];
	groupBy: string;
}

const LS_KEY = "stats_views";

function readViews(): SavedView[] {
	try {
		const raw = localStorage.getItem(LS_KEY);
		if (!raw) return [];
		const arr = JSON.parse(raw) as SavedView[];
		return Array.isArray(arr) ? arr : [];
	} catch {
		return [];
	}
}

export function useSavedViews() {
	const [views, setViews] = useState<SavedView[]>(() => readViews());
	const names = useMemo(() => views.map((v) => v.name), [views]);

	function saveView(view: SavedView) {
		const next = [...views.filter((v) => v.name !== view.name), view];
		setViews(next);
		localStorage.setItem(LS_KEY, JSON.stringify(next));
	}

	function deleteView(name: string) {
		const next = views.filter((v) => v.name !== name);
		setViews(next);
		localStorage.setItem(LS_KEY, JSON.stringify(next));
	}

	function getView(name: string) {
		return views.find((v) => v.name === name);
	}

	return { views, names, saveView, deleteView, getView };
}
