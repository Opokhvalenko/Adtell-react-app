(function () {
  window.pbjs = window.pbjs || { que: [] };
  window.googletag = window.googletag || { cmd: [] };

  // === DEMO params ===
  const ADTELLIGENT_AID = 350975; 
  const GPT_PATH = "/1234567/ad-300x250"; 

  // ---- GPT ----
  googletag.cmd.push(function () {
    const pubads = googletag.pubads();

    pubads.setRequestNonPersonalizedAds(1);

    pubads.disableInitialLoad();
    pubads.enableSingleRequest();
    pubads.setCentering(true);

    googletag
      .defineSlot(GPT_PATH, [[300, 250]], "ad-adtelligent")
      .addService(pubads).setTargeting("pos", "adtelligent");

    googletag
      .defineSlot(GPT_PATH, [[300, 250]], "ad-bidmatic")
      .addService(pubads).setTargeting("pos", "bidmatic");

    googletag
      .defineSlot(GPT_PATH, [[300, 250]], "ad-pokhvalenko")
      .addService(pubads).setTargeting("pos", "pokhvalenko");

    googletag.enableServices();

    googletag.display("ad-adtelligent");
    googletag.display("ad-bidmatic");
    googletag.display("ad-pokhvalenko");
  });

  // ---- Prebid ----
  pbjs.que.push(function () {
    ["bidmatic", "pokhvalenko"].forEach(alias => {
      try { pbjs.aliasBidder("adtelligent", alias); } catch (e) {}
    });

    pbjs.setConfig({
      debug: true,
      bidderTimeout: 1200,
      enableSendAllBids: true,

      userSync: { syncEnabled: false },

      bidderSettings: {
      
        adtelligent:  { bidCpmAdjustment: c => c + 1.00 },
        
        bidmatic:     { bidCpmAdjustment: c => c + 2.00 },
      
        pokhvalenko:  { bidCpmAdjustment: c => c + 3.00 }
      }
    });

    const adUnits = [
      {
        code: "ad-adtelligent",
        mediaTypes: { banner: { sizes: [[300, 250]] } },
        bids: [{ bidder: "adtelligent", params: { aid: ADTELLIGENT_AID } }]
      },
      {
        code: "ad-bidmatic",
        mediaTypes: { banner: { sizes: [[300, 250]] } },
        bids: [{ bidder: "bidmatic", params: { aid: ADTELLIGENT_AID } }]
      },
      {
        code: "ad-pokhvalenko",
        mediaTypes: { banner: { sizes: [[300, 250]] } },
        bids: [{ bidder: "pokhvalenko", params: { aid: ADTELLIGENT_AID } }]
      }
    ];

    pbjs.addAdUnits(adUnits);

    pbjs.requestBids({
      adUnitCodes: adUnits.map(u => u.code),
      timeout: 1100,
      bidsBackHandler: function () {
        pbjs.setTargetingForGPTAsync();
        googletag.cmd.push(function () {
          googletag.pubads().refresh(); 
        });
      }
    });
  });
})();