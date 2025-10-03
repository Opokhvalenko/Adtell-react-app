import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { METRICS } from "../constants/metrics";
import type { MetricKey, StatRow } from "../types";

const column = createColumnHelper<StatRow>();

export function useColumns(selectedMetrics: MetricKey[]) {
	const metricColumns = selectedMetrics.map((m) =>
		column.accessor((row) => (row[m] ?? null) as number | null, {
			id: m,
			header: METRICS[m].label,
			cell: (info) => {
				const raw = info.getValue() ?? undefined;
				const fmt = METRICS[m].fmt;
				return (
					<span className="tabular-nums">
						{fmt ? fmt(raw) : String(raw ?? "")}
					</span>
				);
			},
		}),
	);

	const baseColumns = [
		column.accessor((r) => r.date ?? r.ts.slice(0, 10), {
			id: "date",
			header: "Date",
			cell: (info) => (
				<span className="font-mono">{info.getValue<string>()}</span>
			),
		}),
		column.accessor("hour", { header: "Hour" }),
		column.accessor("event", { header: "Event" }),
		column.accessor("adapter", { header: "Adapter" }),
		column.accessor("adUnitCode", { header: "AdUnit" }),
		column.accessor((r) => String(r.creativeId ?? ""), {
			id: "creativeId",
			header: "Creative",
		}),
	];

	const columns = [...baseColumns, ...metricColumns] as unknown as ColumnDef<
		StatRow,
		unknown
	>[];

	return {
		columns,
		baseColumns: baseColumns as unknown as ColumnDef<StatRow, unknown>[],
		metricColumns: metricColumns as unknown as ColumnDef<StatRow, unknown>[],
	};
}
