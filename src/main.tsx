import React from "react";
import ReactDOM from "react-dom/client";
import "./tailwind.css";
import { initAnalytics } from "virtual:ads-analytics";
import { QueryClientProvider } from "@tanstack/react-query";
import { ensureAdUid } from "@/lib/ads/uid";
import { report } from "@/lib/analytics/reporter";
import { reportError } from "@/reporting/errors";
import App from "./App";
import { queryClient } from "./lib/query";
import { ErrorBoundary } from "./reporting/ErrorBoundary";

if (import.meta.env.VITE_ENABLE_REPORTING === "true") {
	void initAnalytics({ enabled: true, context: { app: "news-app" } });
}

report("pageLoad");
ensureAdUid();

(async () => {
	try {
		const m = await import("virtual:ads-module");
		if (typeof m.initAds === "function") await m.initAds();
	} catch (err) {
		reportError(err, { where: "bootstrap:ads-module" });
	}
})();

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root #root not found");

ReactDOM.createRoot(rootEl).render(
	<React.StrictMode>
		<ErrorBoundary>
			<QueryClientProvider client={queryClient}>
				<App />
			</QueryClientProvider>
		</ErrorBoundary>
	</React.StrictMode>,
);
