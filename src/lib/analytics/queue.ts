import { sendAnalyticsBatch } from "@/reporting/client-analytics";
import type { BaseEvent } from "./events";

const BATCH = Number(import.meta.env.VITE_REPORTING_BATCH ?? 20);
const INTERVAL = Number(import.meta.env.VITE_REPORTING_INTERVAL ?? 2);
const ENABLED =
	String(import.meta.env.VITE_ENABLE_REPORTING ?? "false") === "true";

export function getSid(): string {
	const KEY = "sid";
	try {
		let sid = localStorage.getItem(KEY);
		if (!sid) {
			sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
			localStorage.setItem(KEY, sid);
		}
		return sid;
	} catch {
		return `mem_${Math.random().toString(36).slice(2)}`;
	}
}

let queue: BaseEvent[] = [];
let timer: number | undefined;

async function flush(opts?: { unloading?: boolean }) {
	if (!ENABLED || queue.length === 0) return;
	const copy = queue;
	queue = [];
	try {
		await sendAnalyticsBatch(copy, opts);
	} catch (err) {
		const { reportError } = await import("@/reporting/errors");
		reportError(err, { where: "analytics:flush", batchSize: copy.length });
	}
}

function schedule() {
	if (timer) return;
	timer = window.setTimeout(() => {
		timer = undefined;
		void flush();
	}, INTERVAL * 1000) as unknown as number;
}

export function enqueue(ev: BaseEvent) {
	if (!ENABLED) return;
	queue.push(ev);
	if (queue.length >= BATCH) void flush();
	else schedule();
}

function flushOnUnload() {
	void flush({ unloading: true });
}
window.addEventListener("pagehide", flushOnUnload);
document.addEventListener("visibilitychange", () => {
	if (document.visibilityState === "hidden") flushOnUnload();
});
