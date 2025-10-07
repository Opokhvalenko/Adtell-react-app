// House-bidder без мережі: формує ставку локально через pbjs.addBidResponse().

(() => {
	const CODE = "beautifulAd";

	function pickFirstSize(bid) {
		const s = bid?.mediaTypes?.banner?.sizes?.[0] ||
			(Array.isArray(bid?.sizes) && bid.sizes[0]) || [300, 250];
		const [w, h] = Array.isArray(s) && Array.isArray(s[0]) ? s[0] : s;
		return [Number(w || 300), Number(h || 250)];
	}

	function creative(adUnitCode, w, h) {
		const isTop = adUnitCode === "ad-top";
		const themes = [
			{
				name: "Premium Tech",
				gradient: "linear-gradient(135deg,#667eea 0%,#764ba2 100%)",
				text: "#fff",
				icon: "🚀",
				bg: 'url("data:image/svg+xml,<svg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 100 100%27><defs><pattern id=%27t%27 width=%2720%27 height=%2720%27 patternUnits=%27userSpaceOnUse%27><circle cx=%2710%27 cy=%2710%27 r=%271%27 fill=%27white%27 opacity=%270.1%27/><rect x=%275%27 y=%275%27 width=%272%27 height=%272%27 fill=%27white%27 opacity=%270.05%27/></pattern></defs><rect width=%27100%27 height=%27100%27 fill=%27url(%23t)%27/></svg>")',
			},
			{
				name: "Ocean Premium",
				gradient: "linear-gradient(135deg,#74b9ff 0%,#0984e3 100%)",
				text: "#fff",
				icon: "🌊",
				bg: 'url("data:image/svg+xml,<svg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 100 100%27><defs><pattern id=%27w%27 width=%2730%27 height=%2730%27 patternUnits=%27userSpaceOnUse%27><path d=%27M0,15 Q15,5 30,15 T60,15%27 stroke=%27white%27 stroke-width=%271%27 fill=%27none%27 opacity=%270.1%27/></pattern></defs><rect width=%27100%27 height=%27100%27 fill=%27url(%23w)%27/></svg>")',
			},
			{
				name: "Sunset Luxury",
				gradient: "linear-gradient(135deg,#fd79a8 0%,#fdcb6e 100%)",
				text: "#fff",
				icon: "🌅",
				bg: 'url("data:image/svg+xml,<svg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 100 100%27><defs><pattern id=%27s%27 width=%2725%27 height=%2725%27 patternUnits=%27userSpaceOnUse%27><circle cx=%2712.5%27 cy=%2712.5%27 r=%273%27 fill=%27white%27 opacity=%270.1%27/><circle cx=%276%27 cy=%276%27 r=%271%27 fill=%27white%27 opacity=%270.05%27/></pattern></defs><rect width=%27100%27 height=%27100%27 fill=%27url(%23s)%27/></svg>")',
			},
			{
				name: "Nature Elite",
				gradient: "linear-gradient(135deg,#00b894 0%,#00cec9 100%)",
				text: "#fff",
				icon: "🌲",
				bg: 'url("data:image/svg+xml,<svg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 100 100%27><defs><pattern id=%27n%27 width=%2740%27 height=%2740%27 patternUnits=%27userSpaceOnUse%27><path d=%27M20,35 L20,25 L15,30 L25,30 Z%27 fill=%27white%27 opacity=%270.1%27/><circle cx=%2720%27 cy=%2720%27 r=%272%27 fill=%27white%27 opacity=%270.05%27/></pattern></defs><rect width=%27100%27 height=%27100%27 fill=%27url(%23n)%27/></svg>")',
			},
			{
				name: "Royal Purple",
				gradient: "linear-gradient(135deg,#a29bfe 0%,#6c5ce7 100%)",
				text: "#fff",
				icon: "👑",
				bg: 'url("data:image/svg+xml,<svg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 100 100%27><defs><pattern id=%27r%27 width=%2735%27 height=%2735%27 patternUnits=%27userSpaceOnUse%27><circle cx=%2717.5%27 cy=%2717.5%27 r=%274%27 fill=%27white%27 opacity=%270.1%27/><circle cx=%2717.5%27 cy=%2717.5%27 r=%271%27 fill=%27white%27 opacity=%270.05%27/></pattern></defs><rect width=%27100%27 height=%27100%27 fill=%27url(%23r)%27/></svg>")',
			},
		];
		const t = themes[Math.floor(Math.random() * themes.length)];
		return `
      <div style="width:${w}px;height:${h}px;background:${t.gradient};
        border-radius:16px;display:flex;flex-direction:column;justify-content:center;align-items:center;
        color:${t.text};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
        box-shadow:0 12px 40px rgba(0,0,0,.15);position:relative;overflow:hidden;border:2px solid rgba(255,255,255,.1);cursor:pointer">
        <div style="position:absolute;inset:0;background:${t.bg};opacity:.4;pointer-events:none"></div>
        <div style="position:absolute;inset:0;background:linear-gradient(45deg,rgba(255,255,255,.15) 0%,rgba(255,255,255,.05) 50%,rgba(0,0,0,.05) 100%)"></div>
        <div style="width:${isTop ? "60px" : "50px"};height:${isTop ? "60px" : "50px"};background:rgba(255,255,255,.2);border-radius:50%;
             display:flex;align-items:center;justify-content:center;margin-bottom:12px;border:2px solid rgba(255,255,255,.3)">
          <div style="font-size:${isTop ? "28px" : "24px"}">${t.icon}</div>
        </div>
        <div style="font-size:${isTop ? "20px" : "16px"};font-weight:700;margin-bottom:6px">${t.name}</div>
        <div style="font-size:${isTop ? "14px" : "12px"};opacity:.9;font-weight:500;margin-bottom:8px">Преміум реклама • Ексклюзивний контент</div>
        <div style="background:rgba(255,255,255,.25);padding:8px 16px;border-radius:20px;font-size:${isTop ? "12px" : "10px"};border:1px solid rgba(255,255,255,.4)">Дізнатися більше →</div>
        <div style="position:absolute;bottom:8px;right:8px;font-size:9px;opacity:.7;background:rgba(0,0,0,.3);padding:3px 6px;border-radius:6px">${w}×${h}</div>
      </div>`;
	}

	const adapter = {
		code: CODE,
		aliases: [CODE],
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
				const cpm = Number((0.8 + Math.random() * 1.2).toFixed(2)); // 0.8–2.0

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

				try {
					pb?.addBidResponse?.(adUnitCode, resp);
				} catch (e) {
					console.warn("[beautifulAd] addBidResponse failed", e);
				}
			});
			return []; // без мережі
		},

		interpretResponse() {
			return [];
		},
		getUserSyncs() {
			return [];
		},
		onBidWon() {},
		onTimeout() {},
		onError() {},
	};

	// Екпортуємо в глобал; реєструвати буде prebid.auction.js
	window.__beautifulAdAdapter = adapter;
	try {
		if (typeof module !== "undefined") module.exports = adapter;
	} catch (_) {}
})();
