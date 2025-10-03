import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";
import type React from "react";
import { useMemo } from "react";
import type { MetricKey, StatRow } from "../types";

type Props = {
	data: StatRow[];
	columns: ColumnDef<StatRow, unknown>[];
	selectedMetrics: MetricKey[];
	isLoading?: boolean;
	error?: unknown;
};

type MaybeId = { id?: unknown };
type MaybeAccessorKey = { accessorKey?: string | number | symbol };

function getColId(c: ColumnDef<StatRow, unknown>, index: number): string {
	const id = (c as MaybeId).id;
	if (typeof id === "string" && id) return id;

	const ak = (c as MaybeAccessorKey).accessorKey;
	if (
		typeof ak === "string" ||
		typeof ak === "number" ||
		typeof ak === "symbol"
	) {
		return String(ak);
	}

	return `col-${index}`;
}

function errMessage(err: unknown): string {
	if (err && typeof err === "object" && "message" in err) {
		const m = (err as { message?: unknown }).message;
		if (typeof m === "string") return m;
	}
	try {
		return JSON.stringify(err);
	} catch {
		return String(err);
	}
}

export function StatsTable({
	data,
	columns,
	selectedMetrics,
	isLoading,
	error,
}: Props) {
	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getSortedRowModel: getSortedRowModel(),
	});

	const metricIds = useMemo(
		() => new Set<string>(selectedMetrics as unknown as string[]),
		[selectedMetrics],
	);

	const widthById: Record<string, string> = {
		date: "9rem",
		hour: "6rem",
		event: "10rem",
		adapter: "10rem",
		adUnitCode: "10rem",
		creativeId: "9rem",
	};

	return (
		<div className="overflow-x-auto rounded-xl border bg-white/60 dark:bg-white/5 shadow-sm backdrop-blur-sm">
			<table className="min-w-full table-fixed border-separate border-spacing-0 text-sm">
				<colgroup>
					{columns.map((c, i) => {
						const id = getColId(c, i);
						const w = widthById[id];
						return <col key={id} style={w ? { width: w } : undefined} />;
					})}
				</colgroup>

				<thead className="bg-gray-50/80 dark:bg-gray-900/80 sticky top-0 z-10">
					{table.getHeaderGroups().map((hg) => (
						<tr key={hg.id}>
							{hg.headers.map((h) => {
								const canSort = h.column.getCanSort();
								const sortHandler = h.column.getToggleSortingHandler();
								const sort = h.column.getIsSorted();

								return (
									<th
										key={h.id}
										aria-sort={
											sort === "asc"
												? "ascending"
												: sort === "desc"
													? "descending"
													: "none"
										}
										className="p-2 text-left border-b text-[12px] font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300 bg-white/80 dark:bg-gray-900/80 sticky top-0"
									>
										<button
											type="button"
											className="cursor-pointer select-none flex items-center gap-1 disabled:opacity-50"
											onClick={canSort && sortHandler ? sortHandler : undefined}
											onKeyDown={(e) => {
												if (!canSort || !sortHandler) return;
												if (e.key === "Enter" || e.key === " ") {
													e.preventDefault();
													sortHandler(e as unknown as React.MouseEvent);
												}
											}}
											aria-label="Sort column"
											disabled={!canSort}
										>
											{flexRender(h.column.columnDef.header, h.getContext())}
											{
												({ asc: "↑", desc: "↓", false: "" } as const)[
													String(sort || "false") as "asc" | "desc" | "false"
												]
											}
										</button>

										{h.column.getCanFilter() && (
											<input
												className="mt-1 w-full h-8 rounded-md border px-2 text-xs placeholder:text-gray-400 dark:bg-transparent"
												placeholder="Filter…"
												aria-label={`Filter ${String(
													h.column.columnDef.header ?? h.column.id,
												)}`}
												value={(h.column.getFilterValue() as string) ?? ""}
												onChange={(e) =>
													h.column.setFilterValue(e.target.value)
												}
											/>
										)}
									</th>
								);
							})}
						</tr>
					))}
				</thead>

				<tbody>
					{isLoading ? (
						<tr>
							<td className="p-4" colSpan={columns.length}>
								Loading…
							</td>
						</tr>
					) : error ? (
						<tr>
							<td className="p-4 text-red-600" colSpan={columns.length}>
								{errMessage(error)}
							</td>
						</tr>
					) : table.getRowModel().rows.length === 0 ? (
						<tr>
							<td className="p-4" colSpan={columns.length}>
								No data
							</td>
						</tr>
					) : (
						table.getRowModel().rows.map((row) => (
							<tr
								key={row.id}
								className="border-t odd:bg-gray-50/50 dark:odd:bg-white/5 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
							>
								{row.getVisibleCells().map((cell) => {
									const isMetric = metricIds.has(cell.column.id);
									return (
										<td
											key={cell.id}
											className={`p-2 align-top ${isMetric ? "text-right tabular-nums" : ""}`}
										>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</td>
									);
								})}
							</tr>
						))
					)}
				</tbody>
			</table>
		</div>
	);
}
