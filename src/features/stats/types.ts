export type MetricKey =
	| "count"
	| "requests"
	| "responses"
	| "wins"
	| "cpmAvg"
	| "cpmP95"
	| "ctr"
	| "revenue";

export interface StatRow {
	ts: string; // ISO початок бакета (година/день)
	date?: string;
	hour?: string; // "13:00"
	event?: string;
	adapter?: string;
	adUnitCode?: string;
	creativeId?: string | number | null;

	count?: number;
	requests?: number;
	responses?: number;
	wins?: number;
	cpmAvg?: number;
	cpmP95?: number;
	ctr?: number; // 0..1
	revenue?: number; // USD
}
