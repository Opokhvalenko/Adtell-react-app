import { lazy, type ReactElement, Suspense, useEffect } from "react";
import {
	createBrowserRouter,
	Navigate,
	type RouteObject,
	RouterProvider,
} from "react-router-dom";

import Layout from "@/components/Layout";
import Loader from "@/components/Loader";
import { useAuth } from "@/store/auth";

const Feed = lazy(() => import("@/features/news/Feed"));
const ArticlePage = lazy(() => import("@/features/news/ArticlePage"));
const NewsModal = lazy(() => import("@/features/news/NewsModal"));
const LoginForm = lazy(() => import("@/features/auth/LoginForm"));
const RegisterForm = lazy(() => import("@/features/auth/RegisterForm"));
const AdsDebugPage = lazy(() => import("@/features/ads/AdsDebugPage"));
const AdminFormShadow = lazy(() => import("@/features/ads/AdminFormShadow"));

function RequireAuth({ children }: { children: ReactElement }) {
	const { isLoggedIn } = useAuth();
	return isLoggedIn ? children : <Navigate to="/login" replace />;
}

function PublicOnly({ children }: { children: ReactElement }) {
	const { isLoggedIn } = useAuth();
	return !isLoggedIn ? children : <Navigate to="/" replace />;
}

function AuthBootstrap({ children }: { children: React.ReactNode }) {
	const { hydrate, isLoading } = useAuth();
	useEffect(() => {
		void hydrate();
	}, [hydrate]);
	if (isLoading) return <Loader />;
	return <>{children}</>;
}

const ADS_DEBUG = import.meta.env.VITE_ADS_DEBUG === "true";

const routes = [
	{
		element: (
			<AuthBootstrap>
				<Layout />
			</AuthBootstrap>
		),
		children: [
			{ index: true, element: <Feed /> },
			{
				path: "login",
				element: (
					<PublicOnly>
						<LoginForm />
					</PublicOnly>
				),
			},
			{
				path: "register",
				element: (
					<PublicOnly>
						<RegisterForm />
					</PublicOnly>
				),
			},
			{
				path: "news/:id",
				element: (
					<RequireAuth>
						<ArticlePage />
					</RequireAuth>
				),
			},
			...(ADS_DEBUG
				? ([
						{ path: "ads-debug", element: <AdsDebugPage /> },
						{ path: "ads/admin", element: <AdminFormShadow /> },
					] as const)
				: []),
		],
	},
	{
		path: "news/:id/modal",
		element: (
			<RequireAuth>
				<NewsModal />
			</RequireAuth>
		),
	},
] satisfies RouteObject[];

const router = createBrowserRouter(routes);

export default function AppRoutes() {
	return (
		<Suspense fallback={<Loader />}>
			<RouterProvider router={router} />
		</Suspense>
	);
}
