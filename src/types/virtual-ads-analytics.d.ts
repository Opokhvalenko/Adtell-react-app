declare module "virtual:ads-analytics" {
	export type AnalyticsInitOptions = {
		enabled?: boolean;
		context?: Record<string, unknown>;
	};
	export function initAnalytics(
		options?: AnalyticsInitOptions,
	): void | Promise<void>;
}

declare module "virtual:ads-module" {
	export function initAds(): Promise<void> | void;
	export function requestAndDisplay(adUnits?: unknown): Promise<void> | void;
	export function refreshAds(codes?: string[]): Promise<void> | void;
}

declare module "virtual:ads-config" {
	export const ENABLE_REPORTING: boolean;
	export const ADS_MODE: "prebid" | "google" | string;
}
