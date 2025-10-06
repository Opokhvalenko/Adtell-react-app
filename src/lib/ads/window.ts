export type AdKind = "banner" | "sidebar" | "inline";

export interface AdsRegistryItem {
	sizes: number[][];
	type: AdKind;
}

export interface AdsModule {
	uid?: string;
	registry?: Record<string, AdsRegistryItem>;
	initAds?: () => Promise<void> | void;
	requestAndDisplay?: () => Promise<void> | void;
	refreshAds?: () => Promise<void> | void;
	unmount?: (domId: string) => void;
}

declare global {
	interface Window {
		__ads?: AdsModule;
	}
}

export function getAdsModule(): AdsModule | undefined {
	return window.__ads;
}

export function setAdsModule(mod: AdsModule): void {
	window.__ads = mod;
}

export function ensureAdsModule(): AdsModule {
	if (!window.__ads) window.__ads = {};
	return window.__ads;
}
