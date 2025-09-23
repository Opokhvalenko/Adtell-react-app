export function reportError(err: unknown, extra?: Record<string, unknown>) {
	console.error("[report]", err, extra);
}
