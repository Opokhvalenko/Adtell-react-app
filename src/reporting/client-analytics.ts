import { ANALYTICS_EVENTS } from "@/config/analytics";
import type { BaseEvent } from "@/lib/analytics/events";

export async function sendAnalyticsBatch(
	events: BaseEvent[],
	opts?: { unloading?: boolean },
): Promise<void> {
	if (!events.length) return;

	const body = JSON.stringify(events);

	if (opts?.unloading && "sendBeacon" in navigator) {
		try {
			navigator.sendBeacon(
				ANALYTICS_EVENTS,
				new Blob([body], { type: "application/json" }),
			);
			return;
		} catch {}
	}

	await fetch(ANALYTICS_EVENTS, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body,
		keepalive: !!opts?.unloading,
		credentials: "include",
	});
}
