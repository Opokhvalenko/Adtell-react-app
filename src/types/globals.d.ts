export {};

declare global {
	type AdSlotType = "inline" | "banner" | "sidebar";
	type SizeTuple = readonly [number, number];
	type SizeStr = `${number}x${number}`;

	interface AdsRegistryItem {
		sizes: SizeTuple[];
		type?: AdSlotType;
	}

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

	interface AdsModule {
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

	interface Window {
		__ads?: AdsModule;
		__adslog?: AdsEvt[];
		__THEME_BOOT__?: { saved: Theme; wantDark: boolean };

		pbjs?: unknown;
		googletag?: unknown;

		requestIdleCallback?(
			cb: (d: { didTimeout: boolean; timeRemaining: () => number }) => void,
			opts?: { timeout?: number },
		): number;
		cancelIdleCallback?(id: number): void;
	}

	const __BUILD_TIME__: string;
}
