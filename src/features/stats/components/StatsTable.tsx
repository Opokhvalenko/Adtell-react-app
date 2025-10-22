import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";
import type React from "react";
import { useMemo, useState } from "react";
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
	)
		return String(ak);
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
	const [pageIndex, setPageIndex] = useState(0);
	const [pageSize, setPageSize] = useState(100);

	const table = useReactTable({
		data,
		columns,
		state: { pagination: { pageIndex, pageSize } },
		onPaginationChange: (updater) => {
			const next =
				typeof updater === "function"
					? updater({ pageIndex, pageSize })
					: updater;
			setPageIndex(next.pageIndex);
			setPageSize(next.pageSize);
		},
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
	});

	const metricIds = useMemo(
		() => new Set<string>(selectedMetrics as unknown as string[]),
		[selectedMetrics],
	);

	const widthById: Record<string, string> = {
		date: "9rem",
		hour: "7rem",
		event: "12rem",
		adapter: "10rem",
		adUnitCode: "11rem",
		creativeId: "9rem",
	};
	const metricWidth = "8.5rem";

	return (
		<div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white/70 dark:bg-white/5 dark:border-zinc-700 shadow-sm">
			<table className="min-w-full table-auto border-separate border-spacing-0 text-sm">
				<colgroup>
					{columns.map((c, i) => {
						const id = getColId(c, i);
						const w = widthById[id] || metricWidth;
						return <col key={id} style={{ width: w }} />;
					})}
				</colgroup>

				<thead className="sticky top-0 z-10">
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
										className="sticky top-0 border-b border-zinc-200 dark:border-zinc-700 bg-white/90 dark:bg-zinc-900/80 backdrop-blur supports-[backdrop-filter]:bg-white/70"
									>
										<div className="flex items-center justify-between px-3 pt-2">
											<button
												type="button"
												className="cursor-pointer select-none flex items-center gap-1 font-semibold text-zinc-700 dark:text-zinc-100"
												onClick={
													canSort && sortHandler ? sortHandler : undefined
												}
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
												<span className="ml-1 text-xs">
													{
														({ asc: "↑", desc: "↓", false: "" } as const)[
															String(sort || "false") as
																| "asc"
																| "desc"
																| "false"
														]
													}
												</span>
											</button>
										</div>

										{h.column.getCanFilter() && (
											<div className="px-3 pb-2">
												<input
													className="w-full h-8 rounded-md border border-zinc-300 bg-white px-2 text-xs placeholder:text-zinc-400 dark:bg-zinc-700 dark:text-white dark:border-zinc-600 dark:placeholder-zinc-300"
													placeholder="Filter…"
													aria-label={`Filter ${String(
														h.column.columnDef.header ?? h.column.id,
													)}`}
													value={(h.column.getFilterValue() as string) ?? ""}
													onChange={(e) =>
														h.column.setFilterValue(e.target.value)
													}
												/>
											</div>
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
							<td
								className="p-4 text-zinc-600 dark:text-zinc-300"
								colSpan={columns.length}
							>
								No data
							</td>
						</tr>
					) : (
						table.getRowModel().rows.map((row) => (
							<tr
								key={row.id}
								className="border-t border-zinc-200 dark:border-zinc-700 odd:bg-zinc-50/50 dark:odd:bg-white/5 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
							>
								{row.getVisibleCells().map((cell) => {
									const isMetric = metricIds.has(cell.column.id);
									return (
										<td
											key={cell.id}
											className={[
												"px-3 py-2 align-top whitespace-nowrap",
												isMetric ? "text-right tabular-nums" : "",
											].join(" ")}
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

			<div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-zinc-200 dark:border-zinc-700 bg-white/70 dark:bg-zinc-900/50">
				<div className="flex items-center gap-2">
					<span className="text-sm text-zinc-600 dark:text-zinc-300">
						Page Size:
					</span>
					<select
						className="h-9 min-w-[72px] rounded-md border border-zinc-300 bg-white px-2 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-600 dark:bg-zinc-800 dark:border-zinc-600"
						value={pageSize}
						onChange={(e) => table.setPageSize(Number(e.target.value))}
					>
						{[25, 50, 100, 200, 500].map((n) => (
							<option key={n} value={n}>
								{n}
							</option>
						))}
					</select>
				</div>

				<div className="text-sm text-zinc-600 dark:text-zinc-300">
					{(() => {
						const total = data.length;
						const start = Math.min(total, pageIndex * pageSize + 1);
						const end = Math.min(total, (pageIndex + 1) * pageSize);
						return `${start} to ${end} of ${total}`;
					})()}
				</div>

				<div className="flex items-center gap-1">
					{[
						{
							label: "«",
							act: () => table.firstPage(),
							dis: !table.getCanPreviousPage(),
						},
						{
							label: "‹",
							act: () => table.previousPage(),
							dis: !table.getCanPreviousPage(),
						},
						{
							label: "›",
							act: () => table.nextPage(),
							dis: !table.getCanNextPage(),
						},
						{
							label: "»",
							act: () => table.lastPage(),
							dis: !table.getCanNextPage(),
						},
					].map((b) => (
						<button
							key={b.label}
							type="button"
							onClick={b.act}
							disabled={b.dis}
							aria-label={b.label}
							className="h-9 w-9 rounded-md border border-zinc-300 bg-white hover:bg-zinc-50 disabled:opacity-40 dark:bg-zinc-800 dark:border-zinc-600 dark:hover:bg-zinc-700"
						>
							{b.label}
						</button>
					))}
				</div>
			</div>
		</div>
	);
}

export default StatsTable;
