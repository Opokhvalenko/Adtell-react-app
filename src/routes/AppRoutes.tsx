import { lazy, type ReactElement, Suspense, useEffect } from "react";
import {
	createBrowserRouter,
	Navigate,
	type RouteObject,
	RouterProvider,
	useLocation,
	useRouteError,
} from "react-router-dom";

import Layout from "@/components/Layout";
import Loader from "@/components/Loader";
import StatsPage from "@/features/stats/StatsPage";
import { useAuth } from "@/store/auth";

const Feed = lazy(() => import("@/features/news/Feed"));
const ArticlePage = lazy(() => import("@/features/news/ArticlePage"));
const NewsModal = lazy(() => import("@/features/news/NewsModal"));
const LoginForm = lazy(() => import("@/features/auth/LoginForm"));
const RegisterForm = lazy(() => import("@/features/auth/RegisterForm"));
const AdsDebugPage = lazy(() => import("@/features/ads/AdsDebugPage"));
const CreateAdShadow = lazy(() => import("@/features/ads/CreateAdShadow"));
const AdDemo = lazy(() => import("@/features/ads/AdDemo"));

const ADS_DEBUG = import.meta.env.VITE_ADS_DEBUG === "true";

function RequireAuth({ children }: { children: ReactElement }) {
	const { isLoggedIn, isLoading } = useAuth();
	const location = useLocation();
	if (isLoading) return <Loader />;
	return isLoggedIn ? (
		children
	) : (
		<Navigate to="/login" replace state={{ from: location }} />
	);
}

function PublicOnly({ children }: { children: ReactElement }) {
	const { isLoggedIn, isLoading } = useAuth();
	if (isLoading) return <Loader />;
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

function RouteError() {
	const err = useRouteError();
	const message =
		err &&
		typeof err === "object" &&
		"message" in err &&
		typeof (err as { message: unknown }).message === "string"
			? (err as { message: string }).message
			: "Something went wrong.";
	return (
		<div className="max-w-xl mx-auto p-6">
			<h1 className="text-xl font-semibold mb-2">Error</h1>
			<p className="text-sm opacity-80">{message}</p>
		</div>
	);
}

const routes = [
	{
		element: (
			<AuthBootstrap>
				<Layout />
			</AuthBootstrap>
		),
		errorElement: <RouteError />,
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
			{
				path: "ads/create",
				element: (
					<RequireAuth>
						<CreateAdShadow />
					</RequireAuth>
				),
			},
			{
				path: "ads/demo",
				element: (
					<RequireAuth>
						<AdDemo />
					</RequireAuth>
				),
			},
			{
				path: "stats",
				element: (
					<RequireAuth>
						<StatsPage />
					</RequireAuth>
				),
			},

			...(ADS_DEBUG
				? [
						{
							path: "ads/debug",
							element: (
								<RequireAuth>
									<AdsDebugPage />
								</RequireAuth>
							),
						},
						{
							path: "ads-debug",
							element: <Navigate to="/ads/debug" replace />,
						},
					]
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
	{ path: "*", element: <Navigate to="/" replace /> },
] satisfies RouteObject[];

const router = createBrowserRouter(routes, {
	future: { v7_startTransition: true, v7_relativeSplatPath: true },
});

export default function AppRoutes() {
	return (
		<Suspense fallback={<Loader />}>
			<RouterProvider router={router} />
		</Suspense>
	);
}
