declare module "virtual:ads-module" {
	export function initAds(): Promise<void> | void;
	export function requestAndDisplay(adUnits?: unknown): Promise<void> | void;
	export function refreshAds(codes?: string[]): Promise<void> | void;
	export function mount(
		id: string,
		sizes: Array<SizeTuple | SizeStr>,
		type: AdSlotType,
		el: Element,
	): void | Promise<void>;
	export function unmount(id: string): void | Promise<void>;
}

declare module "virtual:ads-bridge" {
	const x: undefined;
	export default x;
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
