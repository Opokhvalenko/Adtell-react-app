import { ADS_DEBUG } from "virtual:ads-config";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/store/auth";
import Loader from "./Loader";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
	const { isLoggedIn, isLoading, logout } = useAuth();
	const navigate = useNavigate();
	const { pathname } = useLocation();

	const handleLogout = () => {
		logout();
		navigate("/", { replace: true });
	};

	const isAdsDebug = pathname.startsWith("/ads-debug");
	const adsBtnLabel = isAdsDebug ? "Home" : "Ads test";
	const adsBtnHref = isAdsDebug ? "/" : "/ads-debug";

	return (
		<header className="border-b dark:border-white/20">
			<div className="max-w-6xl mx-auto p-4 flex items-center justify-between gap-4">
				<Link to="/" className="text-xl font-bold">
					News App
				</Link>

				{isLoading ? (
					<Loader label="Loading…" className="p-0 text-sm opacity-70" />
				) : (
					<div className="flex items-center gap-2">
						{ADS_DEBUG && (
							<Link to={adsBtnHref} className="btn-nav">
								{adsBtnLabel}
							</Link>
						)}
						{isLoggedIn && (
							<Link to="/ads/create" className="btn-nav">
								Create ad
							</Link>
						)}
						<ThemeToggle className="btn-nav" />
						{isLoggedIn ? (
							<button type="button" onClick={handleLogout} className="btn-nav">
								Logout
							</button>
						) : (
							<>
								<Link to="/login" className="btn-nav">
									Login
								</Link>
								<Link to="/register" className="btn-nav">
									Sign up
								</Link>
							</>
						)}
					</div>
				)}
			</div>
		</header>
	);
}
