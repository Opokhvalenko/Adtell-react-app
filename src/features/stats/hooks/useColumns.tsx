import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { useMemo } from "react";
import { METRICS } from "../constants/metrics";
import type { MetricKey, StatRow } from "../types";

const column = createColumnHelper<StatRow>();

export function useColumns(selectedMetrics: MetricKey[]) {
	const dimCols = useMemo(
		() => [
			column.accessor((r) => r.day ?? "", {
				id: "day",
				header: "Day (UTC)",
				cell: (info) => (
					<span className="font-mono tabular-nums">{info.getValue()}</span>
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
		],
		[],
	);

	const metricCols = useMemo(
		() =>
			selectedMetrics.map((k) =>
				column.accessor((row) => row[k] ?? null, {
					id: k,
					header: METRICS[k].label,
					cell: (info) => (
						<span className="tabular-nums">
							{METRICS[k].fmt(info.getValue())}
						</span>
					),
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
