export function reportError(err: unknown, meta?: Record<string, unknown>) {
	console.error("[reportError]", err, meta);
}
