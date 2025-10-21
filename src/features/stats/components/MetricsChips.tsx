import type { MetricKey } from "../types";

type ChipProps = {
	active: boolean;
	label: string;
	onClick: () => void;
};

function ToggleChip({ active, label, onClick }: ChipProps) {
	return (
		<button
			type="button"
			role="switch"
			aria-checked={active}
			onClick={onClick}
			className={[
				"inline-flex items-center gap-3 px-4 h-11 rounded-xl border",
				"transition-all duration-150 select-none",
				active
					? "bg-blue-600 text-white border-blue-600 shadow-sm"
					: "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600",
			].join(" ")}
		>
			<span
				aria-hidden="true"
				className={[
					"inline-flex items-center h-5 w-8 rounded-full border",
					active
						? "bg-white/20 border-white/50"
						: "bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500",
				].join(" ")}
			>
				<span
					className={[
						"block h-3 w-3 rounded-full mx-1 transition-transform",
						active ? "translate-x-3 bg-white" : "translate-x-0 bg-gray-500",
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
