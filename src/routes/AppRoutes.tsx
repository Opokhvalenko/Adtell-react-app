import { lazy, Suspense } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Layout from "../components/Layout";

const Feed = lazy(() => import("../features/news/Feed"));


export default function AppRoutes() {
	const location = useLocation();
	const state = location.state as { backgroundLocation?: Location } | undefined;
	const loader = <div className="p-4">Loading…</div>;

	return (
		<>
			<Routes location={state?.backgroundLocation || location}>
				<Route element={<Layout />}>
					<Route
						index
						element={
							<Suspense fallback={loader}>
								<Feed />
							</Suspense>
						}
					/>		
				</Route>
			</Routes>
			{state?.backgroundLocation && (
				<Routes>
					<Route element={<Layout />}>
					</Route>
				</Routes>
			)}
		</>
	);
}
