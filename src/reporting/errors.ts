type Extra = Record<string, unknown>;

const LOG_ENDPOINT = import.meta.env.VITE_LOG_URL || "/api/report";

export function reportError(err: unknown, extra: Extra = {}): void {
	const payload =
		err instanceof Error
			? { name: err.name, message: err.message, stack: err.stack }
			: { name: "UnknownError", message: String(err) };

	console.error("[app:error]", { ...payload, ...extra });

	const body = JSON.stringify({
		...payload,
		...extra,
		ts: Date.now(),
		url: location.href,
	});

	try {
		if ("sendBeacon" in navigator) {
			navigator.sendBeacon(
				LOG_ENDPOINT,
				new Blob([body], { type: "application/json" }),
			);
			return;
		}
	} catch {
		/* fallthrough */
	}

	void fetch(LOG_ENDPOINT, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body,
		keepalive: true,
	}).catch(() => {});
}

export async function tryOrThrow<T>(
	label: string,
	fn: () => Promise<T>,
): Promise<T> {
	try {
		return await fn();
	} catch (err) {
		reportError(err, { where: label });
		throw err;
	}
}

export function trySyncOrThrow<T>(label: string, fn: () => T): T {
	try {
		return fn();
	} catch (err) {
		reportError(err, { where: label });
		throw err;
	}
}
