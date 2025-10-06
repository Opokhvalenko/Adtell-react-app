declare module "virtual:ads-config" {
	export const ENABLE_PREBID: boolean;
	export const ENABLE_GAM: boolean;
	export const ADS_DEBUG: boolean;
	export const ENABLE_BIDMATIC: boolean;
	export const BIDMATIC_SOURCE: number;
	export const BIDMATIC_SPN: string;
	export const ENABLE_ADTELLIGENT: boolean;
	export const ADTELLIGENT_AID: number;
	export const GAM_NETWORK_CALLS: boolean;
	export const ENABLE_REPORTING: boolean;
}

declare module "virtual:ads-analytics" {
	export function initAnalytics(opts?: unknown): Promise<void> | void;
}

declare module "virtual:ads-module" {
	export function initAds(): Promise<void> | void;
	export function requestAndDisplay(): Promise<void> | void;
	export function refreshAds(): Promise<void> | void;
	export function mount(
		id: string,
		sizes: number[][],
		type: string,
		el: Element,
	): void;
	export function unmount(id: string): void;
}

declare module "virtual:ads-bridge" {
	const x: undefined;
	export default x;
}

declare module "virtual:build-info" {
	export const buildTime: string;
}
