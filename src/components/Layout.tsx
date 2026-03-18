import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import AdSlot from "./ads/AdSlot";
import Footer from "./Footer";
import Header from "./Header";

function AdCard({
	icon,
	label,
	children,
}: {
	icon: string;
	label: string;
	children: ReactNode;
}) {
	return (
		<div className="border border-white/20 dark:border-gray-600/40 rounded-3xl shadow-2xl backdrop-blur-sm bg-white/95 dark:bg-gray-700/95 p-3 overflow-hidden">
			<h3 className="text-xs font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-1">
				<span>{icon}</span> {label}
			</h3>
			<div className="overflow-hidden rounded-2xl">{children}</div>
		</div>
	);
}

function useIsXl() {
	const [xl, setXl] = useState(() =>
		typeof window !== "undefined" ? window.innerWidth >= 1400 : false,
	);
	useEffect(() => {
		const mq = window.matchMedia("(min-width: 1400px)");
		const handler = (e: MediaQueryListEvent) => setXl(e.matches);
		mq.addEventListener("change", handler);
		setXl(mq.matches);
		return () => mq.removeEventListener("change", handler);
	}, []);
	return xl;
}

export default function Layout() {
	const { pathname } = useLocation();
	const onAuthPage = pathname === "/login" || pathname === "/register";
	const isXl = useIsXl();

	if (onAuthPage) {
		return (
			<div className="min-h-screen flex flex-col gradient-bg transition-colors">
				<main className="flex-1 flex items-center justify-center p-6">
					<div className="w-full max-w-md border border-white/20 dark:border-gray-600/40 rounded-3xl shadow-2xl transition-all duration-300 backdrop-blur-sm bg-white/95 dark:bg-gray-700/95 p-8">
						<Outlet />
					</div>
				</main>
				<Footer />
			</div>
		);
	}

	return (
		<div className="min-h-screen flex flex-col gradient-bg transition-colors overflow-x-hidden">
			<header className="w-full">
				<Header />
			</header>

			<div className="py-2">
				<div className="h-2 bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
				<div className="h-1 bg-gradient-to-r from-transparent via-teal-500/30 to-transparent" />
				<div className="h-1 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
			</div>

			<section className="w-full py-4">
				<div className="flex justify-center px-4">
					<div className="border border-white/20 dark:border-gray-600/40 rounded-3xl shadow-2xl transition-all duration-300 backdrop-blur-sm bg-white/95 dark:bg-gray-700/95 p-3 inline-block">
						<h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
							<span className="text-base">🎯</span>
							Top Banner — Adtelligent
						</h3>
						{/* biome-ignore lint/correctness/useUniqueElementIds: Prebid requires specific IDs */}
						<AdSlot
							id="ad-top-adtelligent"
							sizes={["970x90", "728x90", "468x60", "320x50"]}
							type="banner"
							className="inline-block"
						/>
					</div>
				</div>
			</section>

			<div className="flex-1 w-full">
				<div
					className="mx-auto px-6 py-8"
					style={{ maxWidth: isXl ? 1700 : 1024 }}
				>
					<div
						style={{
							display: "grid",
							gridTemplateColumns: isXl ? "320px 1fr 320px" : "1fr",
							gap: "1.5rem",
							alignItems: "start",
						}}
					>
						{/* Left sidebar — visible only on wide screens */}
						{isXl && (
							<aside className="sticky top-24">
								<AdCard icon="🎯" label="Adtelligent">
									{/* biome-ignore lint/correctness/useUniqueElementIds: Prebid requires specific IDs */}
									<AdSlot
										id="ad-left-adtelligent"
										sizes={["300x250"]}
										type="inline"
									/>
								</AdCard>
							</aside>
						)}

						{/* Main content */}
						<main style={{ minWidth: 0 }}>
							<div className="border border-white/20 dark:border-gray-700/30 rounded-3xl shadow-2xl transition-all duration-300 backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 p-6">
								<Outlet />
							</div>
						</main>

						{/* Right sidebar — visible only on wide screens */}
						{isXl && (
							<aside className="flex flex-col gap-4 sticky top-24">
								<AdCard icon="📊" label="Bidmatic">
									{/* biome-ignore lint/correctness/useUniqueElementIds: Prebid requires specific IDs */}
									<AdSlot
										id="ad-right-bidmatic"
										sizes={["300x250"]}
										type="inline"
									/>
								</AdCard>
								<AdCard icon="✨" label="Beautiful">
									{/* biome-ignore lint/correctness/useUniqueElementIds: Prebid requires specific IDs */}
									<AdSlot
										id="ad-right-beautiful"
										sizes={["300x250"]}
										type="inline"
									/>
								</AdCard>
							</aside>
						)}
					</div>
				</div>
			</div>

			{/* Ads row — on narrow screens, sidebars move here as horizontal row */}
			{!isXl && (
				<div className="px-4 pb-4">
					<div className="mx-auto max-w-screen-lg flex flex-wrap justify-center gap-4">
						<AdCard icon="🎯" label="Adtelligent">
							{/* biome-ignore lint/correctness/useUniqueElementIds: Prebid requires specific IDs */}
							<AdSlot
								id="ad-mobile-adtelligent"
								sizes={["300x250"]}
								type="inline"
							/>
						</AdCard>
						<AdCard icon="📊" label="Bidmatic">
							{/* biome-ignore lint/correctness/useUniqueElementIds: Prebid requires specific IDs */}
							<AdSlot
								id="ad-mobile-bidmatic"
								sizes={["300x250"]}
								type="inline"
							/>
						</AdCard>
						<AdCard icon="✨" label="Beautiful">
							{/* biome-ignore lint/correctness/useUniqueElementIds: Prebid requires specific IDs */}
							<AdSlot
								id="ad-mobile-beautiful"
								sizes={["300x250"]}
								type="inline"
							/>
						</AdCard>
					</div>
				</div>
			)}

			<div className="py-2">
				<div className="h-2 bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />
				<div className="h-1 bg-gradient-to-r from-transparent via-pink-500/30 to-transparent" />
				<div className="h-1 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
			</div>

			<footer className="w-full">
				<Footer />
			</footer>
		</div>
	);
}
