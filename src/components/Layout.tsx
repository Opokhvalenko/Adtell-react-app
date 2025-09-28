import { Outlet, useLocation } from "react-router-dom";
import AdSlot from "@/components/ads/AdSlot";
import Footer from "./Footer";
import Header from "./Header";

export default function Layout() {
	const { pathname } = useLocation();
	const onAuthPage = pathname === "/login" || pathname === "/register";

	return (
		<div className="min-h-screen flex flex-col">
			{!onAuthPage && <Header />}

			{!onAuthPage && (
				<div className="my-6 flex justify-center">
					<AdSlot sizes={["300x250"]} type="banner" />
				</div>
			)}

			<main className="max-w-6xl mx-auto p-4 flex-1">
				<Outlet />
			</main>

			<Footer />
		</div>
	);
}
