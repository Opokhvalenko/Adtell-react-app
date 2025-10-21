export type AdSlotType = "inline" | "banner" | "sidebar";
export type SizeTuple = readonly [number, number];
export type SizeStr = `${number}x${number}`;

export interface AdsRegistryItem {
	sizes: SizeTuple[];
	type?: AdSlotType;
}

export interface AdsModule {
	uid?: string;
	registry?: Record<string, AdsRegistryItem>;

	initAds?: () => void | Promise<void>;
	requestAndDisplay?: (adUnits?: unknown) => void | Promise<void>;
	refreshAds?: (codes?: string[]) => void | Promise<void>;
	mount?: (
		id: string,
		sizes: Array<SizeTuple | SizeStr>,
		type: AdSlotType,
		el: HTMLElement,
	) => void | Promise<void>;
	unmount?: (id: string) => void | Promise<void>;
}

declare global {
	interface Window {
		__ads?: AdsModule;
	}
}

export function getAdsModule(): AdsModule | undefined {
	if (typeof window === "undefined") return undefined;
	return window.__ads;
}

export function setAdsModule(mod: AdsModule | undefined): void {
	if (typeof window === "undefined") return;
	window.__ads = mod;
}

export async function ensureAdsModule(): Promise<AdsModule | undefined> {
	if (typeof window === "undefined") return undefined;
	if (window.__ads) return window.__ads;

	try {
		const mod = await import("virtual:ads-module");
		await mod.initAds?.();
	} catch {
		// ignore
	}

	if (!window.__ads) {
		window.__ads = { registry: {} };
	}
	return window.__ads;
}
