import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { useMemo } from "react";
import { METRICS } from "../constants/metrics";
import type { MetricKey, StatRow } from "../types";

const column = createColumnHelper<StatRow>();

type MetricMap = Partial<Record<MetricKey, number | string | null | undefined>>;

function safeDate(r: StatRow): string {
	if (typeof r.date === "string" && r.date) return r.date;
	const ts = r.ts;
	if (typeof ts === "string" && ts.length >= 10) return ts.slice(0, 10);
	return "";
}

function safeHour(r: StatRow): string {
	if (typeof r.hour === "string" && r.hour) return r.hour;
	const ts = r.ts;
	if (typeof ts === "string" && ts.length >= 13)
		return `${ts.slice(11, 13)}:00`;
	return "";
}

function getMetric(row: StatRow, key: MetricKey): number | null {
	const v = (row as unknown as MetricMap)[key];
	if (v == null) return null;
	return typeof v === "number" ? v : Number(v);
}

export function useColumns(selectedMetrics: MetricKey[]) {
	const dimCols = useMemo(
		() => [
			column.accessor((r) => safeDate(r), {
				id: "date",
				header: "Date",
				cell: (info) => (
					<span className="font-mono tabular-nums">
						{String(info.getValue() ?? "")}
					</span>
				),
				enableSorting: true,
			}),
			column.accessor((r) => safeHour(r), {
				id: "hour",
				header: "Hour",
				cell: (info) => (
					<span className="font-mono tabular-nums">
						{String(info.getValue() ?? "")}
					</span>
				),
				enableSorting: true,
			}),
			column.accessor((r) => r.event ?? "", {
				id: "event",
				header: "Event",
				enableSorting: true,
			}),
			column.accessor((r) => r.adapter ?? "", {
				id: "adapter",
				header: "Adapter",
				enableSorting: true,
			}),
			column.accessor((r) => r.adUnitCode ?? "", {
				id: "adUnitCode",
				header: "AdUnit",
				enableSorting: true,
			}),
			column.accessor((r) => String(r.creativeId ?? ""), {
				id: "creativeId",
				header: "Creative",
				enableSorting: true,
			}),
		],
		[],
	);

	const metricCols = useMemo(
		() =>
			selectedMetrics.map((k) =>
				column.accessor((row) => getMetric(row, k), {
					id: k,
					header: METRICS[k].label,
					cell: (info) => {
						const raw = info.getValue() as number | null | undefined;
						const fmt = METRICS[k].fmt;
						return (
							<span className="tabular-nums">
								{fmt ? fmt(raw ?? undefined) : String(raw ?? "")}
							</span>
						);
					},
					enableSorting: true,
					enableColumnFilter: false,
				}),
			),
		[selectedMetrics],
	);

	const columns = useMemo(
		() =>
			[...dimCols, ...metricCols] as unknown as ColumnDef<StatRow, unknown>[],
		[dimCols, metricCols],
	);

	return {
		columns,
		baseColumns: dimCols as unknown as ColumnDef<StatRow, unknown>[],
		metricColumns: metricCols as unknown as ColumnDef<StatRow, unknown>[],
	};
}

export default useColumns;
