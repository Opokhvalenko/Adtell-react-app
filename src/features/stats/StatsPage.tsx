import { useState } from "react";
import { ChartModal } from "./components/ChartModal";
import { Controls } from "./components/Controls";
import { MetricsChips } from "./components/MetricsChips";
import { StatsTable } from "./components/StatsTable";
import { METRICS } from "./constants/metrics";
import { useColumns } from "./hooks/useColumns";
import { useStatsQuery } from "./hooks/useStatsQuery";
import type { MetricKey } from "./types";
import { useSavedViews } from "./useSavedViews";

function useTodayRange() {
	const now = new Date();
	const to = now.toISOString().slice(0, 10);
	const from = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2)
		.toISOString()
		.slice(0, 10);
	return { from, to };
}

export default function StatsPage() {
	const { from: defFrom, to: defTo } = useTodayRange();
	const [from, setFrom] = useState(defFrom);
	const [to, setTo] = useState(defTo);
	const [groupBy, setGroupBy] = useState("day,event,adapter");
	const [selectedMetrics, setSelectedMetrics] = useState<MetricKey[]>([
		"count",
		"wins",
		"cpmAvg",
	]);
	const [chartOpen, setChartOpen] = useState(false);

	const { names, saveView, getView } = useSavedViews();
	const [viewName, setViewName] = useState("");

	const {
		data = [],
		isLoading,
		error,
	} = useStatsQuery({
		from,
		to,
		groupBy,
		metrics: selectedMetrics,
	});

	const { columns } = useColumns(selectedMetrics);

	function toggleMetric(m: MetricKey) {
		setSelectedMetrics((prev) =>
			prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m],
		);
	}
	function onSaveView() {
		const name = viewName.trim() || "Default";
		saveView({ name, metrics: selectedMetrics, groupBy });
	}
	function onLoadView(name: string) {
		const v = getView(name);
		if (!v) return;
		setSelectedMetrics(v.metrics);
		setGroupBy(v.groupBy);
		setViewName(v.name);
	}

	return (
		<div className="space-y-8">
			{/* Header section */}
			<div className="text-center py-8">
				<div className="inline-flex items-center gap-4 mb-4">
					<div className="w-16 h-16 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
						<span className="text-white text-2xl">📊</span>
					</div>
					<div className="text-left">
						<h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 dark:from-gray-100 dark:via-blue-100 dark:to-purple-100 bg-clip-text text-transparent">
							Ads Analytics
						</h1>
						<p className="text-lg text-gray-600 dark:text-gray-400 mt-1">
							Comprehensive advertising performance metrics and insights
						</p>
					</div>
				</div>
			</div>

			<Controls
				from={from}
				to={to}
				groupBy={groupBy}
				setFrom={setFrom}
				setTo={setTo}
				setGroupBy={setGroupBy}
				viewName={viewName}
				setViewName={setViewName}
				names={names}
				onSaveView={onSaveView}
				onLoadView={onLoadView}
				onOpenChart={() => setChartOpen(true)}
			/>

			<MetricsChips
				all={METRICS}
				selected={selectedMetrics}
				toggle={toggleMetric}
			/>

			<StatsTable
				data={data}
				columns={columns}
				selectedMetrics={selectedMetrics}
				isLoading={isLoading}
				error={error}
			/>

			<ChartModal
				open={chartOpen}
				onClose={() => setChartOpen(false)}
				data={data}
				metrics={selectedMetrics}
				metricMeta={METRICS}
			/>
		</div>
	);
}
