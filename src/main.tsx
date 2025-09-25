import React from "react";
import ReactDOM from "react-dom/client";
import "./tailwind.css";
import { QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import { queryClient } from "./lib/query";
import { ErrorBoundary } from "./reporting/ErrorBoundary";

import("virtual:ads-module").then((m) => m.initAds?.()).catch(() => {});

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
