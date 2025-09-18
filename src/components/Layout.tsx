import { type ReactNode, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useThemeStore } from "../lib/store";
import { useAuth } from "../stores/auth";
import ThemeToggle from "./ThemeToggle";

type LayoutProps = {
	children?: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
	const { theme } = useThemeStore();
	const { isLoggedIn, logout } = useAuth();
	const navigate = useNavigate();

	useEffect(() => {
		document.documentElement.classList.toggle("dark", theme === "dark");
	}, [theme]);

	const handleLogout = () => {
		logout();
		navigate("/", { replace: true });
	};

	const btnNav =
		"px-3 py-1 rounded-lg border text-sm font-medium transition-colors " +
		"border-gray-400/60 text-gray-900 dark:text-gray-100 " +
		"hover:bg-gray-100 dark:hover:bg-gray-800 " +
		"focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 " +
		"focus:ring-offset-white dark:focus:ring-offset-gray-900 " +
		"focus:bg-black focus:text-white focus:border-black " +
		"dark:focus:bg-white dark:focus:text-black dark:focus:border-white";

	return (
		<div className="min-h-screen">
			<header className="border-b dark:border-gray-700">
				<div className="max-w-6xl mx-auto p-4 flex items-center justify-between gap-4">
					<Link to="/" className="text-xl font-bold">
						News App
					</Link>

					<div className="flex items-center gap-2">
						{isLoggedIn ? (
							<button type="button" onClick={handleLogout} className={btnNav}>
								Logout
							</button>
						) : (
							<>
								<Link to="/login" className={btnNav}>
									Login
								</Link>
								<Link to="/register" className={btnNav}>
									Sign up
								</Link>
							</>
						)}

						<ThemeToggle />
					</div>
				</div>
			</header>

			<main className="max-w-6xl mx-auto p-4">{children}</main>
		</div>
	);
}
