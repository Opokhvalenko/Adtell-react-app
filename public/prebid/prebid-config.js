window.pbjs = window.pbjs || { que: [] };
window.googletag = window.googletag || { cmd: [] };

pbjs.que.push(() => {
	pbjs.setConfig({
		consentManagement: {
			gdpr: {
				cmpApi: "tcfv2",
				timeout: 8000,
				allowAuctionWithoutConsent: false,
			},
			usp: { cmpApi: "usp", timeout: 8000 }, 
		},
		bidderTimeout: 1200,
		enableTIDs: true,
	});

	const adUnits = [
		{
			code: "ad-slot-1",
			mediaTypes: {
				banner: {
					sizes: [
						[300, 250],
						[300, 600],
					],
				},
			},
			bids: [
				{
					bidder: "adtelligent",
					params: {
						aid: "YOUR_ADTELLIGENT_AID",
					},
				},
				{
					bidder: "bidmatic",
					params: {
						placementId: "YOUR_BIDMATIC_PLACEMENT_ID",
					},
				},
			],
		},
	];

	pbjs.addAdUnits(adUnits);

	pbjs.requestBids({
		adUnits,
		bidsBackHandler: () => {
			pbjs.setTargetingForGPTAsync();
			googletag.cmd.push(() => {
				googletag.pubads().refresh();
			});
		},
		timeout: 1100,
	});
});

googletag.cmd.push(() => {
	googletag
		.defineSlot(
			"/YOUR_NETWORK/YOUR_AD_UNIT",
			[
				[300, 250],
				[300, 600],
			],
			"ad-slot-1",
		)
		.addService(googletag.pubads());
	googletag.pubads().disableInitialLoad(); 
	googletag.enableServices();
});
