type Size = [number, number];

type MountFn = (
	domId: string,
	sizes?: Array<string | Size> | Size[],
	type?: string,
	el?: HTMLElement,
) => void;

declare global {
	interface Window {
		__ads?: {
			initAds?: () => Promise<void> | void;
			requestAndDisplay?: (adUnits?: unknown) => Promise<void> | void;
			refreshAds?: (codes?: string[]) => Promise<void> | void;
			mount?: MountFn;
			unmount?: (domId: string) => Promise<void> | void;

			uid?: string;
			geo?: string;
			rendered?: Record<string, boolean>;
			registry?: Record<string, { sizes?: Size[]; type?: string }>;
			config?: Record<string, unknown>;
			pbjsLoading?: boolean;
		};
	}
}

declare module "virtual:ads-module" {
	export function initAds(): Promise<void> | void;
	export function requestAndDisplay(adUnits?: unknown): Promise<void> | void;
	export function refreshAds(codes?: string[]): Promise<void> | void;

	// export function unmount(domId: string): Promise<void> | void;
}
declare module "virtual:ads-analytics" {
	export type AnalyticsContext = Record<string, unknown>;
	export interface InitAnalyticsOptions {
		enabled?: boolean;
		context?: AnalyticsContext;
		flushOnUnload?: boolean;
	}
	export function initAnalytics(
		options?: InitAnalyticsOptions,
	): void | Promise<void>;
	export function track(event: string, payload?: Record<string, unknown>): void;
}

declare module "virtual:ads-module" {
	export function initAds(): Promise<void> | void;
	export function requestAndDisplay(adUnits?: unknown): Promise<void> | void;
	export function refreshAds(codes?: string[]): Promise<void> | void;
	export function unmount(domId: string): void | Promise<void>;
}

declare module "virtual:ads-config" {
	export const ADS_DEBUG: boolean;
	export const ENABLE_GAM: boolean;
	export const GAM_NETWORK_CALLS: boolean;
	export const ENABLE_BIDMATIC: boolean;
	export const BIDMATIC_SOURCE: number;
	export const BIDMATIC_SPN: string;
	export const ENABLE_REPORTING: boolean;
	export const REPORTING_URL: string;
	export const REPORTING_BATCH: number;
	export const REPORTING_INTERVAL: number;
}

declare module "virtual:ads-bridge" {
	const noop: undefined;
	export default noop;
}
