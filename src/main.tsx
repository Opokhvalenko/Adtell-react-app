import React from "react";
import ReactDOM from "react-dom/client";
import "./tailwind.css";

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
