declare module "virtual:ads-module" {
	/** запускає інжект контейнерів + prebid + перший аукціон */
	export function initAds(): Promise<void> | void;
	/** робить запит ставок і одразу рендерить (direct або через GAM) */
	export function requestAndDisplay(adUnits?: unknown): Promise<void> | void;
	/** перезапит ставок для вказаних кодів (або всіх) */
	export function refreshAds(codes?: string[]): Promise<void> | void;
}
