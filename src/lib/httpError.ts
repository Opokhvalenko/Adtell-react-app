export function toMessage(err: unknown, fallback = "Request failed") {
	if (err instanceof Error) return err.message;
	if (typeof err === "string") return err;
	try {
		if (typeof err === "object" && err && "message" in err) {
			const m = (err as Record<string, unknown>).message;
			if (typeof m === "string" && m.trim()) return m;
		}
	} catch {}
	return fallback;
}
