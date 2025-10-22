import type { MetricKey } from "../types";

type ChipProps = { active: boolean; label: string; onClick: () => void };

function ToggleChip({ active, label, onClick }: ChipProps) {
	return (
		<button
			type="button"
			role="switch"
			aria-checked={active}
			onClick={onClick}
			className={[
				"inline-flex items-center gap-3 h-10 px-3 rounded-xl border transition-all select-none",
				active
					? "border-emerald-600 text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-300"
					: "border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100",
			].join(" ")}
		>
			<span
				aria-hidden
				className={[
					"inline-flex items-center h-5 w-9 rounded-full border",
					active
						? "border-emerald-600 bg-emerald-100 dark:bg-emerald-900/40"
						: "border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-700",
				].join(" ")}
			>
				<span
					className={[
						"block h-3.5 w-3.5 rounded-full mx-1 transition-transform",
						active
							? "translate-x-3.5 bg-emerald-600"
							: "translate-x-0 bg-zinc-400",
					].join(" ")}
				/>
			</span>
			<span className="font-semibold">{label}</span>
		</button>
	);
}

export function MetricsChips({
	all,
	selected,
	toggle,
}: {
	all: Record<MetricKey, { label: string }>;
	selected: MetricKey[];
	toggle: (m: MetricKey) => void;
}) {
	return (
		<div className="flex flex-wrap gap-3">
			{(Object.keys(all) as MetricKey[]).map((m) => (
				<ToggleChip
					key={m}
					label={all[m].label}
					active={selected.includes(m)}
					onClick={() => toggle(m)}
				/>
			))}
		</div>
	);
}
export default MetricsChips;
