(() => {
	const CODE = "beautifulAd";

	function pickFirstSize(bid) {
		const s = bid?.mediaTypes?.banner?.sizes?.[0] ||
			(Array.isArray(bid?.sizes) && bid.sizes[0]) || [300, 250];
		const [w, h] = Array.isArray(s) && Array.isArray(s[0]) ? s[0] : s;
		return [Number(w || 300), Number(h || 250)];
	}

	function creative(_adUnitCode, _w, _h) {
		return `...`;
	}

	const adapter = {
		code: CODE,
		supportedMediaTypes: ["banner"],
		isBidRequestValid(bid) {
			return !!(bid?.params?.adUnitCode || bid?.adUnitCode || bid?.code);
		},
		buildRequests(validBidRequests, bidderRequest) {
			const pb = window.pbjs;
			validBidRequests.forEach((bid) => {
				const adUnitCode =
					bid?.params?.adUnitCode ||
					bid?.adUnitCode ||
					bid?.code ||
					"ad-unknown";
				const [w, h] = pickFirstSize(bid);
				const cpm = Number((0.8 + Math.random() * 1.2).toFixed(2));
				const resp = {
					requestId: bid.bidId,
					bidder: CODE,
					cpm,
					width: w,
					height: h,
					creativeId: `beautiful_${Date.now()}`,
					currency: "USD",
					netRevenue: true,
					ttl: 300,
					ad: creative(adUnitCode, w, h),
					meta: {
						advertiserDomains: ["beautiful-ads.local"],
						mediaType: "banner",
					},
					adUnitCode,
					auctionId: bidderRequest?.auctionId,
					transactionId: bid?.transactionId,
				};
				pb?.addBidResponse?.(adUnitCode, resp);
			});
			return [];
		},
		interpretResponse() {
			return [];
		},
		getUserSyncs() {
			return [];
		},
	};

	const TheModule = globalThis?.module;
	if (TheModule?.exports) {
		TheModule.exports = { beautifulAdAdapter: adapter, default: adapter };
	} else if (typeof window !== "undefined") {
		window.__beautifulAdAdapter = adapter;
	}
})();
