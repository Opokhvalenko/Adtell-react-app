import React from "react";
import ReactDOM from "react-dom/client";
import "./tailwind.css";

const darkThemeStyles = `
html.dark * {
	color: rgb(243 244 246) !important;
}

html.dark button {
	background-color: rgb(55 65 81) !important;
	color: rgb(243 244 246) !important;
}

html.dark button:focus {
	background-color: rgb(55 65 81) !important;
	color: rgb(243 244 246) !important;
	outline: 2px solid rgb(59 130 246) !important;
	outline-offset: 2px !important;
}

html.dark button:focus-visible {
	background-color: rgb(55 65 81) !important;
	color: rgb(243 244 246) !important;
	outline: 2px solid rgb(59 130 246) !important;
	outline-offset: 2px !important;
}

html.dark input, html.dark textarea, html.dark select {
	background-color: rgb(55 65 81) !important;
	color: rgb(255 255 255) !important;
	border-color: rgb(75 85 99) !important;
}

html.dark input::placeholder, html.dark textarea::placeholder {
	color: rgb(156 163 175) !important;
}

html.dark input:focus, html.dark textarea:focus, html.dark select:focus {
	background-color: rgb(55 65 81) !important;
	color: rgb(255 255 255) !important;
	border-color: rgb(59 130 246) !important;
	outline: 2px solid rgb(59 130 246) !important;
	outline-offset: 2px !important;
}

html.dark input[type="text"], 
html.dark input[type="email"], 
html.dark input[type="password"], 
html.dark input[type="search"],
html.dark input[type="tel"],
html.dark input[type="url"],
html.dark textarea {
	background-color: rgb(55 65 81) !important;
	color: rgb(255 255 255) !important;
	border-color: rgb(75 85 99) !important;
}

html.dark .input-field {
	background-color: rgb(55 65 81) !important;
	color: rgb(255 255 255) !important;
	border-color: rgb(75 85 99) !important;
}

html.dark .input-field::placeholder {
	color: rgb(156 163 175) !important;
}

html.dark a {
	color: rgb(243 244 246) !important;
}

html.dark a:focus {
	color: rgb(243 244 246) !important;
	outline: 2px solid rgb(59 130 246) !important;
	outline-offset: 2px !important;
}

html.dark a:focus-visible {
	color: rgb(243 244 246) !important;
	outline: 2px solid rgb(59 130 246) !important;
	outline-offset: 2px !important;
}

html.dark h1, html.dark h2, html.dark h3, html.dark h4, html.dark h5, html.dark h6 {
	color: rgb(255 255 255) !important;
}

html.dark p, html.dark span, html.dark div {
	color: rgb(243 244 246) !important;
}

html.dark table th {
	background-color: rgb(31 41 55) !important;
	color: rgb(243 244 246) !important;
}

html.dark table td {
	color: rgb(243 244 246) !important;
}

html.dark .bg-white\\/95, html.dark .bg-white\\/90 {
	background-color: rgb(31 41 55) !important;
}

/* Додаткові стилі для всіх білих фонів */
html.dark .bg-white {
	background-color: rgb(31 41 55) !important;
}

html.dark .bg-gray-50 {
	background-color: rgb(55 65 81) !important;
}

html.dark .bg-gray-100 {
	background-color: rgb(55 65 81) !important;
}

html.dark .bg-slate-50 {
	background-color: rgb(55 65 81) !important;
}

html.dark .bg-slate-100 {
	background-color: rgb(55 65 81) !important;
}

/* Стилі для всіх можливих контейнерів */
html.dark [class*="bg-white"], 
html.dark [class*="bg-gray-50"], 
html.dark [class*="bg-slate-50"] {
	background-color: rgb(31 41 55) !important;
}

/* Стилі для всіх елементів форми */
html.dark form input,
html.dark form textarea,
html.dark form select,
html.dark form button {
	background-color: rgb(55 65 81) !important;
	color: rgb(255 255 255) !important;
	border-color: rgb(75 85 99) !important;
}

html.dark form input::placeholder,
html.dark form textarea::placeholder {
	color: rgb(156 163 175) !important;
}

/* Стилі для всіх div з білим фоном */
html.dark div[class*="bg-white"],
html.dark div[class*="bg-gray-50"],
html.dark div[class*="bg-slate-50"] {
	background-color: rgb(31 41 55) !important;
}

/* Специфічні стилі для кнопки Read more */
html.dark .bg-blue-100 {
	background-color: rgb(30 58 138) !important;
}

html.dark .text-blue-900 {
	color: rgb(219 234 254) !important;
}

html.dark div.flex.items-center.gap-3 {
	background-color: rgb(30 58 138) !important;
	color: rgb(219 234 254) !important;
}

/* Стилі для всіх кнопок Read more */
html.dark [class*="bg-blue-100"] {
	background-color: rgb(30 58 138) !important;
}

html.dark [class*="text-blue-900"] {
	color: rgb(219 234 254) !important;
}

/* Додаткові стилі для кнопок з синіми кольорами */
html.dark .bg-blue-200 {
	background-color: rgb(30 58 138) !important;
}

html.dark .text-blue-800 {
	color: rgb(219 234 254) !important;
}

html.dark .text-blue-700 {
	color: rgb(219 234 254) !important;
}

/* Стилі для всіх елементів з синіми кольорами */
html.dark [class*="bg-blue-200"],
html.dark [class*="bg-blue-300"] {
	background-color: rgb(30 58 138) !important;
}

html.dark [class*="text-blue-800"],
html.dark [class*="text-blue-700"] {
	color: rgb(219 234 254) !important;
}

/* Стилі для всіх інтерактивних елементів при фокусі */
html.dark *:focus {
	outline: 1px solid rgb(75 85 99) !important;
	outline-offset: 1px !important;
	background-color: rgb(31 41 55) !important;
	color: rgb(243 244 246) !important;
	box-shadow: 0 0 0 1px rgb(75 85 99) !important;
}

html.dark *:focus-visible {
	outline: 1px solid rgb(75 85 99) !important;
	outline-offset: 1px !important;
	background-color: rgb(31 41 55) !important;
	color: rgb(243 244 246) !important;
	box-shadow: 0 0 0 1px rgb(75 85 99) !important;
}

/* Специфічні стилі для кнопок при фокусі */
html.dark button:focus,
html.dark button:focus-visible {
	background-color: rgb(31 41 55) !important;
	color: rgb(243 244 246) !important;
	outline: 1px solid rgb(75 85 99) !important;
	outline-offset: 1px !important;
	box-shadow: 0 0 0 1px rgb(75 85 99) !important;
}

/* Стилі для input полів при фокусі */
html.dark input:focus,
html.dark textarea:focus,
html.dark select:focus {
	background-color: rgb(31 41 55) !important;
	color: rgb(243 244 246) !important;
	border-color: rgb(75 85 99) !important;
	outline: 1px solid rgb(75 85 99) !important;
	outline-offset: 1px !important;
	box-shadow: 0 0 0 1px rgb(75 85 99) !important;
}

/* Додаткові стилі для всіх можливих станів фокуса */
html.dark *:focus,
html.dark *:focus-within,
html.dark *:focus-visible,
html.dark *:active {
	background-color: rgb(31 41 55) !important;
	color: rgb(243 244 246) !important;
	outline: 1px solid rgb(75 85 99) !important;
	outline-offset: 1px !important;
	box-shadow: 0 0 0 1px rgb(75 85 99) !important;
}

/* Стилі для всіх елементів при будь-якому фокусі */
html.dark button:focus,
html.dark button:focus-within,
html.dark button:focus-visible,
html.dark button:active,
html.dark a:focus,
html.dark a:focus-within,
html.dark a:focus-visible,
html.dark a:active {
	background-color: rgb(55 65 81) !important;
	color: rgb(243 244 246) !important;
}

/* Стилі для всіх input елементів при будь-якому фокусі */
html.dark input:focus,
html.dark input:focus-within,
html.dark input:focus-visible,
html.dark input:active,
html.dark textarea:focus,
html.dark textarea:focus-within,
html.dark textarea:focus-visible,
html.dark textarea:active {
	background-color: rgb(55 65 81) !important;
	color: rgb(255 255 255) !important;
}
`;

// Додаємо стилі до DOM
const styleElement = document.createElement("style");
styleElement.textContent = darkThemeStyles;
document.head.appendChild(styleElement);

import { initAnalytics } from "virtual:ads-analytics";
import { buildTime } from "virtual:build-info";
import { QueryClientProvider } from "@tanstack/react-query";
import { ensureAdUid } from "@/lib/ads/uid";
import { report } from "@/lib/analytics/reporter";
import { queryClient } from "@/lib/query";
import { initSentry, SentryErrorBoundary, withProfiler } from "@/lib/sentry";
import { reportError } from "@/reporting/errors";
import App from "./App";
import { ErrorBoundary } from "./reporting/ErrorBoundary";
import "virtual:ads-bridge";

const ENABLE_REPORTING = import.meta.env.VITE_ENABLE_REPORTING === "true";
const ENABLE_ADS = (import.meta.env.VITE_ENABLE_ADS ?? "true") === "true";

/* run fn when browser is idle-ish (no render blocking) */
function scheduleIdle(fn: () => void, timeout = 1500) {
	if ("requestIdleCallback" in window) {
		window.requestIdleCallback?.(fn, { timeout });
		return;
	}
	const run = () => setTimeout(fn, 0);
	document.readyState === "complete"
		? run()
		: window.addEventListener("load", run, { once: true });
}

/* wait for a couple of paints so React mounts content */
async function afterNextPaints(times = 2): Promise<void> {
	for (let i = 0; i < times; i++) {
		await new Promise<void>((r) => requestAnimationFrame(() => r()));
	}
}

/* if tab is hidden — delay heavy work until visible */
async function whenVisible(): Promise<void> {
	if (document.visibilityState !== "hidden") return;
	await new Promise<void>((resolve) => {
		const on = () => {
			if (document.visibilityState === "visible") {
				document.removeEventListener("visibilitychange", on);
				resolve();
			}
		};
		document.addEventListener("visibilitychange", on);
	});
}

/* ---------------- bootstrap ---------------- */

try {
	initSentry();
} catch (e) {
	console.warn("[sentry] init skipped:", e);
}

if (ENABLE_REPORTING) {
	void initAnalytics({
		enabled: true,
		context: { app: "news-app", env: import.meta.env.MODE, buildTime },
	});
}

try {
	report("pageLoad");
} catch {
	/* no-op */
}

/* uid for ads as early as possible */
ensureAdUid();

/* lazy-load ads module safely */
scheduleIdle(() => {
	(async () => {
		try {
			if (!ENABLE_ADS) return;

			// типізований доступ до Save-Data
			type NavigatorWithConnection = Navigator & {
				connection?: { saveData?: boolean };
			};
			const saveData =
				(navigator as NavigatorWithConnection).connection?.saveData === true;
			if (saveData) {
				console.info("[main] Save-Data enabled; loading ads anyway for dev");
			}

			await whenVisible();
			console.log("[main] Loading ads module...");
			const mod = await import("virtual:ads-module");
			console.log("[main] Ads module loaded:", Object.keys(mod));

			// give React a moment to mount slots
			await afterNextPaints(2);

			if (typeof mod.initAds === "function") {
				console.log("[main] Initializing ads…");
				await mod.initAds();
				console.log("[main] Ads initialized");
			}
		} catch (err) {
			console.error("[main] Ads module error:", err);
			reportError(err, { where: "bootstrap:ads-module" });
		}
	})();
});

/* ---------------- mount ---------------- */

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root element #root not found");

const root = ReactDOM.createRoot(rootEl);

// ✅ Обгортаємо сам застосунок у withProfiler
const AppWithProfiler = withProfiler(App, { name: "root" });

root.render(
	<React.StrictMode>
		<SentryErrorBoundary fallback={<div>Something went wrong</div>}>
			<ErrorBoundary>
				<QueryClientProvider client={queryClient}>
					<AppWithProfiler />
				</QueryClientProvider>
			</ErrorBoundary>
		</SentryErrorBoundary>
	</React.StrictMode>,
);
/* HMR cleanup */
if (import.meta.hot) {
	import.meta.hot.dispose(() => {
		root.unmount();
	});
}
