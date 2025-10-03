export type EventName =
	| "pageLoad"
	| "adModuleLoad"
	| "auctionInit"
	| "auctionEnd"
	| "bidRequested"
	| "bidResponse"
	| "bidWon";

export interface BaseEvent {
	event: EventName;
	ts: number;
	page: string;
	ref?: string;
	sid: string;
	uid?: string;
	data?: unknown;
}

export interface AuctionInitData {
	auctionId: string;
	adUnits: Array<{ code: string; sizes?: number[][] }>;
}

export interface BidRequestedData {
	auctionId?: string;
	bidder: string;
	adUnitCode: string;
	sizes?: number[][];
}

export interface BidResponseData {
	auctionId?: string;
	bidder: string;
	adUnitCode: string;
	cpm?: number;
	cur?: string;
	creativeId?: string | number;
	w?: number;
	h?: number;
	timeToRespond?: number;
	adomain?: string[];
}

export interface BidWonData {
	auctionId?: string;
	bidder: string;
	adUnitCode: string;
	cpm?: number;
	cur?: string;
	creativeId?: string | number;
}
