import { Outlet, useLocation } from "react-router-dom";
import AdSlot from "./ads/AdSlot";
import Footer from "./Footer";
import Header from "./Header";

export default function Layout() {
	const { pathname } = useLocation();
	const onAuthPage = pathname === "/login" || pathname === "/register";

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
		<div className="min-h-screen flex flex-col gradient-bg transition-colors">
			<header className="w-full">
				<Header />
			</header>

			<div className="py-2">
				<div className="h-2 bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
				<div className="h-1 bg-gradient-to-r from-transparent via-teal-500/30 to-transparent" />
				<div className="h-1 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
			</div>

			<section className="w-full py-4">
				<div className="container mx-auto max-w-screen-xl px-4">
					<div className="grid grid-cols-12">
						<div className="col-span-12 flex justify-center">
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
					</div>
				</div>
			</section>

			<main className="flex-1 w-full">
				<div className="container mx-auto max-w-screen-xxl px-4 py-8">
					<div
						className="grid grid-cols-1 lg:grid-cols-12 gap-4
					"
					>
						<section className="lg:col-span-8">
							<div className="border border-white/20 dark:border-gray-700/30 rounded-3xl shadow-2xl transition-all duration-300 backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 p-6">
								<Outlet />
							</div>
						</section>

						<aside className="lg:col-span-2 space-y-6">
							<div className="border border-white/20 dark:border-gray-600/40 rounded-3xl shadow-2xl transition-all duration-300 backdrop-blur-sm bg-white/95 dark:bg-gray-700/95 p-3 inline-block">
								<h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
									<span className="text-base">📊</span>
									Right — Bidmatic
								</h3>
								{/* biome-ignore lint/correctness/useUniqueElementIds: Prebid requires specific IDs */}
								<AdSlot
									id="ad-right-bidmatic"
									sizes={["300x250", "300x600"]}
									type="inline"
									className="inline-block"
								/>
							</div>

							<div className="border border-white/20 dark:border-gray-600/40 rounded-3xl shadow-2xl transition-all duration-300 backdrop-blur-sm bg-white/95 dark:bg-gray-700/95 p-3 inline-block">
								<h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
									<span className="text-base">✨</span>
									Right — Beautiful
								</h3>
								{/* biome-ignore lint/correctness/useUniqueElementIds: Prebid requires specific IDs */}
								<AdSlot
									id="ad-right-beautiful"
									sizes={["300x250"]}
									type="inline"
									className="inline-block"
								/>
							</div>
						</aside>
					</div>

					<div className="lg:hidden mt-8 flex justify-center">
						<div className="border border-white/20 dark:border-gray-700/30 rounded-3xl shadow-2xl transition-all duration-300 backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 p-3 inline-block">
							<h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
								<span className="text-base">📊</span>
								Mobile — Bidmatic
							</h3>
							{/* biome-ignore lint/correctness/useUniqueElementIds: Prebid requires specific IDs */}
							<AdSlot
								id="ad-mobile-bidmatic"
								sizes={["300x250"]}
								type="inline"
								className="inline-block"
							/>
						</div>
					</div>
				</div>
			</main>

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
