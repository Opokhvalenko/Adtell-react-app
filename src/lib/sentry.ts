import * as Sentry from "@sentry/react";
import { Replay } from "@sentry/replay";

export function initSentry() {
	if (
		import.meta.env.MODE === "development" &&
		!import.meta.env.VITE_SENTRY_DSN
	) {
		console.log("🔍 Sentry disabled in development mode (no DSN provided)");
		return;
	}

	Sentry.init({
		dsn: import.meta.env.VITE_SENTRY_DSN || undefined,
		environment: import.meta.env.MODE || "development",
		tracesSampleRate: import.meta.env.MODE === "production" ? 0.1 : 1.0,
		debug: import.meta.env.MODE === "development",
		integrations: [new Replay({ maskAllText: false, blockAllMedia: false })],
		beforeSend(event) {
			if (event.request?.url?.includes("password")) return null;
			return event;
		},
		initialScope: { tags: { component: "frontend", version: "1.0.0" } },
	});

	Sentry.setTag("service", "adtell-frontend");
	Sentry.setTag("version", "1.0.0");
	console.log("🔍 Sentry initialized for frontend monitoring");
}

export const captureException = Sentry.captureException;
export const captureMessage = Sentry.captureMessage;
export const addBreadcrumb = Sentry.addBreadcrumb;
export const setUser = Sentry.setUser;
export const setContext = Sentry.setContext;
export const setTag = Sentry.setTag;

export const SentryErrorBoundary = Sentry.ErrorBoundary;
export const withProfiler = Sentry.withProfiler;
