import { useEffect, useId, useMemo, useRef, useState } from "react";

export type ControlsProps = {
	from: string;
	to: string;
	groupBy: string;
	setFrom: (v: string) => void;
	setTo: (v: string) => void;
	setGroupBy: (v: string) => void;

	viewName: string;
	setViewName: (v: string) => void;
	names: string[];
	onSaveView: () => void;
	onLoadView: (name: string) => void;

	onOpenChart: () => void;

	onExportCSV: () => void;
	onCopyCSV: () => void;
};

/* ───────────── helpers ───────────── */
function fmtDisplay(d: Date) {
	const mm = `${d.getMonth() + 1}`.padStart(2, "0");
	const dd = `${d.getDate()}`.padStart(2, "0");
	const yyyy = d.getFullYear();
	return `${mm}/${dd}/${yyyy}`;
}
function parseYMD(s: string) {
	const [y, m, d] = s.split("-").map(Number);
	return new Date(y, (m || 1) - 1, d || 1);
}
function toYMD(d: Date) {
	const yyyy = d.getFullYear();
	const mm = `${d.getMonth() + 1}`.padStart(2, "0");
	const dd = `${d.getDate()}`.padStart(2, "0");
	return `${yyyy}-${mm}-${dd}`;
}

/* ───────────── DateRangePickerLite ───────────── */
function DateRangePickerLite({
	from,
	to,
	onChange,
}: {
	from: string;
	to: string;
	onChange: (f: string, t: string) => void;
}) {
	const rootRef = useRef<HTMLDivElement>(null);
	const [open, setOpen] = useState(false);
	const labelId = useId();

	const [cursor, setCursor] = useState<Date>(() => parseYMD(from));
	const [start, setStart] = useState<Date>(() => parseYMD(from));
	const [end, setEnd] = useState<Date>(() => parseYMD(to));

	useEffect(() => {
		const s = parseYMD(from);
		const e = parseYMD(to);
		setStart(s);
		setEnd(e);
		setCursor(s);
	}, [from, to]);

	useEffect(() => {
		function onDoc(e: MouseEvent) {
			if (!open) return;
			const el = rootRef.current;
			if (el && !el.contains(e.target as Node)) {
				setStart(parseYMD(from));
				setEnd(parseYMD(to));
				setCursor(parseYMD(from));
				setOpen(false);
			}
		}
		document.addEventListener("mousedown", onDoc);
		return () => document.removeEventListener("mousedown", onDoc);
	}, [open, from, to]);

	type Cell = { date: Date | null; key: string };

	const grid: Cell[] = useMemo(() => {
		const y = cursor.getFullYear();
		const m = cursor.getMonth();
		const first = new Date(y, m, 1);
		const startIdx = (first.getDay() + 6) % 7;
		const daysInMonth = new Date(y, m + 1, 0).getDate();
		const cells: Cell[] = [];

		for (let i = 0; i < startIdx; i++) {
			const dt = new Date(y, m, 1 - (startIdx - i));
			cells.push({ date: null, key: `lead-${dt.toDateString()}` });
		}

		for (let d = 1; d <= daysInMonth; d++) {
			const dt = new Date(y, m, d);
			cells.push({ date: dt, key: `day-${toYMD(dt)}` });
		}

		const tail = (7 - (cells.length % 7)) % 7;
		for (let i = 0; i < tail; i++) {
			const dt = new Date(y, m + 1, i + 1);
			cells.push({ date: null, key: `tail-${dt.toDateString()}` });
		}
		return cells;
	}, [cursor]);

	const label = `${fmtDisplay(parseYMD(from))} - ${fmtDisplay(parseYMD(to))}`;

	const presets: Array<{ label: string; calc: () => [Date, Date] }> = [
		{
			label: "Today",
			calc: () => {
				const d = new Date();
				return [d, d];
			},
		},
		{
			label: "Yesterday",
			calc: () => {
				const d = new Date();
				d.setDate(d.getDate() - 1);
				return [d, d];
			},
		},
		{
			label: "Last 7 days",
			calc: () => {
				const e = new Date();
				const s = new Date();
				s.setDate(s.getDate() - 6);
				return [s, e];
			},
		},
		{
			label: "Last 14 days",
			calc: () => {
				const e = new Date();
				const s = new Date();
				s.setDate(s.getDate() - 13);
				return [s, e];
			},
		},
		{
			label: "Last 30 days",
			calc: () => {
				const e = new Date();
				const s = new Date();
				s.setDate(s.getDate() - 29);
				return [s, e];
			},
		},
		{
			label: "This Month",
			calc: () => {
				const n = new Date();
				const s = new Date(n.getFullYear(), n.getMonth(), 1);
				const e = new Date(n.getFullYear(), n.getMonth() + 1, 0);
				return [s, e];
			},
		},
		{
			label: "Last Month",
			calc: () => {
				const n = new Date();
				const s = new Date(n.getFullYear(), n.getMonth() - 1, 1);
				const e = new Date(n.getFullYear(), n.getMonth(), 0);
				return [s, e];
			},
		},
	];

	function pickDay(d: Date) {
		if (!start || (start && end)) {
			setStart(d);
			setEnd(d);
			return;
		}
		if (d < start) {
			setEnd(start);
			setStart(d);
		} else {
			setEnd(d);
		}
	}

	function applyRange(s: Date, e: Date) {
		onChange(toYMD(s), toYMD(e));
		setOpen(false);
	}

	const isInRange = (d: Date) => d >= start && d <= end;

	return (
		<div ref={rootRef} className="relative">
			<span
				id={labelId}
				className="text-sm font-semibold text-gray-700 dark:text-gray-200 block mb-1"
			>
				Metrics
			</span>

			<button
				type="button"
				aria-haspopup="dialog"
				aria-expanded={open}
				aria-labelledby={labelId}
				onClick={() => setOpen((v) => !v)}
				className="w-[320px] h-11 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 text-left font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
			>
				{label}
			</button>

			{open && (
				<div
					role="dialog"
					aria-label="Choose date range"
					tabIndex={-1}
					className="absolute z-20 mt-2 w-[370px] rounded-2xl border bg-white dark:bg-gray-800 dark:border-gray-700 shadow-2xl p-4"
				>
					{/* header */}
					<div className="flex items-center justify-between mb-3">
						<button
							type="button"
							className="px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
							onClick={() =>
								setCursor(
									new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1),
								)
							}
							aria-label="Previous month"
						>
							‹
						</button>
						<div className="font-semibold">
							{cursor.toLocaleString(undefined, {
								month: "long",
								year: "numeric",
							})}
						</div>
						<button
							type="button"
							className="px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
							onClick={() =>
								setCursor(
									new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1),
								)
							}
							aria-label="Next month"
						>
							›
						</button>
					</div>

					{/* weekdays */}
					<div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 mb-1">
						{["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
							<div key={d}>{d}</div>
						))}
					</div>

					{/* days */}
					<div className="grid grid-cols-7 gap-1 text-center">
						{grid.map((cell) =>
							cell.date ? (
								<button
									key={cell.key}
									type="button"
									onClick={() => pickDay(cell.date as Date)}
									className={[
										"h-9 rounded-full text-sm",
										isInRange(cell.date as Date)
											? "bg-blue-600 text-white"
											: "hover:bg-gray-100 dark:hover:bg-gray-700",
									].join(" ")}
								>
									{(cell.date as Date).getDate()}
								</button>
							) : (
								<div key={cell.key} />
							),
						)}
					</div>

					{/* presets */}
					<div className="mt-4 grid grid-cols-2 gap-2">
						{presets.map((p) => (
							<button
								key={p.label}
								type="button"
								className="h-9 px-3 rounded-lg border text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-left"
								onClick={() => {
									const [s, e] = p.calc();
									applyRange(s, e);
								}}
							>
								{p.label}
							</button>
						))}
					</div>

					{/* actions */}
					<div className="mt-3 flex justify-end gap-2">
						<button
							type="button"
							className="h-9 px-3 rounded-lg border"
							onClick={() => {
								setStart(parseYMD(from));
								setEnd(parseYMD(to));
								setCursor(parseYMD(from));
								setOpen(false);
							}}
						>
							Cancel
						</button>
						<button
							type="button"
							className="h-9 px-3 rounded-lg bg-blue-600 text-white"
							onClick={() => applyRange(start, end)}
						>
							Apply
						</button>
					</div>
				</div>
			)}
		</div>
	);
}

/* ───────────── Controls ───────────── */

export function Controls(props: ControlsProps) {
	const {
		from,
		to,
		groupBy,
		setFrom,
		setTo,
		setGroupBy,
		viewName,
		setViewName,
		names,
		onSaveView,
		onLoadView,
		onOpenChart,
		onExportCSV,
		onCopyCSV,
	} = props;

	return (
		<div className="p-4 rounded-2xl border border-zinc-200 bg-white/80 shadow-sm dark:border-zinc-700 dark:bg-zinc-800/80">
			<div className="flex flex-wrap items-end gap-4">
				<DateRangePickerLite
					from={from}
					to={to}
					onChange={(f, t) => {
						setFrom(f);
						setTo(t);
					}}
				/>

				<label className="flex flex-col">
					<span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 mb-1">
						Group by
					</span>
					<input
						value={groupBy}
						onChange={(e) => setGroupBy(e.target.value)}
						placeholder="day,event,adapter"
						className="w-[320px] h-11 rounded-xl border border-zinc-300 bg-white px-3 focus:outline-none focus:ring-2 focus:ring-emerald-600 dark:border-zinc-600 dark:bg-zinc-800"
					/>
				</label>

				<div className="ml-auto flex flex-wrap items-center gap-3">
					<button
						type="button"
						onClick={onCopyCSV}
						title="Copy CSV to clipboard"
						className="h-11 px-4 rounded-xl border border-zinc-300 bg-white hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:hover:bg-zinc-700"
					>
						📋
					</button>

					<button
						type="button"
						onClick={onExportCSV}
						title="Export to CSV"
						className="h-11 px-4 rounded-xl border border-zinc-300 bg-white hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:hover:bg-zinc-700"
					>
						⤓ CSV
					</button>

					<div className="flex items-center gap-2">
						<input
							placeholder="view name"
							className="h-11 w-40 rounded-xl border border-zinc-300 bg-white px-3 focus:outline-none focus:ring-2 focus:ring-emerald-600 dark:border-zinc-600 dark:bg-zinc-800"
							value={viewName}
							onChange={(e) => setViewName(e.target.value)}
						/>
						<button
							type="button"
							onClick={onSaveView}
							className="h-11 px-4 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-600"
						>
							Save View
						</button>
						<select
							className="h-11 rounded-xl border border-zinc-300 bg-white px-3 focus:outline-none focus:ring-2 focus:ring-emerald-600 dark:border-zinc-600 dark:bg-zinc-800"
							onChange={(e) => onLoadView(e.target.value)}
							value=""
						>
							<option value="" disabled>
								Select View
							</option>
							{names.map((n) => (
								<option key={n} value={n}>
									{n}
								</option>
							))}
						</select>

						<button
							type="button"
							onClick={onOpenChart}
							className="h-11 px-4 rounded-xl border border-zinc-300 bg-white hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:hover:bg-zinc-700"
						>
							Compare (Chart)
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
export default Controls;
