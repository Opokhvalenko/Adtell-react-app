declare module "virtual:ads-config" {
	export const ENABLE_PREBID: boolean;
	export const ENABLE_GAM: boolean;
	export const GAM_NETWORK_CALLS: boolean;
	export const ADS_DEBUG: boolean;

	export const ENABLE_BIDMATIC: boolean;
	export const BIDMATIC_SOURCE: number;
	export const BIDMATIC_SPN: string;

	export const ENABLE_ADTELLIGENT: boolean;
	export const ADTELLIGENT_AID: number;

	export const ENABLE_REPORTING: boolean;
}
