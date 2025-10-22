import { useId } from "react";
import {
	CartesianGrid,
	Legend,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import type { MetricKey, StatRow } from "../types";

export function ChartModal({
	open,
	onClose,
	data,
	metrics,
	metricMeta,
}: {
	open: boolean;
	onClose: () => void;
	data: StatRow[];
	metrics: MetricKey[];
	metricMeta: Record<MetricKey, { label: string }>;
}) {
	const titleId = useId();
	if (!open) return null;

	return (
		<div className="fixed inset-0 flex items-center justify-center p-4">
			<button
				type="button"
				aria-label="Close chart modal"
				className="absolute inset-0 bg-black/50"
				onClick={onClose}
				onKeyDown={(e) => {
					if (e.key === "Escape" || e.key === "Enter" || e.key === " ")
						onClose();
				}}
			/>
			<div
				role="dialog"
				aria-modal="true"
				aria-labelledby={titleId}
				className="relative bg-white dark:bg-gray-900 rounded-xl p-4 w-full max-w-5xl"
				onClick={(e) => e.stopPropagation()}
				onKeyDown={(e) => e.stopPropagation()}
			>
				<div className="flex items-center justify-between mb-3">
					<h2 id={titleId} className="text-xl font-semibold">
						Metrics Comparison
					</h2>
					<button
						type="button"
						className="px-6 py-3 rounded-xl text-base font-semibold border border-border shadow-sm transition-all bg-surface text-gray-800 hover:shadow-md dark:bg-zinc-800 dark:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
						onClick={onClose}
					>
						Close
					</button>
				</div>
				<div className="h-[420px]">
					<ResponsiveContainer width="100%" height="100%">
						<LineChart data={data}>
							<CartesianGrid strokeDasharray="3 3" />
							<XAxis dataKey={(d: StatRow) => d.date ?? d.ts.slice(0, 10)} />
							<YAxis />
							<Tooltip />
							<Legend />
							{metrics.map((m) => (
								<Line
									key={m}
									type="monotone"
									dataKey={m}
									name={metricMeta[m].label}
									dot
								/>
							))}
						</LineChart>
					</ResponsiveContainer>
				</div>
			</div>
		</div>
	);
}
