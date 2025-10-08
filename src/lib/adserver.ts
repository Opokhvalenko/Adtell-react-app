type IM = ImportMeta & { env: Record<string, string | undefined> };

function strip(u: string) {
	return u.replace(/\/$/, "");
}

export function resolveAdserverEndpoint(custom?: string): string {
	if (custom) return strip(custom);

	const env = (import.meta as IM).env || {};
	const fromEnv =
		env.VITE_ADSERVER_URL || env.VITE_ADSERVER_ENDPOINT || env.VITE_API_URL;

	if (fromEnv) return strip(fromEnv);

	const w = window as unknown as { __ads?: { endpoint?: string } };
	if (w.__ads?.endpoint) return strip(w.__ads.endpoint);

	return "http://127.0.0.1:3000";
}
