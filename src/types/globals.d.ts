declare global {
	const __BUILD_TIME__: string;

	interface Window {
		pbjs?: unknown;
		googletag?: unknown;
		__adslog?: Array<{ ts: number; type: string; payload: unknown }>;
		__ads?: {
			uid?: string;
			endpoint?: string;
		};
	}
}
export {};
