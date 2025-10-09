import { ANALYTICS_STATS } from "@/config/analytics";
import { API_BASE } from "@/lib/apiBase";
import { reportError } from "@/reporting/errors-lazy";
import type { MetricKey, StatRow } from "./types";

export interface StatsQuery {
	from?: string;
	to?: string;
	groupBy?: string;
	metrics?: MetricKey[];
	limit?: number;
	offset?: number;
	event?: string;
	adapter?: string;
	adUnitCode?: string;
	creativeId?: string;
}

function joinUrl(base: string, path: string) {
	if (/^https?:\/\//i.test(path)) return path; // дали повний URL у env
	return base.replace(/\/$/, "") + (path.startsWith("/") ? path : `/${path}`);
}

export async function fetchStats(q: StatsQuery): Promise<StatRow[]> {
	const params = new URLSearchParams();
	if (q.from) params.set("from", q.from);
	if (q.to) params.set("to", q.to);
	if (q.groupBy) params.set("groupBy", q.groupBy);
	if (q.metrics?.length) params.set("metrics", q.metrics.join(","));
	if (q.limit) params.set("limit", String(q.limit));
	if (q.offset) params.set("offset", String(q.offset));
	if (q.event) params.set("event", q.event);
	if (q.adapter) params.set("adapter", q.adapter);
	if (q.adUnitCode) params.set("adUnitCode", q.adUnitCode);
	if (q.creativeId) params.set("creativeId", q.creativeId);

	const url = `${joinUrl(API_BASE, ANALYTICS_STATS)}?${params.toString()}`;

	try {
		const res = await fetch(url, { credentials: "include" });
		if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
		const ct = res.headers.get("content-type") || "";
		if (!ct.includes("application/json")) {
			const preview = (await res.text()).slice(0, 200);
			throw new Error(
				`Expected JSON, got "${ct}" [${res.status}] preview: ${preview}`,
			);
		}
		return (await res.json()) as StatRow[];
	} catch (err) {
		reportError(err, { where: "fetchStats", url });
		throw err;
	}
}
