import { requestAndDisplay } from "virtual:ads-module";
import { useEffect, useId, useMemo, useRef } from "react";
import { ensureAdsModule, getAdsModule } from "@/lib/ads/window";
import { resolveAdserverEndpoint } from "@/lib/adserver";
import { cn } from "@/lib/cn";
import type { AdClient } from "@/types/adserver-client";

declare global {
	interface Window {
		pbjs?: { que?: Array<() => void> };
	}
}

type AdsSize = `${number}x${number}`;
type Placement = "inline" | "banner" | "sidebar-right";

type Props = {
	id?: string;
	className?: string;
	sizes?: AdsSize[];
	type?: "banner" | "sidebar" | "inline";
	geo?: string;
	floorCpm?: number;
	endpoint?: string;
	fallbackMs?: number;
	placement?: Placement;
	disableBadge?: boolean;
};

function parseSize(s: AdsSize) {
	const [w, h] = s.split("x").map((n) => parseInt(n, 10));
	return { w: Number.isFinite(w) ? w : 300, h: Number.isFinite(h) ? h : 250 };
}

function renderFallbackAd(element: HTMLElement, id: string) {
	const W = element.offsetWidth;
	const H = element.offsetHeight;
	const tpl = (title: string, sub: string, grad: string) => `
    <div class="rounded-xl p-6 text-white shadow-2xl backdrop-blur-sm border border-white/20" style="background:${grad}">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="font-bold text-xl mb-2">${title}</h3>
          <p class="text-sm opacity-90 mb-1">${sub}</p>
          <p class="text-xs opacity-75">ID: ${id}</p>
        </div>
        <div class="text-xs opacity-75 bg-white/20 px-2 py-1 rounded-full">${W}x${H}</div>
      </div>
    </div>`;
	let html = tpl(
		"Ad Space",
		"Premium Placement",
		"linear-gradient(135deg,#4b5563,#374151)",
	);
	if (id.includes("adtelligent")) {
		html = tpl(
			"Adtelligent Smart",
			"AI-Powered Ads",
			"linear-gradient(135deg,#059669,#047857)",
		);
	} else if (id.includes("bidmatic")) {
		html = tpl(
			"Bidmatic Pro",
			"Smart Bidding",
			"linear-gradient(135deg,#2563eb,#1d4ed8)",
		);
	} else if (id.includes("beautiful")) {
		html = tpl(
			"✨ Beautiful Ad",
			"Premium Experience",
			"linear-gradient(135deg,#be185d,#9d174d)",
		);
	}
	element.innerHTML = html;
}

function safeUnmount(domId: string) {
	try {
		getAdsModule()?.unmount?.(domId);
	} catch {
		// ignore
	}
	document.getElementById(domId)?.replaceChildren();
}

async function waitForPbjs(timeout = 5000) {
	const start = Date.now();
	while (!window.pbjs?.que) {
		if (Date.now() - start > timeout) break;
		await new Promise((r) => setTimeout(r, 30));
	}
}

export default function AdSlot({
	id,
	className,
	sizes = ["300x250"],
	type = "inline",
	geo,
	floorCpm,
	endpoint,
	fallbackMs = 1800,
	placement = "inline",
	disableBadge = false,
}: Props) {
	const uid = useId();
	const domId = id || `adslot-${uid}`;
	const hostRef = useRef<HTMLDivElement>(null);

	const first = useMemo(() => parseSize(sizes[0] ?? "300x250"), [sizes]);

	const placementCls = useMemo(() => {
		switch (placement) {
			case "sidebar-right":
				return "hidden xl:flex xl:sticky xl:top-24 xl:self-start xl:justify-start xl:ml-4";
			case "banner":
				return "w-full justify-center";
			default:
				return "";
		}
	}, [placement]);

	useEffect(() => {
		if (!hostRef.current || sizes.length === 0) return;

		const el = hostRef.current;
		let visible = false;
		let fallbackTimer: number | undefined;

		const mountWhenVisible = async () => {
			if (visible) return;
			visible = true;

			try {
				const adsModule = ensureAdsModule();
				adsModule.registry ??= {};
				adsModule.registry[domId] = {
					sizes: sizes.map((s) => s.split("x").map(Number) as [number, number]),
					type,
				};

				await waitForPbjs();
				await requestAndDisplay();
			} catch (e) {
				console.error("[AdSlot] mount error:", e);
				renderFallbackAd(el, domId);
			}

			fallbackTimer = window.setTimeout(async () => {
				const hasIframe = !!el.querySelector("iframe");
				const hasHtml = !!el.innerHTML && el.innerHTML.trim().length > 0;
				if (!hasIframe && !hasHtml) {
					renderFallbackAd(el, domId);
					try {
						const runtimePath = new URL(
							"/modules/adserver.client.js",
							window.location.origin,
						).href;
						const mod = (await import(
							/* @vite-ignore */ runtimePath
						)) as unknown as AdClient;
						const best = sizes[0];
						const ep = resolveAdserverEndpoint(endpoint);
						const bid = await mod.requestBid({
							size: best as `${number}x${number}`,
							type,
							geo,
							uid: getAdsModule()?.uid ?? "",
							floor: floorCpm,
							endpoint: ep,
						});
						if (bid) mod.renderBidInto(el, bid, { endpoint: ep });
					} catch {
						// ignore
					}
				}
			}, fallbackMs) as unknown as number;
		};

		const io = new IntersectionObserver(
			(entries) => {
				for (const en of entries) {
					if (en.isIntersecting) {
						io.disconnect();
						void mountWhenVisible();
						break;
					}
				}
			},
			{ rootMargin: "0px 0px 200px 0px", threshold: 0.01 },
		);

		io.observe(el);

		return () => {
			io.disconnect();
			if (fallbackTimer) window.clearTimeout(fallbackTimer);
			safeUnmount(domId);
		};
	}, [domId, sizes, type, geo, floorCpm, endpoint, fallbackMs]);

	return (
		<section
			className={cn(
				"relative inline-flex items-center justify-center",
				placementCls,
				className,
			)}
			aria-label="advertisement"
		>
			<div
				id={domId}
				ref={hostRef}
				className={cn(
					"ad-slot rounded-xl border border-gray-200 dark:border-gray-600",
					"bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-700",
					"shadow-lg transition-all duration-300",
					"flex items-center justify-center text-center",
					"relative overflow-hidden",
				)}
				style={{ width: first.w, height: first.h, minHeight: first.h }}
			>
				{/* loader */}
				<div className="text-gray-400 dark:text-gray-500 text-sm flex flex-col items-center justify-center">
					<div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
					<div className="font-medium text-gray-600 dark:text-gray-300">
						Loading premium ad...
					</div>
					<div className="text-xs mt-2 text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
						{first.w}×{first.h}
					</div>
				</div>
			</div>

			{!disableBadge && (
				<div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-gray-400 dark:text-gray-500 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-2 py-1 rounded-full border border-gray-200 dark:border-gray-700">
					Advertisement
				</div>
			)}
		</section>
	);
}
