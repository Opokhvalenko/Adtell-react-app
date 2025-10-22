import { type FC, useEffect, useId, useMemo, useRef, useState } from "react";

type Props = {
	from: string;
	to: string;
	onChange: (from: string, to: string) => void;
};

function parseYMD(s: string) {
	const [y, m, d] = s.split("-").map(Number);
	return new Date(y, (m || 1) - 1, d || 1);
}
function toYMD(d: Date) {
	const y = d.getFullYear(),
		m = String(d.getMonth() + 1).padStart(2, "0"),
		day = String(d.getDate()).padStart(2, "0");
	return `${y}-${m}-${day}`;
}
function fmtDisplay(d: Date) {
	const m = String(d.getMonth() + 1).padStart(2, "0"),
		day = String(d.getDate()).padStart(2, "0");
	return `${m}/${day}/${d.getFullYear()}`;
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
		const s = parseYMD(from),
			e = parseYMD(to);
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

	const grid: Cell[] = useMemo(() => {
		const y = cursor.getFullYear(),
			m = cursor.getMonth();
		const first = new Date(y, m, 1);
		const startIdx = (first.getDay() + 6) % 7;
		const days = new Date(y, m + 1, 0).getDate();
		const cells: Cell[] = [];
		for (let i = 0; i < startIdx; i++)
			cells.push({ date: null, key: `lead-${y}-${m}-${i}` });
		for (let d = 1; d <= days; d++)
			cells.push({ date: new Date(y, m, d), key: `day-${y}-${m}-${d}` });
		const tail = (7 - (cells.length % 7)) % 7;
		for (let i = 0; i < tail; i++)
			cells.push({ date: null, key: `tail-${y}-${m}-${i}` });
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
				className="block mb-1 text-sm font-semibold text-zinc-700 dark:text-zinc-200"
			>
				Metrics
			</span>

			<button
				type="button"
				aria-haspopup="dialog"
				aria-expanded={open}
				aria-labelledby={labelId}
				onClick={() => setOpen((v) => !v)}
				className="w-[320px] h-11 rounded-xl border border-zinc-300 bg-white px-4 text-left font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 dark:border-zinc-600 dark:bg-zinc-800"
			>
				{label}
			</button>

			{open && (
				<div
					role="dialog"
					aria-label="Choose date range"
					tabIndex={-1}
					className="absolute z-20 mt-2 w-[370px] rounded-2xl border border-zinc-300 bg-white shadow-2xl p-4 dark:border-zinc-700 dark:bg-zinc-800"
				>
					<div className="flex items-center justify-between mb-3">
						<button
							type="button"
							className="h-9 px-3 rounded-lg border border-zinc-300 bg-white hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:hover:bg-zinc-700"
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
							className="h-9 px-3 rounded-lg border border-zinc-300 bg-white hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:hover:bg-zinc-700"
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

					<div className="grid grid-cols-7 gap-1 text-center text-xs text-zinc-500 mb-1">
						{["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
							<div key={d}>{d}</div>
						))}
					</div>

					<div className="grid grid-cols-7 gap-1 text-center">
						{grid.map((cell) => {
							if (!cell.date) return <div key={cell.key} />;
							const d = cell.date,
								inRange = isInRange(d);
							return (
								<button
									key={cell.key}
									type="button"
									onClick={() => pickDay(d)}
									className={[
										"h-9 rounded-full text-sm",
										inRange
											? "bg-emerald-600 text-white"
											: "hover:bg-zinc-100 dark:hover:bg-zinc-700",
									].join(" ")}
								>
									{d.getDate()}
								</button>
							);
						})}
					</div>

					<div className="mt-4 grid grid-cols-2 gap-2">
						{[
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
									return [
										new Date(n.getFullYear(), n.getMonth(), 1),
										new Date(n.getFullYear(), n.getMonth() + 1, 0),
									];
								},
							},
							{
								label: "Last Month",
								calc: () => {
									const n = new Date();
									return [
										new Date(n.getFullYear(), n.getMonth() - 1, 1),
										new Date(n.getFullYear(), n.getMonth(), 0),
									];
								},
							},
						].map((p) => (
							<button
								key={p.label}
								type="button"
								className="h-9 px-3 rounded-lg border border-zinc-300 bg-white text-left hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:hover:bg-zinc-700"
								onClick={() => {
									const [s, e] = p.calc();
									applyRange(s, e);
								}}
							>
								{p.label}
							</button>
						))}
					</div>

					<div className="mt-3 flex justify-end gap-2">
						<button
							type="button"
							className="h-9 px-3 rounded-lg border border-zinc-300 bg-white hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:hover:bg-zinc-700"
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
							className="h-9 px-3 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-600"
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
