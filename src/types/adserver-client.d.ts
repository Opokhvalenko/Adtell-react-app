declare module "modules/adserver.client.js" {
	export type BidResponse = {
		lineItemId: string;
		cpm: number;
		w: number;
		h: number;
		adm: string;
		adomain: string[];
		ttl: number;
		cur: string;
	};

	export function requestBid(args: {
		size: `${number}x${number}`;
		type?: string;
		geo?: string;
		uid?: string;
		floor?: number;
		endpoint?: string;
	}): Promise<BidResponse | null>;

	export function renderBidInto(
		el: Element,
		bid: BidResponse,
		opts?: { endpoint?: string },
	): void;
}
