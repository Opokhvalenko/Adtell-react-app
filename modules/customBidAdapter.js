import { adUnitCodeOf, pickSizeFromBid, toQuery } from "./adapter.utils.js";

const CODE = "customAdServer";

function genHouse(_adUnitCode, width, height) {
	const cpm = +(0.3 + Math.random() * 0.5).toFixed(2);
	const adm = `
    <div style="width:${width}px;height:${height}px;background:linear-gradient(135deg,#222 0%,#555 100%);
      color:#fff;display:flex;align-items:center;justify-content:center;border-radius:14px;font:600 14px/1.3 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
      position:relative;overflow:hidden;box-shadow:0 8px 26px rgba(0,0,0,.2)">
      <div style="position:absolute;inset:0;opacity:.1;background-image:
        radial-gradient(120px 60px at 30% 30%,#fff,transparent 60%),
        radial-gradient(140px 70px at 70% 70%,#fff,transparent 60%)"></div>
      <div style="z-index:1;text-align:center">
        <div style="font-size:18px;margin-bottom:6px">🏠 House Ad</div>
        <div style="opacity:.9">Your Promotion Here</div>
        <div style="opacity:.8;font-size:12px;margin-top:8px;background:rgba(255,255,255,.14);padding:6px 10px;border-radius:18px">
          ${width}×${height} • CPM $${cpm}
        </div>
      </div>
      <a href="#" target="_blank" style="position:absolute;inset:0"></a>
    </div>`;
	return { adm, cpm, width, height };
}

export const spec = {
	code: CODE,
	supportedMediaTypes: ["banner"],

	isBidRequestValid(bid) {
		return !!(bid?.code || bid?.adUnitCode);
	},

	buildRequests(validBidRequests, bidderRequest) {
		return validBidRequests.map((bid) => {
			const [width, height] = pickSizeFromBid(bid);
			const offline = genHouse(adUnitCodeOf(bid), width, height);
			const query = toQuery({
				adUnitCode: adUnitCodeOf(bid),
				width,
				height,
				bidId: bid.bidId,
				auctionId: bidderRequest?.auctionId,
				offline,
			});
			return {
				method: "GET",
				url: `${location.origin}/api/adserver/bid?${query}`,
				bidRequest: bid,
			};
		});
	},

	interpretResponse(serverResponse, request) {
		const bid = request.bidRequest;
		const body = serverResponse?.body;
		const [w, h] = pickSizeFromBid(bid);

		if (!body || !body.adm) {
			const { adm, cpm } = genHouse(adUnitCodeOf(bid), w, h);
			return [
				{
					requestId: bid.bidId,
					cpm,
					width: w,
					height: h,
					ad: adm,
					ttl: 300,
					creativeId: `house_${Date.now()}`,
					netRevenue: true,
					currency: "USD",
					meta: { advertiserDomains: ["house.local"] },
				},
			];
		}

		return [
			{
				requestId: bid.bidId,
				cpm: Number(body.cpm || 0.4),
				width: Number(body.w || w),
				height: Number(body.h || h),
				ad: body.adm,
				ttl: Number(body.ttl || 300),
				creativeId: String(body.creativeId || `house_${Date.now()}`),
				netRevenue: true,
				currency: String(body.cur || "USD"),
				meta: {
					advertiserDomains: Array.isArray(body.adomain)
						? body.adomain
						: ["house.local"],
				},
			},
		];
	},
};

export default spec;
