import { buildTime } from "virtual:build-info";
import { Link } from "react-router-dom";

export default function Footer() {
	let iso: string | undefined = buildTime;
	if (!iso && typeof __BUILD_TIME__ !== "undefined") {
		iso = __BUILD_TIME__ as string;
	}
	if (!iso) {
		iso = new Date().toISOString();
	}

	const builtAt = new Date(iso).toLocaleString();

	return (
		<footer className="relative overflow-hidden bg-gradient-to-br from-slate-100 via-emerald-50 to-cyan-50 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 shadow-2xl w-full">
			{/* Enhanced decorative background */}
			<div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent dark:from-white/5"></div>

			{/* Beautiful gradient separator at top */}
			<div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent"></div>
			<div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-teal-500/50 to-transparent mt-0.5"></div>
			<div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent mt-1"></div>
			<div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent mt-1.5"></div>
			<div className="absolute top-8 right-8 w-40 h-40 bg-gradient-to-br from-emerald-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse"></div>
			<div className="absolute bottom-8 left-8 w-32 h-32 bg-gradient-to-tr from-teal-400/20 to-cyan-400/20 rounded-full blur-2xl animate-pulse"></div>
			<div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-cyan-400/10 to-emerald-400/10 rounded-full blur-3xl"></div>

			<div className="relative z-10 w-full">
				<div className="max-w-7xl mx-auto px-6 py-16">
					{/* Main content grid */}
					<section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12 relative">
						{/* Beautiful gradient separator between sections */}
						<div className="absolute -bottom-6 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent"></div>
						<div className="absolute -bottom-6 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-teal-400/40 to-transparent mt-0.5"></div>
						{/* Brand section */}
						<div className="lg:col-span-2">
							<div className="flex items-center gap-4 mb-6">
								<div className="w-14 h-14 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-2xl transform hover:scale-105 transition-transform duration-300">
									<span className="text-white font-bold text-2xl">N</span>
								</div>
								<div>
									<h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent">
										News App
									</h2>
									<p className="text-sm text-gray-800 dark:text-gray-200 mt-1 font-medium">
										Modern News Platform
									</p>
								</div>
							</div>
							<p className="text-gray-800 dark:text-gray-100 text-base leading-relaxed mb-6 max-w-md">
								Stay updated with the latest news and stories from around the
								world. Powered by advanced technology and real-time analytics.
							</p>
							<div className="flex items-center gap-4">
								<div className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 rounded-full border border-green-200 dark:border-green-800">
									<div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
									<span className="text-sm text-green-700 dark:text-green-400 font-medium">
										Live
									</span>
								</div>
								<div className="text-sm text-gray-800 dark:text-gray-100 bg-white/50 dark:bg-gray-600/50 px-3 py-2 rounded-lg">
									Build: {builtAt}
								</div>
							</div>
						</div>

						{/* Quick Links */}
						<nav>
							<h3 className="font-bold text-gray-900 dark:text-gray-100 mb-6 text-xl flex items-center gap-3">
								<span className="text-2xl">🔗</span>
								Quick Links
							</h3>
							<div className="space-y-4">
								<Link
									to="/"
									className="flex items-center gap-3 text-sm text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 hover:translate-x-2 group p-2 rounded-lg hover:bg-white/50 dark:hover:bg-gray-600/50"
								>
									<span className="text-xl group-hover:scale-110 transition-transform">
										🏠
									</span>
									<span className="font-medium">Home</span>
								</Link>
								<Link
									to="/ads/demo"
									className="flex items-center gap-3 text-sm text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 hover:translate-x-2 group p-2 rounded-lg hover:bg-white/50 dark:hover:bg-gray-600/50"
								>
									<span className="text-xl group-hover:scale-110 transition-transform">
										🎯
									</span>
									<span className="font-medium">Ad Demo</span>
								</Link>
								<Link
									to="/stats"
									className="flex items-center gap-3 text-sm text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 hover:translate-x-2 group p-2 rounded-lg hover:bg-white/50 dark:hover:bg-gray-600/50"
								>
									<span className="text-xl group-hover:scale-110 transition-transform">
										📈
									</span>
									<span className="font-medium">Statistics</span>
								</Link>
								<Link
									to="/ads/create"
									className="flex items-center gap-3 text-sm text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 hover:translate-x-2 group p-2 rounded-lg hover:bg-white/50 dark:hover:bg-gray-600/50"
								>
									<span className="text-xl group-hover:scale-110 transition-transform">
										✨
									</span>
									<span className="font-medium">Create Ad</span>
								</Link>
							</div>
						</nav>

						{/* Technology */}
						<section>
							<h3 className="font-bold text-gray-900 dark:text-gray-100 mb-6 text-xl flex items-center gap-3">
								<span className="text-2xl">⚡</span>
								Technology
							</h3>
							<div className="space-y-4">
								<div className="flex items-center gap-3 text-sm text-gray-800 dark:text-gray-200 p-2 rounded-lg bg-white/30 dark:bg-gray-600/30">
									<span className="text-xl">⚡</span>
									<span className="font-medium">React + Vite</span>
								</div>
								<div className="flex items-center gap-3 text-sm text-gray-800 dark:text-gray-200 p-2 rounded-lg bg-white/30 dark:bg-gray-600/30">
									<span className="text-xl">🚀</span>
									<span className="font-medium">Fast & Modern</span>
								</div>
								<div className="flex items-center gap-3 text-sm text-gray-800 dark:text-gray-200 p-2 rounded-lg bg-white/30 dark:bg-gray-600/30">
									<span className="text-xl">🔒</span>
									<span className="font-medium">Secure</span>
								</div>
							</div>
						</section>
					</section>

					{/* Bottom section */}
					<section className="pt-8 relative">
						{/* Beautiful gradient separator */}
						<div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gray-400/60 to-transparent dark:via-gray-500/60"></div>
						<div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-300/40 to-transparent dark:via-emerald-400/40 mt-0.5"></div>
						<div className="flex flex-col md:flex-row justify-between items-center gap-6">
							<div className="text-center md:text-left">
								<p className="text-sm text-gray-800 dark:text-gray-100 mb-2 font-medium">
									© 2025 News App. All rights reserved.
								</p>
								<p className="flex items-center justify-center md:justify-start gap-2 text-sm text-gray-700 dark:text-gray-300">
									Made with{" "}
									<span className="text-red-500 animate-pulse text-lg">❤️</span>
									<span>Powered by React + Vite + TypeScript</span>
								</p>
							</div>

							<div className="flex items-center gap-4">
								<div className="text-xs text-gray-700 dark:text-gray-300 bg-white/50 dark:bg-gray-600/50 px-3 py-2 rounded-lg">
									Version 1.0.0
								</div>
							</div>
						</div>
					</section>
				</div>
			</div>
		</footer>
	);
}
