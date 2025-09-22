import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../store/auth";
import Loader from "./Loader";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
	const { isLoggedIn, isLoading, logout } = useAuth();
	const navigate = useNavigate();

	const handleLogout = () => {
		logout();
		navigate("/", { replace: true });
	};

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
						<ThemeToggle className="btn-nav" />
					</div>
				)}
			</div>
		</header>
	);
}
