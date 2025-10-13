const BIDDER = "pokhvalenko";
const G = globalThis;

function endpointBase() {
	const ep = G.__ads?.endpoint?.replace?.(/\/$/, "");
	try {
		return ep ? new URL(ep) : new URL("/", location.origin);
	} catch {
		return new URL("http://localhost:3000");
	}
}

export const spec = {
	code: BIDDER,
	supportedMediaTypes: ["banner"],

	// biome підказка: optional chaining
	isBidRequestValid(bid) {
		return !!(bid?.params && Number(bid.params.aid));
	},

	buildRequests(bidRequests, bidderRequest) {
		const url = new URL("/api/bid", endpointBase());
		const payload = {
			auctionId: bidderRequest?.auctionId,
			referer: bidderRequest?.refererInfo?.page,
			bids: bidRequests.map((b) => ({
				bidId: b.bidId,
				adUnitCode: b.adUnitCode,
				params: b.params,
				sizes: b.mediaTypes?.banner?.sizes || b.sizes || [],
			})),
		};
		return {
			method: "POST",
			url: url.toString(),
			data: JSON.stringify(payload),
			options: { contentType: "application/json" },
		};
	},

	interpretResponse(serverResponse) {
		const body = serverResponse?.body;
		if (!Array.isArray(body)) return [];
		return body.map((r) => ({
			requestId: r.bidId,
			cpm: r.cpm,
			width: r.w,
			height: r.h,
			ad: r.adm,
			currency: r.cur || "USD",
			ttl: r.ttl || 300,
			netRevenue: true,
			meta: { advertiserDomains: r.adomain || [] },
		}));
	},

	getUserSyncs() {
		return [];
	},
};

export default spec;
