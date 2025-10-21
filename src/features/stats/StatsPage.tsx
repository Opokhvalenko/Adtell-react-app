import { useState } from "react";
import { ChartModal } from "./components/ChartModal";
import { Controls } from "./components/Controls";
import { MetricsChips } from "./components/MetricsChips";
import { StatsTable } from "./components/StatsTable";
import { METRICS } from "./constants/metrics";
import { useColumns } from "./hooks/useColumns";
import { useStatsQuery } from "./hooks/useStatsQuery";
import type { MetricKey, StatRow } from "./types";
import { useSavedViews } from "./useSavedViews";

function useTodayRange() {
	const now = new Date();
	const to = now.toISOString().slice(0, 10);
	const from = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2)
		.toISOString()
		.slice(0, 10);
	return { from, to };
}

function rowsToCsv(rows: Array<Record<string, unknown>>) {
	if (!rows.length) return "";
	const headers = Object.keys(rows[0]);
	const esc = (v: unknown) => {
		if (v == null) return "";
		const s = String(v);
		return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
	};
	const lines = [
		headers.join(","),
		...rows.map((r) => headers.map((h) => esc(r[h])).join(",")),
	];
	return lines.join("\n");
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

	const exportCSV = () => {
		const csv = rowsToCsv(data as unknown as Array<Record<string, unknown>>);
		const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		const stamp = new Date().toISOString().slice(0, 10);
		a.download = `stats_${stamp}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	};
	const copyCSV = async () => {
		const csv = rowsToCsv(data as unknown as Array<Record<string, unknown>>);
		try {
			await navigator.clipboard.writeText(csv);
			console.info("[stats] CSV copied to clipboard");
		} catch {
			alert("Clipboard is not available in this context.");
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

			<MetricsChips
				all={METRICS}
				selected={selectedMetrics}
				toggle={toggleMetric}
			/>

			<StatsTable
				data={data as StatRow[]}
				columns={columns}
				selectedMetrics={selectedMetrics}
				isLoading={isLoading}
				error={error}
			/>

			<ChartModal
				open={chartOpen}
				onClose={() => setChartOpen(false)}
				data={data as StatRow[]}
				metrics={selectedMetrics}
				metricMeta={METRICS}
			/>
		</div>
	);
}
