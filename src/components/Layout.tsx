import { Outlet, useLocation } from "react-router-dom";
import Footer from "./Footer";
import Header from "./Header";

export default function Layout() {
	const { pathname } = useLocation();
	const hideHeader = pathname === "/login" || pathname === "/register";

	return (
		<div className="min-h-screen flex flex-col">
			{!hideHeader && <Header />}
			<main className="max-w-6xl mx-auto p-4 flex-1">
				<Outlet />
			</main>
			<Footer />
		</div>
	);
}
