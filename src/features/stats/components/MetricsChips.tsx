import type { MetricKey } from "../types";

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
		<div className="flex flex-wrap gap-2">
			{(Object.keys(all) as MetricKey[]).map((m) => {
				const active = selected.includes(m);
				return (
					<button
						type="button"
						key={m}
						onClick={() => toggle(m)}
						className={`px-3 py-1 rounded-full text-sm border ${
							active ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-800"
						}`}
					>
						{all[m].label}
					</button>
				);
			})}
		</div>
	);
}
