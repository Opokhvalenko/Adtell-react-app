const pokhvalenkoBidAdapter = {
	code: "pokhvalenko",
	supportedMediaTypes: ["banner"],

	isBidRequestValid(bid) {
		return !!bid?.mediaTypes?.banner && Number(bid?.params?.aid) > 0;
	},

	buildRequests(validBidRequests, bidderRequest) {
		return validBidRequests.map((bid) => {
			const size = bid.mediaTypes?.banner?.sizes?.[0] ||
				bid.sizes?.[0] || [300, 250];
			const [w, h] = size;
			const url =
				`${location.origin}/api/pokh/bid?w=${w}&h=${h}&aid=${encodeURIComponent(bid.params.aid)}` +
				`&bidId=${encodeURIComponent(bid.bidId)}&auctionId=${encodeURIComponent(bidderRequest?.auctionId || "")}`;
			return { method: "GET", url, bidRequest: bid };
		});
	},

	interpretResponse(serverResponse, request) {
		const bid = request.bidRequest;
		const [w, h] = bid.mediaTypes?.banner?.sizes?.[0] ||
			bid.sizes?.[0] || [300, 250];
		const cpm = Number(serverResponse?.body?.cpm) || 0.6;
		const adm =
			serverResponse?.body?.adm ||
			`
      <div style="width:${w}px;height:${h}px;display:flex;align-items:center;justify-content:center;
        background:linear-gradient(135deg,#4b2c5e,#7f5aa6);color:#fff;border-radius:14px;
        font:600 14px/1.2 system-ui,Segoe UI,Inter,Roboto;">
        Custom / Pokhvalenko ${w}×${h} • $${cpm.toFixed(2)} CPM
        <a href="#" target="_blank" style="position:absolute;inset:0"></a>
      </div>`;

		return [
			{
				requestId: bid.bidId,
				cpm,
				width: w,
				height: h,
				ad: adm,
				ttl: 300,
				creativeId: `pokh_${Date.now()}`,
				netRevenue: true,
				currency: "USD",
				meta: { advertiserDomains: ["demo-custom.local"] },
			},
		];
	},
};

export { pokhvalenkoBidAdapter };
export default pokhvalenkoBidAdapter;
if (typeof window !== "undefined")
	window.pokhvalenkoAdapter = pokhvalenkoBidAdapter;
