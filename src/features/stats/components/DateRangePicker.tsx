import { type FC, useEffect, useId, useMemo, useRef, useState } from "react";

type Props = {
	from: string; // YYYY-MM-DD
	to: string; // YYYY-MM-DD
	onChange: (from: string, to: string) => void;
};

// helpers
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
function fmtDisplay(d: Date) {
	const mm = `${d.getMonth() + 1}`.padStart(2, "0");
	const dd = `${d.getDate()}`.padStart(2, "0");
	const yyyy = d.getFullYear();
	return `${mm}/${dd}/${yyyy}`;
}

type Cell = { date: Date | null; key: string };

const DateRangePicker: FC<Props> = ({ from, to, onChange }) => {
	const labelId = useId();
	const rootRef = useRef<HTMLDivElement>(null);
	const [open, setOpen] = useState(false);

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

	// build grid (Mon-first) with stable keys (no index keys)
	const grid: Cell[] = useMemo(() => {
		const y = cursor.getFullYear();
		const m = cursor.getMonth();
		const first = new Date(y, m, 1);
		const startIdx = (first.getDay() + 6) % 7; // Mon=0
		const daysInMonth = new Date(y, m + 1, 0).getDate();
		const cells: Cell[] = [];

		// leading empty cells (previous month dates as keys)
		for (let i = 0; i < startIdx; i++) {
			const dt = new Date(y, m, 1 - (startIdx - i));
			cells.push({ date: null, key: `lead-${y}-${m}-${dt.getDate()}` });
		}
		// current month
		for (let d = 1; d <= daysInMonth; d++) {
			const dt = new Date(y, m, d);
			cells.push({ date: dt, key: `day-${y}-${m}-${d}` });
		}
		// trailing empty cells (next month dates as keys)
		const tail = (7 - (cells.length % 7)) % 7;
		for (let i = 0; i < tail; i++) {
			const dt = new Date(y, m + 1, i + 1);
			cells.push({ date: null, key: `tail-${y}-${m}-${dt.getDate()}` });
		}
		return cells;
	}, [cursor]);

	const label = `${fmtDisplay(parseYMD(from))} - ${fmtDisplay(parseYMD(to))}`;

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
						{grid.map((cell) => {
							if (!cell.date) return <div key={cell.key} />;
							const d = cell.date;
							const inRange = isInRange(d);
							return (
								<button
									key={cell.key}
									type="button"
									onClick={() => pickDay(d)}
									className={[
										"h-9 rounded-full text-sm",
										inRange
											? "bg-blue-600 text-white"
											: "hover:bg-gray-100 dark:hover:bg-gray-700",
									].join(" ")}
								>
									{d.getDate()}
								</button>
							);
						})}
					</div>

					{/* presets */}
					<div className="mt-4 grid grid-cols-2 gap-2">
						<button
							type="button"
							className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
							onClick={() => applyRange(new Date(), new Date())}
						>
							Today
						</button>
						<button
							type="button"
							className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
							onClick={() => {
								const d = new Date();
								d.setDate(d.getDate() - 1);
								applyRange(d, d);
							}}
						>
							Yesterday
						</button>
						<button
							type="button"
							className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
							onClick={() => {
								const e = new Date();
								const s = new Date();
								s.setDate(s.getDate() - 6);
								applyRange(s, e);
							}}
						>
							Last 7 days
						</button>
						<button
							type="button"
							className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
							onClick={() => {
								const e = new Date();
								const s = new Date();
								s.setDate(s.getDate() - 13);
								applyRange(s, e);
							}}
						>
							Last 14 days
						</button>
						<button
							type="button"
							className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
							onClick={() => {
								const e = new Date();
								const s = new Date();
								s.setDate(s.getDate() - 29);
								applyRange(s, e);
							}}
						>
							Last 30 days
						</button>
						<button
							type="button"
							className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
							onClick={() => {
								const n = new Date();
								const s = new Date(n.getFullYear(), n.getMonth(), 1);
								const e = new Date(n.getFullYear(), n.getMonth() + 1, 0);
								applyRange(s, e);
							}}
						>
							This Month
						</button>
						<button
							type="button"
							className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 col-span-2"
							onClick={() => {
								const n = new Date();
								const s = new Date(n.getFullYear(), n.getMonth() - 1, 1);
								const e = new Date(n.getFullYear(), n.getMonth(), 0);
								applyRange(s, e);
							}}
						>
							Last Month
						</button>
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
};

export default DateRangePicker;
