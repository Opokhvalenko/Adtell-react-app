import { ADS_DEBUG, ENABLE_REPORTING } from "virtual:ads-config";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/store/auth";
import Loader from "./Loader";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
	const { isLoggedIn, isLoading, logout } = useAuth();
	const navigate = useNavigate();
	const { pathname } = useLocation();

	function handleLogout() {
		logout();
		navigate("/", { replace: true });
	}

	const isAdsDebug = pathname.startsWith("/ads-debug");
	const adsBtnLabel = isAdsDebug ? "Home" : "Debug";
	const adsBtnHref = isAdsDebug ? "/" : "/ads-debug";

	const isHomeActive = pathname === "/";
	const isStatsActive = pathname.startsWith("/stats");
	const isAdDemoActive = pathname.startsWith("/ads/demo");
	const isCreateAdActive = pathname.startsWith("/ads/create");
	const isLoginActive = pathname.startsWith("/login");
	const isRegisterActive = pathname.startsWith("/register");

	const getTabClasses = (isActive: boolean) =>
		isActive
			? "bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white border-emerald-400 shadow-2xl scale-105 hover:from-emerald-400 hover:via-teal-400 hover:to-cyan-400 hover:shadow-3xl hover:scale-110 hover:-translate-y-1 ring-2 ring-emerald-300/60 backdrop-blur-md"
			: "bg-white/90 text-gray-800 border-gray-200 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-cyan-50 hover:text-emerald-700 hover:border-emerald-300 hover:shadow-xl hover:scale-105 hover:-translate-y-0.5 dark:bg-gray-700/90 dark:text-gray-100 dark:border-gray-500 dark:hover:bg-gradient-to-r dark:hover:from-emerald-800/30 dark:hover:to-cyan-800/30 dark:hover:text-emerald-200 dark:hover:border-emerald-400 dark:hover:shadow-2xl backdrop-blur-md transition-all duration-300";

	return (
		<header className="relative glass-effect shadow-2xl sticky top-0 z-50 border-b border-white/20">
			<div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-cyan-500/5" />
			<div className="absolute bottom-0 left-0 right-0 h-3 bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent" />
			<div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-teal-500/40 to-transparent mt-0.5" />
			<div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent mt-1" />

			<div className="w-full">
				<div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
					<Link
						to="/"
						className={`text-2xl font-bold transition-all duration-300 flex items-center gap-3 ${
							isHomeActive
								? "text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 px-6 py-3 rounded-xl shadow-2xl ring-2 ring-emerald-300/60 scale-105"
								: "bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent hover:from-emerald-400 hover:via-teal-400 hover:to-cyan-400 hover:scale-105"
						}`}
					>
						<div
							className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg ${
								isHomeActive
									? "bg-white/20 backdrop-blur-sm ring-2 ring-white/30"
									: "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 hover:scale-110"
							}`}
						>
							<span className="font-bold text-lg text-white drop-shadow-sm">
								N
							</span>
						</div>
						<span className="tracking-wide">News App</span>
					</Link>

					{isLoading && (
						<Loader label="Loading…" className="p-0 text-sm opacity-70" />
					)}

					{!isLoading && (
						<nav className="flex items-center gap-4">
							{isLoggedIn && (
								<>
									{ENABLE_REPORTING && (
										<Link
											to="/stats"
											className={`inline-flex items-center justify-center gap-3 px-6 py-3 rounded-xl text-base font-semibold border shadow-sm transition-all duration-300 ease-in-out backdrop-blur-sm cursor-pointer select-none ${getTabClasses(
												isStatsActive,
											)}`}
											tabIndex={isStatsActive ? 0 : -1}
											aria-current={isStatsActive ? "page" : undefined}
										>
											<span className="text-xl drop-shadow-sm">📊</span>
											<span className="tracking-wide">Stats</span>
										</Link>
									)}

									<Link
										to="/ads/demo"
										className={`inline-flex items-center justify-center gap-3 px-6 py-3 rounded-xl text-base font-semibold border shadow-sm transition-all duration-300 ease-in-out backdrop-blur-sm cursor-pointer select-none ${getTabClasses(
											isAdDemoActive,
										)}`}
									>
										<span className="text-xl drop-shadow-sm">🎯</span>
										<span className="tracking-wide">Ad Demo</span>
									</Link>

									<Link
										to="/ads/create"
										className={`inline-flex items-center justify-center gap-3 px-6 py-3 rounded-xl text-base font-semibold border shadow-sm transition-all duration-300 ease-in-out backdrop-blur-sm cursor-pointer select-none ${getTabClasses(
											isCreateAdActive,
										)}`}
									>
										<span className="text-xl drop-shadow-sm">✨</span>
										<span className="tracking-wide">Create ad</span>
									</Link>

									{ADS_DEBUG && (
										<Link
											to={adsBtnHref}
											className={`inline-flex items-center justify-center gap-3 px-6 py-3 rounded-xl text-base font-semibold border shadow-sm transition-all duration-300 ease-in-out backdrop-blur-sm cursor-pointer select-none ${
												isAdsDebug
													? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-500 shadow-lg scale-105 hover:from-blue-500 hover:to-indigo-500 hover:shadow-xl hover:scale-110 hover:-translate-y-1"
													: "bg-white/95 text-gray-800 border-gray-300 hover:bg-white hover:shadow-md hover:scale-105 hover:-translate-y-0.5 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:shadow-lg"
											}`}
										>
											<span className="text-xl">🔧</span>
											{adsBtnLabel}
										</Link>
									)}
								</>
							)}

							{!isLoggedIn && (
								<>
									<Link
										to="/login"
										className={`inline-flex items-center justify-center gap-3 px-6 py-3 rounded-xl text-base font-semibold border shadow-xl transition-all duration-300 ease-in-out backdrop-blur-md cursor-pointer select-none ${getTabClasses(
											isLoginActive,
										)}`}
									>
										<span className="text-xl drop-shadow-sm">🔑</span>
										<span className="tracking-wide">Login</span>
									</Link>
									<Link
										to="/register"
										className={`inline-flex items-center justify-center gap-3 px-6 py-3 rounded-xl text-base font-semibold border shadow-xl transition-all duration-300 ease-in-out backdrop-blur-md cursor-pointer select-none ${getTabClasses(
											isRegisterActive,
										)}`}
									>
										<span className="text-xl drop-shadow-sm">📝</span>
										<span className="tracking-wide">Sign up</span>
									</Link>
								</>
							)}

							<ThemeToggle
								className={`inline-flex items-center justify-center gap-3 px-6 py-3 rounded-xl text-base font-semibold border shadow-sm transition-all duration-300 ease-in-out backdrop-blur-sm cursor-pointer select-none ${getTabClasses(
									false,
								)}`}
							/>

							{isLoggedIn && (
								<button
									type="button"
									onClick={handleLogout}
									aria-label="Logout"
									className="inline-flex items-center justify-center gap-3 px-6 py-3
                             rounded-xl text-base font-semibold border shadow-2xl
                             transition-all duration-300 ease-in-out backdrop-blur-md select-none
                             bg-gradient-to-r from-rose-500 via-pink-500 to-red-500 text-white border-rose-400
                             hover:from-rose-400 hover:via-pink-400 hover:to-red-400 hover:shadow-3xl hover:scale-105 hover:-translate-y-0.5
                             active:scale-95 ring-2 ring-rose-300/60
                             focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400
                             focus-visible:ring-offset-2 focus-visible:ring-offset-white
                             dark:focus-visible:ring-offset-gray-900"
								>
									<span className="text-xl">🚪</span>
									<span className="tracking-wide">Logout</span>
								</button>
							)}
						</nav>
					)}
				</div>
			</div>
		</header>
	);
}
