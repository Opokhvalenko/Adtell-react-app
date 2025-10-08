window.pbjs = window.pbjs || { que: [] };
window.googletag = window.googletag || { cmd: [] };

pbjs.que.push(function () {
  pbjs.setConfig({
    consentManagement: {
      gdpr: { cmpApi: "tcfv2", timeout: 8000, allowAuctionWithoutConsent: false },
      usp: { cmpApi: "usp", timeout: 8000 },
    },
    bidderTimeout: 1200,
    enableTIDs: true,
    enableSendAllBids: true,
  });

  const adUnits = [
    { code: "ad-adtelligent", mediaTypes: { banner: { sizes: [[300,250]] } }, bids: [{ bidder: "adtelligent", params: { aid: 350975 } }] },
    { code: "ad-bidmatic",   mediaTypes: { banner: { sizes: [[300,250]] } }, bids: [{ bidder: "bidmatic",   params: { source: 886409 } }] },
    { code: "ad-beautiful",  mediaTypes: { banner: { sizes: [[300,250]] } }, bids: [{ bidder: "customAdServer", params: { adUnitCode: "ad-beautiful", adServerUrl: "/api/adserver/bid" } }] },
  ];

  pbjs.addAdUnits(adUnits);

  pbjs.requestBids({
    adUnitCodes: adUnits.map(u => u.code),
    bidsBackHandler: function () {
      pbjs.setTargetingForGPTAsync();
      googletag.cmd.push(function () { googletag.pubads().refresh(); });
    },
    timeout: 1100,
  });
});

googletag.cmd.push(function () {
  const pubads = googletag.pubads();
  pubads.disableInitialLoad();
  pubads.enableSingleRequest();
  pubads.setCentering(true);

  googletag.defineSlot("/1234567/ad-adtelligent", [[300,250]], "ad-adtelligent").addService(pubads).setTargeting("pos","adtelligent");
  googletag.defineSlot("/1234567/ad-bidmatic",   [[300,250]], "ad-bidmatic").addService(pubads).setTargeting("pos","bidmatic");
  googletag.defineSlot("/1234567/ad-beautiful",  [[300,250]], "ad-beautiful").addService(pubads).setTargeting("pos","beautiful");

  googletag.enableServices();
});