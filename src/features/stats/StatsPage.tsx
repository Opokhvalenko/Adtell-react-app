import { useState } from "react";
import { ChartModal } from "./components/ChartModal";
import { Controls } from "./components/Controls";
import { MetricsChips } from "./components/MetricsChips";
import { StatsTable } from "./components/StatsTable";
import { METRICS } from "./constants/metrics";
import { useColumns } from "./hooks/useColumns";
import { useDebouncedValue } from "./hooks/useDebouncedValue";
import { useStatsQuery } from "./hooks/useStatsQuery";
import type { MetricKey } from "./types";
import { useSavedViews } from "./useSavedViews";
import { rowsToCsv } from "./utils/csv";
import { addDays, utcToday } from "./utils/dates";

/** Today and the two days before it, in UTC days like the backend. */
const DEFAULT_RANGE_DAYS = 2;
/** "Group by" is free text: request once typing pauses, not on every key (rate limit). */
const GROUP_BY_DEBOUNCE_MS = 400;

const COPY_TEXT = {
	done: "CSV copied to the clipboard.",
	failed: "The clipboard is not available here.",
} as const;

export default function StatsPage() {
	const [to, setTo] = useState(utcToday);
	const [from, setFrom] = useState(() =>
		addDays(utcToday(), -DEFAULT_RANGE_DAYS),
	);
	const [copyNotice, setCopyNotice] = useState("");
	const [groupBy, setGroupBy] = useState("day,event,adapter");
	const [selectedMetrics, setSelectedMetrics] = useState<MetricKey[]>([
		"count",
		"wins",
		"cpmAvg",
	]);
	const [chartOpen, setChartOpen] = useState(false);

	const debouncedGroupBy = useDebouncedValue(groupBy, GROUP_BY_DEBOUNCE_MS);

	const { names, saveView, getView } = useSavedViews();
	const [viewName, setViewName] = useState("");

	const {
		data = [],
		isLoading,
		error,
	} = useStatsQuery({
		from,
		to,
		groupBy: debouncedGroupBy,
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

	const exportCSV = () => {
		const csv = rowsToCsv(data);
		const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `stats_${from}_${to}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	};
	const copyCSV = async () => {
		try {
			await navigator.clipboard.writeText(rowsToCsv(data));
			setCopyNotice(COPY_TEXT.done);
		} catch {
			setCopyNotice(COPY_TEXT.failed);
		}
	};

	return (
		<div className="space-y-6">
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
				onExportCSV={exportCSV}
				onCopyCSV={copyCSV}
			/>

			<output className="block text-sm text-zinc-600 dark:text-zinc-300">
				{copyNotice}
			</output>

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
