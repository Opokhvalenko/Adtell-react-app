import type { ReactElement } from "react";
import { lazy, Suspense } from "react";
import {
	type Location,
	Navigate,
	Route,
	Routes,
	useLocation,
} from "react-router-dom";
import Layout from "../components/Layout";
import { useAuth } from "../stores/auth";

const Feed = lazy(() => import("../features/news/Feed"));
const LoginForm = lazy(() => import("../features/auth/LoginForm"));
const RegisterForm = lazy(() => import("../features/auth/RegisterForm"));
const ArticlePage = lazy(() => import("../features/news/ArticlePage"));
const NewsModal = lazy(() => import("../features/news/NewsModal"));

function PrivateRoute({ children }: { children: ReactElement }) {
	const { isLoggedIn } = useAuth();
	return isLoggedIn ? children : <Navigate to="/login" replace />;
}

function PublicOnlyRoute({ children }: { children: ReactElement }) {
	const { isLoggedIn } = useAuth();
	return !isLoggedIn ? children : <Navigate to="/" replace />;
}

export default function AppRoutes() {
	const location = useLocation();
	const state = location.state as { backgroundLocation?: Location } | undefined;

	const loader = <div className="p-4">Loading…</div>;

	return (
		<Suspense fallback={loader}>
			{/* основний рендер: фон для модалки або звичайний контент */}
			<Routes location={state?.backgroundLocation || location}>
				<Route element={<Layout />}>
					<Route index element={<Feed />} />

					<Route
						path="login"
						element={
							<PublicOnlyRoute>
								<LoginForm />
							</PublicOnlyRoute>
						}
					/>

					<Route
						path="register"
						element={
							<PublicOnlyRoute>
								<RegisterForm />
							</PublicOnlyRoute>
						}
					/>

					<Route
						path="news/:id"
						element={
							<PrivateRoute>
								<ArticlePage />
							</PrivateRoute>
						}
					/>
				</Route>
			</Routes>

			{/* модалка поверх фону — тільки якщо прийшли з backgroundLocation */}
			{state?.backgroundLocation && (
				<Routes>
					<Route element={<Layout />}>
						<Route
							path="news/:id"
							element={
								<PrivateRoute>
									<NewsModal />
								</PrivateRoute>
							}
						/>
					</Route>
				</Routes>
			)}
		</Suspense>
	);
}
