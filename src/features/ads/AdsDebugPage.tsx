import React from "react";

type Src = "prebid" | "gpt";
const PREBID: Src = "prebid";
const GPT: Src = "gpt";

type AdsEvt = {
	ts: number;
	type: string;
	payload: unknown;
	src?: Src;
};

type RawEvt = {
	ts?: number;
	type?: string;
	event?: string;
	payload?: unknown;
	src?: Src;
};

function hasId(p: unknown): p is { id?: string | number } {
	return typeof p === "object" && p !== null && "id" in p;
}
function payloadId(p: unknown): string {
	return hasId(p) && p.id != null ? String(p.id) : "";
}
const fmtTime = (n: number) =>
	new Date(n).toLocaleTimeString(undefined, { hour12: false });
const inferSrc = (t: string): Src =>
	t.startsWith("gpt") || t.includes("slot") ? "gpt" : "prebid";

function toEvt(e: RawEvt): AdsEvt {
	const type =
		(typeof e.type === "string" && e.type) ||
		(typeof e.event === "string" && e.event) ||
		"unknown";
	const payload = "payload" in e ? e.payload : e;
	return {
		ts: typeof e.ts === "number" ? e.ts : Date.now(),
		type,
		payload,
		src: e.src ?? inferSrc(type),
	};
}

export default function AdsDebugPage() {
	const initial: AdsEvt[] = React.useMemo(() => {
		const raw = window.__adslog ?? [];
		return raw.map((e) => toEvt(e as RawEvt));
	}, []);

	const [events, setEvents] = React.useState<AdsEvt[]>(initial);
	const [live, setLive] = React.useState(true);
	const [limit, setLimit] = React.useState(500);
	const [query, setQuery] = React.useState("");
	const [srcOn, setSrcOn] = React.useState<{ prebid: boolean; gpt: boolean }>({
		prebid: true,
		gpt: true,
	});
	const [busy, setBusy] = React.useState<"req" | "refresh" | null>(null);
	const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});
	const [copied, setCopied] = React.useState(false);

	React.useEffect(() => {
		if (!live) return;

		const onPrebid = (e: Event) => {
			const detail = (e as CustomEvent<RawEvt>).detail;
			const log = { ...toEvt(detail), src: PREBID };
			setEvents((prev) => [log, ...prev].slice(0, limit));
		};

		const onGpt = (e: Event) => {
			const detail = (e as CustomEvent<RawEvt>).detail;
			const log = { ...toEvt(detail), src: GPT };
			setEvents((prev) => [log, ...prev].slice(0, limit));
		};

		window.addEventListener("ads:prebid", onPrebid as EventListener);
		window.addEventListener("ads:gpt", onGpt as EventListener);
		return () => {
			window.removeEventListener("ads:prebid", onPrebid as EventListener);
			window.removeEventListener("ads:gpt", onGpt as EventListener);
		};
	}, [live, limit]);

	React.useEffect(() => {
		setEvents((prev) => prev.slice(0, limit));
	}, [limit]);

	const request = async () => {
		setBusy("req");
		try {
			const m = await import("virtual:ads-module");
			await m.requestAndDisplay?.();
		} finally {
			setBusy(null);
		}
	};
	const refresh = async () => {
		setBusy("refresh");
		try {
			const m = await import("virtual:ads-module");
			await m.refreshAds?.();
		} finally {
			setBusy(null);
		}
	};
	const clearAll = () => {
		setEvents([]);
		setExpanded({});
	};
	const copyAll = async () => {
		await navigator.clipboard.writeText(JSON.stringify(filtered, null, 2));
		setCopied(true);
		setTimeout(() => setCopied(false), 1200);
	};
	const exportJson = () => {
		const blob = new Blob([JSON.stringify(filtered, null, 2)], {
			type: "application/json",
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `ads-events-${Date.now()}.json`;
		a.click();
		URL.revokeObjectURL(url);
	};

	const filtered = React.useMemo(() => {
		return events.filter((e) => {
			const src = e.src ?? inferSrc(e.type);
			if (!srcOn[src]) return false;
			if (query && !e.type.toLowerCase().includes(query.toLowerCase()))
				return false;
			return true;
		});
	}, [events, srcOn, query]);

	const counts = React.useMemo(() => {
		let prebid = 0;
		let gpt = 0;
		for (const e of filtered)
			(e.src ?? inferSrc(e.type)) === "gpt" ? gpt++ : prebid++;
		return { total: filtered.length, prebid, gpt };
	}, [filtered]);

	return (
		<div className="max-w-6xl mx-auto space-y-5">
			<header className="flex items-center justify-between gap-3">
				<h1 className="text-2xl font-semibold">Ad events (Prebid &amp; GPT)</h1>
				<div className="flex items-center gap-2 text-xs">
					<span className="rounded-full px-2 py-1 bg-emerald-600 text-white">
						{counts.total} total
					</span>
					<span className="rounded-full px-2 py-1 bg-zinc-200 dark:bg-zinc-800">
						prebid: {counts.prebid}
					</span>
					<span className="rounded-full px-2 py-1 bg-zinc-200 dark:bg-zinc-800">
						gpt: {counts.gpt}
					</span>
				</div>
			</header>

			<div className="rounded-2xl border border-zinc-200 bg-white/80 p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/60">
				<div className="flex flex-wrap items-center gap-3">
					<button
						type="button"
						className="h-10 px-4 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
						onClick={request}
						disabled={busy !== null}
					>
						{busy === "req" ? "Requesting…" : "Request & display"}
					</button>
					<button
						type="button"
						className="h-10 px-4 rounded-xl border border-zinc-300 bg-white hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:hover:bg-zinc-700 disabled:opacity-60"
						onClick={refresh}
						disabled={busy !== null}
					>
						{busy === "refresh" ? "Refreshing…" : "Refresh bids"}
					</button>

					<div className="mx-2 hidden sm:block h-6 w-px bg-zinc-200 dark:bg-zinc-700" />

					<button
						type="button"
						aria-pressed={live}
						onClick={() => setLive((v) => !v)}
						className={[
							"h-10 px-4 rounded-xl border",
							live
								? "bg-emerald-600 text-white border-emerald-600"
								: "border-zinc-300 bg-white hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:hover:bg-zinc-700",
						].join(" ")}
						title="Pause/Resume live events"
					>
						{live ? "Live: on" : "Live: paused"}
					</button>

					<button
						type="button"
						onClick={clearAll}
						className="h-10 px-4 rounded-xl border border-zinc-300 bg-white hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:hover:bg-zinc-700"
					>
						Clear
					</button>
					<button
						type="button"
						onClick={copyAll}
						className="h-10 px-4 rounded-xl border border-zinc-300 bg-white hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:hover:bg-zinc-700"
						title="Copy filtered JSON"
					>
						{copied ? "Copied ✓" : "Copy JSON"}
					</button>
					<button
						type="button"
						onClick={exportJson}
						className="h-10 px-4 rounded-xl border border-zinc-300 bg-white hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:hover:bg-zinc-700"
					>
						Export
					</button>

					<div className="ml-auto flex flex-wrap items-center gap-3">
						<div className="flex items-center gap-2">
							<label className="inline-flex items-center gap-2 text-sm">
								<input
									type="checkbox"
									checked={srcOn.prebid}
									onChange={(e) =>
										setSrcOn((s) => ({ ...s, prebid: e.target.checked }))
									}
									className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-600 dark:bg-zinc-800 dark:border-zinc-600"
								/>
								<span>Prebid</span>
							</label>
							<label className="inline-flex items-center gap-2 text-sm">
								<input
									type="checkbox"
									checked={srcOn.gpt}
									onChange={(e) =>
										setSrcOn((s) => ({ ...s, gpt: e.target.checked }))
									}
									className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-600 dark:bg-zinc-800 dark:border-zinc-600"
								/>
								<span>GPT</span>
							</label>
						</div>

						<input
							placeholder="Filter by type…"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							className="h-10 w-56 rounded-xl border border-zinc-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 dark:border-zinc-600 dark:bg-zinc-800"
						/>

						<label className="flex items-center gap-2 text-sm">
							<span>Limit</span>
							<select
								value={limit}
								onChange={(e) => setLimit(Number(e.target.value))}
								className="h-10 rounded-xl border border-zinc-300 bg-white px-2 focus:outline-none focus:ring-2 focus:ring-emerald-600 dark:border-zinc-600 dark:bg-zinc-800"
							>
								{[100, 250, 500, 1000].map((n) => (
									<option key={n} value={n}>
										{n}
									</option>
								))}
							</select>
						</label>
					</div>
				</div>
			</div>

			<ul className="rounded-2xl border border-zinc-200 bg-white/70 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/40 divide-y divide-zinc-200 dark:divide-zinc-700">
				{filtered.length === 0 && (
					<li className="p-4 text-sm text-zinc-600 dark:text-zinc-300">
						Подій поки нема. У режимі GAM-only дивись події{" "}
						<code className="px-1 rounded bg-zinc-200/60 dark:bg-zinc-700">
							gpt:slotRenderEnded
						</code>
						.
					</li>
				)}

				{filtered.map((e, i) => {
					const key = `${e.ts}-${e.type}-${payloadId(e.payload)}-${i}`;
					const isOpen = !!expanded[key];
					const src = e.src ?? inferSrc(e.type);
					return (
						<li key={key} className="p-3">
							<div className="flex items-center justify-between gap-3">
								<div className="flex items-center gap-2">
									<span className="font-mono text-xs text-zinc-500">
										{fmtTime(e.ts)}
									</span>
									<span
										className={[
											"inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
											src === "gpt"
												? "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300"
												: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
										].join(" ")}
									>
										{src}
									</span>
									<span className="text-sm font-semibold">{e.type}</span>
								</div>

								<div className="flex items-center gap-2">
									<button
										type="button"
										className="h-8 px-3 rounded-lg border border-zinc-300 bg-white hover:bg-zinc-50 text-xs dark:border-zinc-600 dark:bg-zinc-800 dark:hover:bg-zinc-700"
										onClick={async () => {
											await navigator.clipboard.writeText(
												JSON.stringify(e.payload, null, 2),
											);
										}}
										title="Copy payload"
									>
										Copy
									</button>
									<button
										type="button"
										className="h-8 px-3 rounded-lg border border-zinc-300 bg-white hover:bg-zinc-50 text-xs dark:border-zinc-600 dark:bg-zinc-800 dark:hover:bg-zinc-700"
										onClick={() =>
											setExpanded((s) => ({ ...s, [key]: !s[key] }))
										}
										aria-expanded={isOpen}
										aria-controls={`payload-${i}`}
									>
										{isOpen ? "Hide" : "Show"}
									</button>
								</div>
							</div>

							<pre
								id={`payload-${i}`}
								className={[
									"mt-2 max-h-64 overflow-auto rounded-lg border text-xs",
									"border-zinc-200 bg-white/60 dark:border-zinc-700 dark:bg-zinc-900/50",
									isOpen ? "p-3" : "p-0 h-0 overflow-hidden border-0",
								].join(" ")}
							>
								{isOpen ? JSON.stringify(e.payload, null, 2) : null}
							</pre>
						</li>
					);
				})}
			</ul>
		</div>
	);
}
