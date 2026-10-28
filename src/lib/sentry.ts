import * as Sentry from "@sentry/react";

const APP_VERSION = import.meta.env.VITE_APP_VERSION || "1.0.0";
/** Share of transactions traced in production; every one in development. */
const TRACES_SAMPLE_RATE_PROD = 0.1;
const TRACES_SAMPLE_RATE_DEV = 1;

export function initSentry() {
	// Without a DSN there is nowhere to send events
	if (!import.meta.env.VITE_SENTRY_DSN) return;

	Sentry.init({
		dsn: import.meta.env.VITE_SENTRY_DSN,
		environment: import.meta.env.MODE || "development",
		tracesSampleRate:
			import.meta.env.MODE === "production"
				? TRACES_SAMPLE_RATE_PROD
				: TRACES_SAMPLE_RATE_DEV,
		debug: import.meta.env.MODE === "development",
		// No session replay: it would record what users type and read on the page
		beforeSend(event) {
			if (event.request?.url?.includes("password")) return null;
			if (event.request?.data) {
				const data =
					typeof event.request.data === "string"
						? event.request.data
						: JSON.stringify(event.request.data);
				if (data.includes("password") || data.includes("token")) {
					event.request.data = "[filtered]";
				}
			}
			return event;
		},
		initialScope: { tags: { component: "frontend", version: APP_VERSION } },
	});

	Sentry.setTag("service", "adtell-frontend");
}

export const captureException = Sentry.captureException;
export const captureMessage = Sentry.captureMessage;
export const addBreadcrumb = Sentry.addBreadcrumb;
export const setUser = Sentry.setUser;
export const setContext = Sentry.setContext;
export const setTag = Sentry.setTag;

export const SentryErrorBoundary = Sentry.ErrorBoundary;
export const withProfiler = Sentry.withProfiler;
