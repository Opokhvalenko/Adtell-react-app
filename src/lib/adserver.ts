export function resolveAdserverEndpoint(custom?: string): string {
	if (custom) return custom;
	const fromEnv = (import.meta as ImportMeta).env?.VITE_ADSERVER_ENDPOINT as
		| string
		| undefined;
	if (fromEnv) return fromEnv;
	if (window.__ads?.endpoint) return window.__ads.endpoint;
	return "";
}
