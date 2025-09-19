import React from "react";
import ReactDOM from "react-dom/client";
import "./tailwind.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

const queryClient = new QueryClient();
const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root #root not found");

ReactDOM.createRoot(rootEl).render(
	<React.StrictMode>
		<BrowserRouter>
			<QueryClientProvider client={queryClient}>
				<App />
			</QueryClientProvider>
		</BrowserRouter>
	</React.StrictMode>,
);
