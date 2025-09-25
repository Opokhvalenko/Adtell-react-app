import React from "react";

type AdsEvt = {
	ts: number;
	type: string;
	payload: unknown;
};

function hasId(p: unknown): p is { id?: string | number } {
	return typeof p === "object" && p !== null && "id" in p;
}
function payloadId(p: unknown): string {
	return hasId(p) && p.id != null ? String(p.id) : "";
}

export default function AdsDebugPage() {
	const [events, setEvents] = React.useState<AdsEvt[]>(
		() => (window.__adslog ?? []) as AdsEvt[],
	);

	React.useEffect(() => {
		const onPrebid = (e: Event) => {
			const detail = (e as CustomEvent<AdsEvt>).detail;
			setEvents((prev) => [detail, ...prev].slice(0, 500));
		};
		const onGpt = (e: Event) => {
			const detail = (e as CustomEvent<AdsEvt>).detail;
			setEvents((prev) => [detail, ...prev].slice(0, 500));
		};

		window.addEventListener("ads:prebid", onPrebid as EventListener);
		window.addEventListener("ads:gpt", onGpt as EventListener);
		return () => {
			window.removeEventListener("ads:prebid", onPrebid as EventListener);
			window.removeEventListener("ads:gpt", onGpt as EventListener);
		};
	}, []);

	const ts = (n: number) => new Date(n).toLocaleTimeString();

	const request = () =>
		import("virtual:ads-module").then((m) => m.requestAndDisplay?.());
	const refresh = () =>
		import("virtual:ads-module").then((m) => m.refreshAds?.());

	return (
		<div className="max-w-5xl mx-auto space-y-4">
			<h1 className="text-2xl font-semibold">Ad events (Prebid & GPT)</h1>

			<div className="flex gap-2">
				<button
					type="button"
					className="px-3 py-1 rounded bg-black text-white dark:bg-white dark:text-black"
					onClick={request}
				>
					Request & display
				</button>
				<button
					type="button"
					className="px-3 py-1 rounded border"
					onClick={refresh}
				>
					Refresh bids
				</button>
			</div>

			{events.length === 0 && (
				<p className="text-xs opacity-60">
					Подій поки нема. У режимі GAM-only дивись події{" "}
					<code>gpt:slotRenderEnded</code> — ми теж додаємо їх у цей лог.
				</p>
			)}

			<ul className="rounded border border-black/10 dark:border-white/10 divide-y divide-black/10 dark:divide-white/10 bg-transparent">
				{events.map((e, i) => (
					<li
						key={`${e.ts}-${e.type}-${payloadId(e.payload)}-${i}`}
						className="p-3 text-sm"
					>
						<div className="font-mono text-xs opacity-70">{ts(e.ts)}</div>
						<div className="font-semibold">{e.type}</div>
						<pre className="mt-1 max-h-64 overflow-auto text-xs rounded bg-transparent dark:bg-transparent">
							{JSON.stringify(e.payload, null, 2)}
						</pre>
					</li>
				))}
			</ul>
		</div>
	);
}
