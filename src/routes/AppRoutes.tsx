import { lazy, Suspense } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Layout from "../components/Layout";

const Feed = lazy(() => import("../features/news/Feed"));
const LoginForm = lazy(() => import("../features/auth/LoginForm"));
const RegisterForm = lazy(() => import("../features/auth/RegisterForm"));
const NewsModal = lazy(() => import("../features/news/NewsModal"));
const ArticlePage = lazy(() => import("../features/news/ArticlePage"));

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
					<Route
						path="login"
						element={
							<Suspense fallback={loader}>
								<LoginForm />
							</Suspense>
						}
					/>
					<Route
						path="register"
						element={
							<Suspense fallback={loader}>
								<RegisterForm />
							</Suspense>
						}
					/>
					<Route
						path="news/:id"
						element={
							<Suspense fallback={loader}>
								<ArticlePage />
							</Suspense>
						}
					/>
				</Route>
			</Routes>

			{state?.backgroundLocation && (
				<Routes>
					<Route element={<Layout />}>
						<Route
							path="news/:id"
							element={
								<Suspense fallback={loader}>
									<NewsModal />
								</Suspense>
							}
						/>
					</Route>
				</Routes>
			)}
		</>
	);
}
