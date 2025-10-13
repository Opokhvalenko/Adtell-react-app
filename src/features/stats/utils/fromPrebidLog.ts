import type { StatRow } from "../../stats/types";

export type BuildParams = {
	from?: string;
	to?: string;
	groupBy?: string;
	event?: string;
	adapter?: string;
	adUnitCode?: string;
	creativeId?: string;
};

type Dict = Record<string, unknown>;

declare global {
	interface Window {
		__adslog?: Array<{ ts: number; type: string; payload: Dict }>;
	}
}

const DAY_MS = 24 * 3600 * 1000;

function parseISO(d?: string | null) {
	if (!d) return null;
	const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d.trim());
	if (!m) return null;
	return new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00Z`);
}
function inRange(ts: number, fromISO?: string, toISO?: string) {
	const from = parseISO(fromISO);
	const to = parseISO(toISO);
	if (from && ts < +from) return false;
	if (to && ts > +to + DAY_MS - 1) return false;
	return true;
}

const ymd = (d: Date) =>
	`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(
		d.getUTCDate(),
	).padStart(2, "0")}`;
const hh = (d: Date) => `${String(d.getUTCHours()).padStart(2, "0")}:00`;

function p95(values: number[]) {
	if (!values.length) return undefined;
	const a = [...values].sort((x, y) => x - y);
	const pos = 0.95 * (a.length - 1);
	const i = Math.floor(pos);
	const frac = pos - i;
	return a[i + 1] != null ? a[i] + frac * (a[i + 1] - a[i]) : a[i];
}

function mapEvent(type: string): StatRow["event"] {
	if (type === "hb:requestBids") return "request";
	if (type === "hb:bidResponse") return "response";
	if (type === "hb:bidWon") return "win";
	if (type === "hb:adRenderSucceeded") return "impression";
	return "other";
}

const VALID_GROUPS = [
	"day",
	"hour",
	"event",
	"adapter",
	"adUnitCode",
	"creativeId",
] as const;
type GroupKey = (typeof VALID_GROUPS)[number];

export function buildStatsFromPrebidLog(q: BuildParams): StatRow[] {
	const log = Array.isArray(window.__adslog) ? window.__adslog : [];

	const groups = (q.groupBy || "day,event,adapter")
		.split(",")
		.map((s) => s.trim())
		.filter((s): s is GroupKey =>
			(VALID_GROUPS as readonly string[]).includes(s),
		);

	type Bucket = {
		ts: string;
		date?: string;
		hour?: string;
		event?: string;
		adapter?: string;
		adUnitCode?: string;
		creativeId?: string | number | null;
		_cpms: number[];
		count: number;
		requests: number;
		responses: number;
		wins: number;
		revenue: number;
	};

	const map = new Map<string, Bucket>();

	for (const it of log) {
		if (!it?.ts || !it?.type) continue;
		if (!inRange(it.ts, q.from, q.to)) continue;

		const when = new Date(it.ts);
		const event = mapEvent(it.type);
		const p = (it.payload ?? {}) as Dict;

		const adapter =
			(p.bidderCode as string) || (p.bidder as string) || "unknown";
		const adUnitCode =
			(p.adUnitCode as string) || (p.adUnit as string) || "unknown";
		const creativeId =
			(p.creativeId as string | number | undefined) ??
			(p.crid as string | number | undefined) ??
			(p.adId as string | number | undefined) ??
			null;

		const cpmRaw = Number(p.cpm);
		const cpmNum = Number.isFinite(cpmRaw) ? cpmRaw : undefined;

		if (q.event && q.event !== event) continue;
		if (q.adapter && q.adapter !== String(adapter)) continue;
		if (q.adUnitCode && q.adUnitCode !== String(adUnitCode)) continue;
		if (q.creativeId && q.creativeId !== String(creativeId ?? "")) continue;

		const dims = {
			day: ymd(when),
			hour: hh(when),
			event,
			adapter: String(adapter),
			adUnitCode: String(adUnitCode),
			creativeId: creativeId == null ? null : String(creativeId),
		} as const;

		const key = groups
			.map((g) => {
				const v = (
					{
						day: dims.day,
						hour: dims.hour,
						event: dims.event,
						adapter: dims.adapter,
						adUnitCode: dims.adUnitCode,
						creativeId: dims.creativeId,
					} as const
				)[g];
				return v == null ? "" : String(v);
			})
			.join("|");
		let bucket = map.get(key);
		if (!bucket) {
			const startISO = groups.includes("hour")
				? `${dims.day}T${dims.hour.slice(0, 2)}:00:00.000Z`
				: `${dims.day}T00:00:00.000Z`;
			bucket = {
				ts: startISO,
				date: groups.includes("day") ? dims.day : undefined,
				hour: groups.includes("hour") ? dims.hour : undefined,
				event: groups.includes("event") ? dims.event : undefined,
				adapter: groups.includes("adapter") ? dims.adapter : undefined,
				adUnitCode: groups.includes("adUnitCode") ? dims.adUnitCode : undefined,
				creativeId: groups.includes("creativeId") ? dims.creativeId : undefined,
				_cpms: [],
				count: 0,
				requests: 0,
				responses: 0,
				wins: 0,
				revenue: 0,
			};
			map.set(key, bucket);
		}

		bucket.count += 1;
		if (event === "request") bucket.requests += 1;
		if (event === "response") bucket.responses += 1;
		if (event === "win") {
			bucket.wins += 1;
			if (cpmNum != null) bucket.revenue += cpmNum / 1000;
		}
		if (cpmNum != null) bucket._cpms.push(cpmNum);
	}

	const rows: StatRow[] = [];
	for (const b of map.values()) {
		const avg = b._cpms.length
			? b._cpms.reduce((s, v) => s + v, 0) / b._cpms.length
			: undefined;
		const p = b._cpms.length ? p95(b._cpms) : undefined;
		rows.push({
			ts: b.ts,
			date: b.date,
			hour: b.hour,
			event: b.event,
			adapter: b.adapter,
			adUnitCode: b.adUnitCode,
			creativeId: b.creativeId,
			count: b.count,
			requests: b.requests || undefined,
			responses: b.responses || undefined,
			wins: b.wins || undefined,
			cpmAvg: avg != null ? Number(avg.toFixed(4)) : undefined,
			cpmP95: p != null ? Number(p.toFixed(4)) : undefined,
			revenue: b.revenue ? Number(b.revenue.toFixed(6)) : undefined,
		});
	}

	rows.sort((a, b) => (a.ts < b.ts ? -1 : a.ts > b.ts ? 1 : 0));
	return rows;
}
