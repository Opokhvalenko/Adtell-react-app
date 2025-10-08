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
		<div>
			<div ref={ref} />
			<div className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">
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
			{/* Header section */}
			<div className="text-center py-8">
				<div className="inline-flex items-center gap-4 mb-4">
					<div className="w-16 h-16 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
						<span className="text-white text-2xl">🎯</span>
					</div>
					<div className="text-left">
						<h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 dark:from-gray-100 dark:via-blue-100 dark:to-purple-100 bg-clip-text text-transparent">
							Ad Demo
						</h1>
						<p className="text-lg text-gray-600 dark:text-gray-400 mt-1">
							Interactive advertising auction demonstration
						</p>
					</div>
				</div>

				{/* Action buttons */}
				<div className="flex items-center justify-center gap-4">
					<button
						type="button"
						disabled={!ready}
						onClick={start}
						className="px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium shadow-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
					>
						<span className="text-lg mr-2">🚀</span>
						{ready ? "Start auction" : "Initializing…"}
					</button>
					<button
						type="button"
						disabled={!ready}
						onClick={refresh}
						className="px-6 py-3 rounded-lg bg-gradient-to-r from-green-600 to-green-700 text-white font-medium shadow-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
					>
						<span className="text-lg mr-2">🔄</span>
						Refresh
					</button>
				</div>
			</div>

			{/* Stats section */}
			<AuctionStats />

			{/* Ad slots section */}
			<div className="space-y-6">
				<h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 text-center">
					Advertisement Slots
				</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div className="space-y-4">
						<h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
							<span className="text-xl">📊</span>
							Top Banner (728x90)
						</h3>
						<PrebidSlot id={topId} sizes={["728x90"]} label="Top Banner" />
					</div>
					<div className="space-y-4">
						<h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
							<span className="text-xl">📱</span>
							Side Banner (300x600, 300x250)
						</h3>
						<PrebidSlot
							id={sideId}
							sizes={["300x600", "300x250"]}
							label="Side Banner"
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
