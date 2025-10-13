(function () {
  window.pbjs = window.pbjs || { que: [] };
  window.googletag = window.googletag || { cmd: [] };

  const ADTELLIGENT_AID = 350975;
  const BIDMATIC_SOURCE = 886409;
  const POK_AID = 350975; 

  const FORCE_POK =
    new URL(location.href).searchParams.get("forcePok") === "1";

  // ---- GPT ----
  googletag.cmd.push(function () {
    const pubads = googletag.pubads();
    pubads.disableInitialLoad();
    pubads.enableSingleRequest();
    pubads.setCentering(true);

    googletag
      .defineSlot("/1234567/ad-300x250", [[300, 250]], "ad-adtelligent")
      .addService(pubads).setTargeting("pos", "adtelligent");

    googletag
      .defineSlot("/1234567/ad-300x250", [[300, 250]], "ad-bidmatic")
      .addService(pubads).setTargeting("pos", "bidmatic");

    googletag
      .defineSlot("/1234567/ad-300x250", [[300, 250]], "ad-pokhvalenko")
      .addService(pubads).setTargeting("pos", "pokhvalenko");

    googletag.enableServices();

    googletag.display("ad-adtelligent");
    googletag.display("ad-bidmatic");
    googletag.display("ad-pokhvalenko");
  });

  // ---- Prebid ----
  pbjs.que.push(function () {
    pbjs.setConfig({
      bidderTimeout: 1200,
      enableSendAllBids: true,

      consentManagement: {
        gdpr: { cmpApi: "tcfv2", timeout: 8000, allowAuctionWithoutConsent: false },
        usp:  { cmpApi: "usp",   timeout: 8000 },
      },
      bidderSettings: FORCE_POK
        ? { pokhvalenko: { bidCpmAdjustment: (cpm) => cpm + 100 } }
        : undefined,
    });

    const adUnits = [
      {
        code: "ad-adtelligent",
        mediaTypes: { banner: { sizes: [[300, 250]] } },
        bids: [{ bidder: "adtelligent", params: { aid: ADTELLIGENT_AID } }],
      },
      {
        code: "ad-bidmatic",
        mediaTypes: { banner: { sizes: [[300, 250]] } },
        bids: [{ bidder: "bidmatic", params: { source: BIDMATIC_SOURCE } }],
      },
      {
        code: "ad-pokhvalenko",
        mediaTypes: { banner: { sizes: [[300, 250]] } },
        bids: [{ bidder: "pokhvalenko", params: { aid: POK_AID } }],
      },
    ];

    pbjs.addAdUnits(adUnits);

    pbjs.requestBids({
      adUnitCodes: adUnits.map((u) => u.code),
      timeout: 1100,
      bidsBackHandler: function () {
        pbjs.setTargetingForGPTAsync();
        googletag.cmd.push(function () {
          googletag.pubads().refresh();
        });
      },
    });
  });
})();