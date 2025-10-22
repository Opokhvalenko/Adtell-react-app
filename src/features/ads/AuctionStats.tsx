import { useCallback, useEffect, useState } from "react";

interface AuctionEvent {
	ts: number;
	type: string;
	payload: unknown;
}
interface BidInfo {
	adapter: string;
	cpm: number;
	currency: string;
	adUnitCode: string;
	winner: boolean;
}

function toStr(x: unknown, fallback = "unknown") {
	return typeof x === "string" && x ? x : fallback;
}
function toNum(x: unknown, fallback = 0) {
	const n = Number(x);
	return Number.isFinite(n) ? n : fallback;
}

export default function AuctionStats() {
	const [events, setEvents] = useState<AuctionEvent[]>([]);
	const [bids, setBids] = useState<BidInfo[]>([]);
	const [isExpanded, setIsExpanded] = useState(false);

	const applyEvent = useCallback((detail: AuctionEvent) => {
		setEvents((prev) => [detail, ...prev].slice(0, 100));

		if (detail.type === "bidResponse" || detail.type === "hb:bidResponse") {
			const pl = detail.payload as Record<string, unknown>;
			const adUnit = toStr(pl?.adUnitCode);
			const adapter = toStr(pl?.adapter ?? pl?.bidder);
			const cpm = toNum(pl?.cpm);
			const currency =
				typeof pl?.currency === "string" ? (pl.currency as string) : "USD";
			if (!adapter) return;

			setBids((prev) => {
				const next = [...prev];
				const i = next.findIndex(
					(b) => b.adUnitCode === adUnit && b.adapter === adapter,
				);
				if (i === -1) {
					next.push({
						adapter,
						cpm,
						currency,
						adUnitCode: adUnit,
						winner: false,
					});
				} else {
					next[i] = { ...next[i], cpm, currency };
				}
				return next;
			});
		}

		if (detail.type === "bidWon" || detail.type === "hb:bidWon") {
			const pl = detail.payload as Record<string, unknown>;
			const adUnit = toStr(pl?.adUnitCode);
			const adapter = toStr(pl?.adapter ?? pl?.bidder, "");
			if (!adapter) return;

			const cpm = toNum(pl?.cpm);
			const currency =
				typeof pl?.currency === "string" ? (pl.currency as string) : "USD";

			setBids((prev) => {
				const next = [...prev];
				const i = next.findIndex(
					(b) => b.adUnitCode === adUnit && b.adapter === adapter,
				);
				if (i === -1) {
					next.push({
						adapter,
						cpm,
						currency,
						adUnitCode: adUnit,
						winner: true,
					});
				} else {
					next[i] = {
						...next[i],
						cpm: cpm || next[i].cpm,
						currency,
						winner: true,
					};
				}
				return next;
			});
		}
	}, []);

	useEffect(() => {
		const log = ((window as Window).__adslog ?? []) as AdsEvt[];

		const getEvtType = (v: AdsEvt): string | undefined => {
			const t = (v.type ?? v.event) as unknown;
			return typeof t === "string" ? t : undefined;
		};

		const interesting: AdsEvt[] = log.filter((e): e is AdsEvt => {
			const t = getEvtType(e);
			return (
				!!t &&
				(t === "bidResponse" ||
					t === "hb:bidResponse" ||
					t === "bidWon" ||
					t === "hb:bidWon")
			);
		});

		for (const e of interesting) {
			const t = getEvtType(e);
			if (!t) continue;
			applyEvent({
				ts: typeof e.ts === "number" ? e.ts : Date.now(),
				type: t,
				payload: e.payload ?? e,
			});
		}

		type PB =
			| {
					getAllWinningBids?: () => unknown[];
					getBidResponsesForAdUnitCode?: (code: string) => { bids?: unknown[] };
			  }
			| undefined;

		type WinLike = {
			adUnitCode?: unknown;
			adUnit?: { code?: unknown };
			adapter?: unknown;
			bidder?: unknown;
			bidderCode?: unknown;
			cpm?: unknown;
			currency?: unknown;
			cur?: unknown;
		};

		const pb = window.pbjs as PB;
		if (pb?.getAllWinningBids) {
			try {
				const wins = pb.getAllWinningBids() || [];
				for (const w of wins as WinLike[]) {
					const adUnitCode =
						(typeof w.adUnitCode === "string" && w.adUnitCode) ||
						(typeof w.adUnit?.code === "string" ? w.adUnit.code : undefined);

					const adapter =
						(typeof w.adapter === "string" && w.adapter) ||
						(typeof w.bidder === "string" && w.bidder) ||
						(typeof w.bidderCode === "string" ? w.bidderCode : undefined);

					const bidder =
						(typeof w.bidder === "string" && w.bidder) ||
						(typeof w.bidderCode === "string" ? w.bidderCode : undefined);

					const cpm = toNum(w.cpm, 0);
					const currency =
						(typeof w.currency === "string" && w.currency) ||
						(typeof w.cur === "string" ? w.cur : "USD");

					applyEvent({
						ts: Date.now(),
						type: "hb:bidWon",
						payload: { adUnitCode, adapter, bidder, cpm, currency },
					});
				}
			} catch {
				// ignore
			}
		}

		const handlePrebidEvent = (event: CustomEvent<AuctionEvent>) => {
			applyEvent(event.detail);
		};
		window.addEventListener("ads:prebid", handlePrebidEvent as EventListener);
		return () => {
			window.removeEventListener(
				"ads:prebid",
				handlePrebidEvent as EventListener,
			);
		};
	}, [applyEvent]);

	const totalBids = bids.length;
	const winningBids = bids.filter((b) => b.winner).length;
	const totalRevenue = bids
		.filter((b) => b.winner)
		.reduce((sum, b) => sum + b.cpm, 0);

	return (
		<div className="rounded-2xl border border-zinc-200 bg-white/80 p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/60">
			<div className="flex items-center justify-between mb-4">
				<h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
					Auction Statistics
				</h3>
				<button
					type="button"
					onClick={() => setIsExpanded((v) => !v)}
					className="h-9 px-3 rounded-xl border border-zinc-300 bg-white text-sm hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:hover:bg-zinc-700"
				>
					{isExpanded ? "Hide Details" : "Show Details"}
				</button>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
				<div className="rounded-xl border border-zinc-200 bg-white/70 p-3 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
					<div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
						{totalBids}
					</div>
					<div className="text-xs text-zinc-600 dark:text-zinc-300">
						Total Bids
					</div>
				</div>
				<div className="rounded-xl border border-zinc-200 bg-white/70 p-3 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
					<div className="text-2xl font-bold text-emerald-600 dark:text-emerald-300">
						{winningBids}
					</div>
					<div className="text-xs text-zinc-600 dark:text-zinc-300">
						Winning Bids
					</div>
				</div>
				<div className="rounded-xl border border-zinc-200 bg-white/70 p-3 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
					<div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
						${totalRevenue.toFixed(2)}
					</div>
					<div className="text-xs text-zinc-600 dark:text-zinc-300">
						Total Revenue
					</div>
				</div>
			</div>

			{bids.length > 0 && (
				<div className="mb-4">
					<h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
						Recent Bids
					</h4>
					<div className="space-y-2 max-h-32 overflow-y-auto">
						{bids.slice(0, 10).map((bid) => (
							<div
								key={`${bid.adUnitCode}-${bid.adapter}`}
								className={[
									"flex items-center justify-between p-2 rounded text-xs border",
									bid.winner
										? "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800"
										: "bg-white border-zinc-200 dark:bg-zinc-800 dark:border-zinc-600",
								].join(" ")}
							>
								<div className="flex items-center gap-2">
									<span className="px-2 py-1 rounded bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-100">
										{bid.adapter}
									</span>
									<span className="text-zinc-600 dark:text-zinc-300">
										{bid.adUnitCode}
									</span>
								</div>
								<div className="flex items-center gap-2">
									<span className="font-medium">
										${bid.cpm.toFixed(2)} {bid.currency}
									</span>
									{bid.winner && <span className="text-emerald-600">🏆</span>}
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{isExpanded && (
				<div>
					<h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
						Event Log
					</h4>
					<div className="max-h-64 overflow-y-auto space-y-1">
						{events.slice(0, 20).map((event) => (
							<div
								key={`${event.ts}-${event.type}`}
								className="text-xs p-2 rounded border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
							>
								<div className="flex items-center justify-between mb-1">
									<span className="font-mono text-zinc-500">
										{new Date(event.ts).toLocaleTimeString()}
									</span>
									<span className="font-semibold text-emerald-600 dark:text-emerald-300">
										{event.type}
									</span>
								</div>
								<pre className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
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
