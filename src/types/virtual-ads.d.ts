declare module "virtual:ads-analytics" {
	export function initAnalytics(options?: {
		enabled?: boolean;
		context?: Record<string, unknown>;
	}): void;
}
declare module "virtual:ads-module" {
	export function initAds(): Promise<void> | void;
	export function requestAndDisplay(adUnits?: unknown): Promise<void> | void;
	export function refreshAds(codes?: string[]): Promise<void> | void;
}
