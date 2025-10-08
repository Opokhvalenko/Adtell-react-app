import type { BaseEvent } from "@/lib/analytics/events";

export const ANALYTICS_ENDPOINT = String(
	import.meta.env.VITE_REPORTING_URL || "/analytics/events",
);

export async function sendAnalyticsBatch(
	events: BaseEvent[],
	opts?: { unloading?: boolean },
): Promise<void> {
	if (!events.length) return;

	const body = JSON.stringify(events);

	if (opts?.unloading && "sendBeacon" in navigator) {
		try {
			navigator.sendBeacon(
				ANALYTICS_ENDPOINT,
				new Blob([body], { type: "application/json" }),
			);
			return;
		} catch {}
	}

	await fetch(ANALYTICS_ENDPOINT, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body,
		keepalive: !!opts?.unloading,
	});
}
