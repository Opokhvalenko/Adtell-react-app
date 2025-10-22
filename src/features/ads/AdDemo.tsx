import { useEffect, useId, useRef, useState } from "react";
import AuctionStats from "./AuctionStats";

function PrebidSlot({
	id,
	sizes,
	label,
}: {
	id: string;
	sizes: `${number}x${number}`[];
	label: string;
}) {
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		let alive = true;
		(async () => {
			await import("virtual:ads-bridge");
			if (!alive) return;
			if (ref.current) {
				window.__ads?.mount?.(id, sizes, "inline", ref.current);
			}
		})();

		return () => {
			alive = false;
			import("virtual:ads-module").then((m) => m.unmount?.(id)).catch(() => {});
		};
	}, [id, sizes]);

	return (
		<div className="rounded-2xl border border-zinc-200 bg-white/70 p-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/60">
			<div ref={ref} />
			<div className="mt-2 text-center text-xs text-zinc-500 dark:text-zinc-400">
				{label} — {sizes.join(", ")}
			</div>
		</div>
	);
}

export default function AdDemo() {
	const [ready, setReady] = useState(false);
	const topId = useId();
	const sideId = useId();

	useEffect(() => {
		(async () => {
			await import("virtual:ads-bridge");
			const ads = await import("virtual:ads-module");
			await ads.initAds?.();
			setReady(true);
		})();
	}, []);

	const start = () =>
		import("virtual:ads-module").then((m) => m.requestAndDisplay?.());

	const refresh = () =>
		import("virtual:ads-module").then((m) => m.refreshAds?.());

	return (
		<div className="max-w-6xl mx-auto p-6 space-y-8">
			{/* Header */}
			<header className="text-center py-6">
				<div className="inline-flex items-center gap-4">
					<div className="w-12 h-12 rounded-xl bg-emerald-600 text-white grid place-items-center shadow-sm">
						🎯
					</div>
					<div className="text-left">
						<h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
							Ad Demo
						</h1>
						<p className="text-sm text-zinc-600 dark:text-zinc-400">
							Interactive advertising auction demonstration
						</p>
					</div>
				</div>
			</header>

			{/* Actions */}
			<div className="flex items-center justify-center gap-3">
				<button
					type="button"
					disabled={!ready}
					onClick={start}
					className="h-10 px-4 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					🚀 {ready ? "Start auction" : "Initializing…"}
				</button>
				<button
					type="button"
					disabled={!ready}
					onClick={refresh}
					className="h-10 px-4 rounded-xl border border-zinc-300 bg-white hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-zinc-600 dark:bg-zinc-800 dark:hover:bg-zinc-700"
				>
					🔄 Refresh
				</button>
			</div>

			{/* Stats */}
			<AuctionStats />

			{/* Slots */}
			<section className="space-y-4">
				<h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 text-center">
					Advertisement Slots
				</h2>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div className="space-y-3">
						<h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
							📊 Top Banner (728×90)
						</h3>
						<PrebidSlot id={topId} sizes={["728x90"]} label="Top Banner" />
					</div>

					<div className="space-y-3">
						<h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
							📱 Side Banner (300×600, 300×250)
						</h3>
						<PrebidSlot
							id={sideId}
							sizes={["300x600", "300x250"]}
							label="Side Banner"
						/>
					</div>
				</div>
			</section>
		</div>
	);
}
