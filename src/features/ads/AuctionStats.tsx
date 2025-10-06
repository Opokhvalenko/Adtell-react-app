import { useEffect, useState } from "react";

interface AuctionEvent {
	ts: number;
	type: string;
	// payload може відрізнятися залежно від події
	payload: unknown;
}

interface BidInfo {
	adapter: string;
	cpm: number;
	currency: string;
	adUnitCode: string;
	winner: boolean;
}

export default function AuctionStats() {
	const [events, setEvents] = useState<AuctionEvent[]>([]);
	const [bids, setBids] = useState<BidInfo[]>([]);
	const [isExpanded, setIsExpanded] = useState(false);

	useEffect(() => {
		const handlePrebidEvent = (event: CustomEvent<AuctionEvent>) => {
			const detail = event.detail;
			setEvents((prev) => [detail, ...prev].slice(0, 100));

			// bidResponse / hb:bidResponse
			if (detail.type === "bidResponse" || detail.type === "hb:bidResponse") {
				const pl = detail.payload as Record<string, unknown>;
				const adUnit = String(pl?.adUnitCode ?? "unknown");
				const adapter = String(
					(pl?.adapter as string | undefined) ??
						(pl?.bidder as string | undefined) ??
						"unknown",
				);
				const cpmNum = Number(pl?.cpm);
				if (!Number.isFinite(cpmNum)) return;
				const currency =
					typeof pl?.currency === "string" ? (pl.currency as string) : "USD";

				setBids((prev) => {
					const idx = prev.findIndex(
						(b) => b.adUnitCode === adUnit && b.adapter === adapter,
					);
					if (idx !== -1) {
						return prev.map((b) =>
							b.adUnitCode === adUnit && b.adapter === adapter
								? { ...b, cpm: cpmNum, currency }
								: b,
						);
					}
					return [
						...prev,
						{
							adapter,
							cpm: cpmNum,
							currency,
							adUnitCode: adUnit,
							winner: false,
						},
					];
				});
			}

			// bidWon / hb:bidWon
			if (detail.type === "bidWon" || detail.type === "hb:bidWon") {
				const pl = detail.payload as Record<string, unknown>;
				const adUnit = String(pl?.adUnitCode ?? "unknown");
				const adapter = String(
					(pl?.adapter as string | undefined) ??
						(pl?.bidder as string | undefined) ??
						"",
				);
				if (!adapter) return;
				setBids((prev) =>
					prev.map((b) =>
						b.adUnitCode === adUnit && b.adapter === adapter
							? { ...b, winner: true }
							: b,
					),
				);
			}
		};

		window.addEventListener("ads:prebid", handlePrebidEvent as EventListener);
		return () => {
			window.removeEventListener(
				"ads:prebid",
				handlePrebidEvent as EventListener,
			);
		};
	}, []);

	const totalBids = bids.length;
	const winningBids = bids.filter((b) => b.winner).length;
	const totalRevenue = bids
		.filter((b) => b.winner)
		.reduce((sum, b) => sum + b.cpm, 0);

	return (
		<div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 p-4">
			<div className="flex items-center justify-between mb-4">
				<h3 className="text-lg font-semibold text-gray-900 dark:text-white">
					Auction Statistics
				</h3>
				<button
					type="button"
					onClick={() => setIsExpanded((v) => !v)}
					className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
				>
					{isExpanded ? "Hide Details" : "Show Details"}
				</button>
			</div>

			<div className="grid grid-cols-3 gap-4 mb-4">
				<div className="text-center">
					<div className="text-2xl font-bold text-blue-600 dark:text-blue-300">
						{totalBids}
					</div>
					<div className="text-sm text-gray-600 dark:text-gray-200">
						Total Bids
					</div>
				</div>
				<div className="text-center">
					<div className="text-2xl font-bold text-green-600 dark:text-green-300">
						{winningBids}
					</div>
					<div className="text-sm text-gray-600 dark:text-gray-200">
						Winning Bids
					</div>
				</div>
				<div className="text-center">
					<div className="text-2xl font-bold text-purple-600 dark:text-purple-300">
						${totalRevenue.toFixed(2)}
					</div>
					<div className="text-sm text-gray-600 dark:text-gray-200">
						Total Revenue
					</div>
				</div>
			</div>

			{bids.length > 0 && (
				<div className="mb-4">
					<h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
						Recent Bids
					</h4>
					<div className="space-y-2 max-h-32 overflow-y-auto">
						{bids.slice(0, 10).map((bid) => (
							<div
								key={`${bid.adUnitCode}-${bid.adapter}`}
								className={`flex items-center justify-between p-2 rounded text-xs ${
									bid.winner
										? "bg-green-50 dark:bg-green-900/30"
										: "bg-gray-50 dark:bg-gray-700"
								}`}
							>
								<div className="flex items-center space-x-2">
									<span className="px-2 py-1 rounded bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100">
										{bid.adapter}
									</span>
									<span className="text-gray-600 dark:text-gray-200">
										{bid.adUnitCode}
									</span>
								</div>
								<div className="flex items-center space-x-2">
									<span className="font-medium">
										${bid.cpm.toFixed(2)} {bid.currency}
									</span>
									{bid.winner && <span className="text-green-600">🏆</span>}
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{isExpanded && (
				<div>
					<h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
						Event Log
					</h4>
					<div className="max-h-64 overflow-y-auto space-y-1">
						{events.slice(0, 20).map((event) => (
							<div
								key={`${event.ts}-${event.type}`}
								className="text-xs p-2 bg-gray-50 dark:bg-gray-800 rounded"
							>
								<div className="flex items-center justify-between mb-1">
									<span className="font-mono text-gray-500 dark:text-gray-400">
										{new Date(event.ts).toLocaleTimeString()}
									</span>
									<span className="font-medium text-blue-600 dark:text-blue-400">
										{event.type}
									</span>
								</div>
								<pre className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
									{JSON.stringify(event.payload, null, 2)}
								</pre>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
