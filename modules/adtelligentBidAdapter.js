(() => {
	const BIDDER_CODE = "adtelligent";

	function creative(adUnitCode, [w, h]) {
		return `
      <div style="width:${w}px;height:${h}px;background:linear-gradient(135deg,#3b82f6 0%,#8b5cf6 100%);
        border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;
        color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;box-shadow:0 4px 12px rgba(59,130,246,.3);
        position:relative;overflow:hidden">
        <div style="font-weight:700">🧠 Adtelligent Smart</div>
        <div style="font-size:12px;opacity:.9">AI-Powered Advertising</div>
        <div style="position:absolute;right:8px;bottom:8px;font-size:10px;opacity:.7">${w}×${h} • ${adUnitCode}</div>
      </div>`;
	}

	const spec = {
		code: BIDDER_CODE,
		supportedMediaTypes: ["banner"],
		isBidRequestValid(bid) {
			return !!bid?.adUnitCode;
		},
		buildRequests(validBidRequests, bidderRequest) {
			const pb = window.pbjs;
			validBidRequests.forEach((bid) => {
				const size = bid.mediaTypes?.banner?.sizes?.[0] ||
					bid.sizes?.[0] || [300, 250];
				const mock = {
					requestId: bid.bidId,
					bidder: BIDDER_CODE,
					cpm: Number((2 + Math.random() * 4).toFixed(2)),
					width: size[0],
					height: size[1],
					creativeId: `adt_${Date.now()}`,
					currency: "USD",
					netRevenue: true,
					ttl: 300,
					ad: creative(bid.adUnitCode, size),
					meta: { advertiserDomains: ["adtelligent.com"] },
					adUnitCode: bid.adUnitCode,
					auctionId: bidderRequest?.auctionId,
				};
				try {
					pb?.addBidResponse?.(bid.adUnitCode, mock);
				} catch {}
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

	function register() {
		const pb = window.pbjs;
		if (pb?.registerBidder) {
			pb.que = pb.que || [];
			pb.que.push(() => {
				try {
					pb.registerBidder(spec);
				} catch {}
			});
		} else setTimeout(register, 50);
	}
	register();

	window.adtelligentAdapter = spec;
})();
