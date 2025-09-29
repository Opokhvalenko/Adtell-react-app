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
				<div className="max-w-6xl mx-auto p-4">
					<div className="w-[300px] h-[250px]">
						<AdSlot
							sizes={["300x250"]}
							type="banner"
							className="w-[300px] h-[250px] block"
						/>
					</div>
				</div>
			)}

			<main className="max-w-6xl mx-auto p-4 grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
				<section>
					<Outlet />
				</section>
				<aside className="hidden md:block">
					<AdSlot sizes={["300x600", "300x250"]} type="banner" />
				</aside>
			</main>

			<Footer />
		</div>
	);
}
