export {};

declare global {
	// базові типи
	type AdSlotType = "inline" | "banner" | "sidebar";
	type SizeTuple = readonly [number, number];
	type SizeStr = `${number}x${number}`;

	interface AdsRegistryItem {
		sizes: SizeTuple[];
		type?: AdSlotType;
	}

	// подія у дебаг-лог
	type AdsEvt = {
		ts?: number;
		id?: string;
		slot?: string;
		adUnitCode?: string;
		adapter?: string;
		bidder?: string;
		event?: string;
		message?: string;
		[key: string]: unknown;
	};

	/** ЄДИНИЙ інтерфейс для window.__ads */
	interface AdsModule {
		uid?: string;
		registry?: Record<string, AdsRegistryItem>; // ← додано

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

	interface Window {
		__ads?: AdsModule;
		__adslog?: AdsEvt[];

		pbjs?: unknown;
		googletag?: unknown;

		requestIdleCallback?(
			cb: (d: { didTimeout: boolean; timeRemaining: () => number }) => void,
			opts?: { timeout?: number },
		): number;
		cancelIdleCallback?(id: number): void;
	}

	/** build-часова константа (vite define) */
	const __BUILD_TIME__: string;
}
