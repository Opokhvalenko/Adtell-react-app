type AdsModule = NonNullable<Window["__ads"]>;

export function getAdsModule(): AdsModule | undefined {
	return window.__ads;
}

export function setAdsModule(mod: AdsModule): void {
	window.__ads = mod;
}

export function ensureAdsModule(): AdsModule {
	if (!window.__ads) {
		window.__ads = {} as AdsModule;
	}
	return window.__ads;
}
