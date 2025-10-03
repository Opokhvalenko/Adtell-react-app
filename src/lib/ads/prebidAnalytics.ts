import type {
	AuctionInitData,
	BidRequestedData,
	BidResponseData,
	BidWonData,
} from "../analytics/events";
import { report } from "../analytics/reporter";

// ---- minimal pbjs typings ----
type Size = [number, number];

interface PbAdUnit {
	code?: string;
	mediaTypes?: { banner?: { sizes?: Size[] } };
	sizes?: Size[];
}

interface PbAuctionInit {
	auctionId?: string;
	adUnits?: PbAdUnit[];
}
interface PbAuctionEnd {
	auctionId?: string;
}
interface PbBidRequested {
	auctionId?: string;
	bidder?: string;
	bidderCode?: string;
	adUnitCode?: string;
	sizes?: Size[];
	mediaTypes?: { banner?: { sizes?: Size[] } };
}
interface PbBidResponse {
	auctionId?: string;
	bidder?: string;
	bidderCode?: string;
	adUnitCode?: string;
	cpm?: number;
	currency?: string;
	cur?: string;
	creativeId?: string | number;
	width?: number;
	w?: number;
	height?: number;
	h?: number;
	timeToRespond?: number;
	meta?: { advertiserDomains?: string[] };
	adomain?: string[];
}
type PbBidWon = PbBidResponse;

type PbEventName =
	| "auctionInit"
	| "auctionEnd"
	| "bidRequested"
	| "bidResponse"
	| "bidWon";
type PbEventMap = {
	auctionInit: PbAuctionInit;
	auctionEnd: PbAuctionEnd;
	bidRequested: PbBidRequested;
	bidResponse: PbBidResponse;
	bidWon: PbBidWon;
};

interface Pbjs {
	version?: string;
	onEvent?<K extends PbEventName>(
		name: K,
		cb: (p: PbEventMap[K]) => void,
	): void;
	que?: Array<() => void>;
}

function isPbjs(v: unknown): v is Required<Pick<Pbjs, "onEvent">> & Pbjs {
	return !!v && typeof (v as Record<string, unknown>).onEvent === "function";
}

// ---- pickers ----
const pickAuctionInit = (p: PbAuctionInit): AuctionInitData => ({
	auctionId: String(p?.auctionId ?? ""),
	adUnits: (p?.adUnits ?? []).map((u) => ({
		code: String(u?.code ?? ""),
		sizes: u?.mediaTypes?.banner?.sizes ?? u?.sizes ?? undefined,
	})),
});

const pickBidRequested = (p: PbBidRequested): BidRequestedData => ({
	auctionId: p?.auctionId,
	bidder: String(p?.bidder ?? p?.bidderCode ?? ""),
	adUnitCode: String(p?.adUnitCode ?? ""),
	sizes: p?.sizes ?? p?.mediaTypes?.banner?.sizes ?? undefined,
});

const pickBidResponse = (p: PbBidResponse): BidResponseData => ({
	auctionId: p?.auctionId,
	bidder: String(p?.bidder ?? p?.bidderCode ?? ""),
	adUnitCode: String(p?.adUnitCode ?? ""),
	cpm: typeof p?.cpm === "number" ? p.cpm : undefined,
	cur: p?.currency || p?.cur,
	creativeId: p?.creativeId,
	w: p?.width ?? p?.w,
	h: p?.height ?? p?.h,
	timeToRespond: p?.timeToRespond,
	adomain: p?.meta?.advertiserDomains ?? p?.adomain,
});

const pickBidWon = (p: PbBidWon): BidWonData => ({
	auctionId: p?.auctionId,
	bidder: String(p?.bidder ?? p?.bidderCode ?? ""),
	adUnitCode: String(p?.adUnitCode ?? ""),
	cpm: typeof p?.cpm === "number" ? p.cpm : undefined,
	cur: p?.currency || p?.cur,
	creativeId: p?.creativeId,
});

// ---- main ----
export function attachPrebidAnalytics() {
	const win = window as unknown as { pbjs?: Partial<Pbjs> };

	const ready = () => {
		const pb = win.pbjs;
		if (!isPbjs(pb)) return;

		report("adModuleLoad", { module: "prebid", version: pb.version });

		pb.onEvent?.("auctionInit", (p) =>
			report("auctionInit", pickAuctionInit(p)),
		);
		pb.onEvent?.("auctionEnd", (p) =>
			report("auctionEnd", { auctionId: p?.auctionId }),
		);
		pb.onEvent?.("bidRequested", (p) =>
			report("bidRequested", pickBidRequested(p)),
		);
		pb.onEvent?.("bidResponse", (p) =>
			report("bidResponse", pickBidResponse(p)),
		);
		pb.onEvent?.("bidWon", (p) => report("bidWon", pickBidWon(p)));
	};

	if (isPbjs(win.pbjs)) {
		ready();
	} else {
		const obj: Partial<Pbjs> = win.pbjs ?? {};
		obj.que = obj.que ?? [];
		obj.que.push(ready);
		win.pbjs = obj;
	}
}
