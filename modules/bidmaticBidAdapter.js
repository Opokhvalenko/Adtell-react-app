(() => {
	const code = "bidmatic";

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

	function genCreative(_adUnitCode, width, height, extras = {}) {
		const cpm = +(0.25 + Math.random() * 0.75).toFixed(2);
		const adm = `
      <div style="width:${width}px;height:${height}px;display:flex;align-items:center;justify-content:center;
        background:linear-gradient(135deg,#151a2b 0%,#283a6d 100%);border-radius:14px;color:#fff;font:600 14px/1.4 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
        position:relative;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,.22);border:2px solid rgba(255,255,255,.08)">
        <div style="position:absolute;inset:0;opacity:.08;background:
          radial-gradient(120px 120px at 0 0, #fff, transparent 60%),
          radial-gradient(160px 160px at 100% 100%, #fff, transparent 60%)"></div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px;z-index:1">
          <div style="font-size:20px">🧩 Bidmatic</div>
          <div style="opacity:.9">Programmatic Demo Creative</div>
          <div style="opacity:.8;font-size:12px;background:rgba(255,255,255,.12);padding:6px 10px;border-radius:20px">
            ${width}×${height} • CPM $${cpm}
          </div>
        </div>
        <a href="${extras.clickUrl || "#"}" target="_blank" style="position:absolute;inset:0"></a>
      </div>`;
		return { adm, cpm, width, height };
	}

	const adapter = {
		code,
		gvlid: 0,
		supportedMediaTypes: ["banner"],

		isBidRequestValid(bid) {
			return !!bid && !!bid.mediaTypes?.banner && (bid.params?.source || true);
		},

		buildRequests(validBidRequests, bidderRequest) {
			return validBidRequests.map((bid) => {
				const size = bid.mediaTypes?.banner?.sizes?.[0] ||
					bid.sizes?.[0] || [300, 250];
				const [width, height] = size;
				const offline = genCreative(
					bid.adUnitCode || bid.code,
					width,
					height,
					{},
				);

				const query = toQuery({
					source: bid.params?.source,
					spn: bid.params?.spn,
					width,
					height,
					bidId: bid.bidId,
					auctionId: bidderRequest?.auctionId,
					adUnitCode: bid.adUnitCode || bid.code,
					offline,
				});

				return {
					method: "GET",
					url: `${location.origin}/api/bidmatic/bid?${query}`,
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
				const { adm, cpm } = genCreative(bid.adUnitCode || bid.code, w, h, {});
				return [
					{
						requestId: bid.bidId,
						cpm,
						width: w,
						height: h,
						ad: adm,
						ttl: 300,
						creativeId: `bidmatic_${Date.now()}`,
						netRevenue: true,
						currency: "USD",
						meta: { advertiserDomains: ["demo-bidmatic.local"] },
					},
				];
			}

			return [
				{
					requestId: bid.bidId,
					cpm: Number(body.cpm || 0.6),
					width: Number(body.w || w),
					height: Number(body.h || h),
					ad: body.adm,
					ttl: Number(body.ttl || 300),
					creativeId: String(body.creativeId || `bidmatic_${Date.now()}`),
					netRevenue: true,
					currency: String(body.cur || "USD"),
					meta: {
						advertiserDomains: Array.isArray(body.adomain)
							? body.adomain
							: ["demo-bidmatic.local"],
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
	window.bidmaticAdapter = adapter;
})();
