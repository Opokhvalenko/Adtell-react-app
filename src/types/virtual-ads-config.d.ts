declare module "virtual:ads-config" {
	export const ENABLE_PREBID: boolean;
	export const ENABLE_GAM: boolean;
	export const ADS_DEBUG: boolean;

	// для bidmatic
	export const ENABLE_BIDMATIC: boolean;
	export const BIDMATIC_SOURCE: number;
}
