import type { BaseEvent, EventName } from "./events";
import { enqueue, getSid } from "./queue";

export interface ReporterContext {
	uid?: string;
}

export function report(
	event: EventName,
	data?: unknown,
	ctx?: ReporterContext,
) {
	const payload: BaseEvent = {
		event,
		ts: Date.now(),
		page: location.href,
		ref: document.referrer || undefined,
		sid: getSid(),
		uid: ctx?.uid,
		data,
	};
	enqueue(payload);
}
