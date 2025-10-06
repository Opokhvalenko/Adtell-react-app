(() => {
	const code = "customAdServer";

	function toQuery(obj) {
		const enc = encodeURIComponent;
		return Object.keys(obj)
			.filter((k) => obj[k] !== undefined && obj[k] !== null)
			.map(
				(k) =>
					`${enc(k)}=${enc(typeof obj[k] === "object" ? JSON.stringify(obj[k]) : obj[k])}`,
			)
			.join("&");
	}

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

	const adapter = {
		code,
		supportedMediaTypes: ["banner"],

		isBidRequestValid(bid) {
			return !!bid?.code || !!bid?.adUnitCode;
		},

		buildRequests(validBidRequests, bidderRequest) {
			return validBidRequests.map((bid) => {
				const size = bid.mediaTypes?.banner?.sizes?.[0] ||
					bid.sizes?.[0] || [300, 250];
				const [width, height] = size;

				const offline = genHouse(bid.adUnitCode || bid.code, width, height);

				const query = toQuery({
					adUnitCode: bid.adUnitCode || bid.code,
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

			const size = bid.mediaTypes?.banner?.sizes?.[0] ||
				bid.sizes?.[0] || [300, 250];
			const [w, h] = size;

			if (!body || !body.adm) {
				const { adm, cpm } = genHouse(bid.adUnitCode || bid.code, w, h);
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

		onBidWon(bid) {
			window.dispatchEvent(
				new CustomEvent("ads:prebid", {
					detail: {
						ts: Date.now(),
						type: "bidWon",
						payload: {
							adapter: code,
							adUnitCode: bid?.adUnitCode,
							cpm: bid?.cpm,
						},
					},
				}),
			);
		},

		onTimeout() {},
		onError() {},
	};

	if (window?.pbjs?.registerBidder) {
		window.pbjs.registerBidder(adapter);
	}
	window.customAdServerAdapter = adapter;
})();
