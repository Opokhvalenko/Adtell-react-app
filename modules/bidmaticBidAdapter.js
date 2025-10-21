const BIDDER_CODE = "bidmatic";
const ENDPOINT = "https://adapter.bidmatic.io/bdm/auction";

const isArray = Array.isArray;
const isNumber = (n) => typeof n === "number" && Number.isFinite(n);
const flatten = (a, b) => a.concat(b);
const chunk = (arr, size) => {
	const res = [];
	for (let i = 0; i < arr.length; i += size) res.push(arr.slice(i, i + size));
	return res;
};
function cleanObj(o) {
	const out = {};
	for (const k in o)
		if (o[k] !== undefined && o[k] !== null && o[k] !== "") out[k] = o[k];
	return out;
}
function deepAccess(obj, path) {
	if (!obj || !path) return;
	const parts = String(path).split(".");
	let cur = obj;
	for (const p of parts) {
		if (cur == null) return;
		cur = cur[p];
	}
	return cur;
}
function parseSizesInput(sizes) {
	if (!sizes) return [];
	if (typeof sizes === "string") return [sizes];
	if (isArray(sizes) && isArray(sizes[0]))
		return sizes.map((s) => `${s[0]}x${s[1]}`);
	if (isArray(sizes) && sizes.length === 2 && isNumber(sizes[0]))
		return [`${sizes[0]}x${sizes[1]}`];
	return [];
}

const _SYNC_DONE = new Set();
function getResponseSyncs(syncOptions, bid) {
	const types = bid.cookieURLSTypes || [];
	const uris = bid.cookieURLs;
	if (!isArray(uris)) return [];
	return uris.reduce((acc, uri, i) => {
		const type = types[i] || "image";
		if (
			(!syncOptions.pixelEnabled && type === "image") ||
			(!syncOptions.iframeEnabled && type === "iframe") ||
			_SYNC_DONE.has(uri)
		)
			return acc;
		_SYNC_DONE.add(uri);
		acc.push({ type, url: uri });
		return acc;
	}, []);
}
function getUserSyncsFn(syncOptions, serverResponses) {
	let syncs = [];
	if (!isArray(serverResponses)) return syncs;
	if (!syncOptions.pixelEnabled && !syncOptions.iframeEnabled) return syncs;
	serverResponses.forEach((resp) => {
		const body = resp?.body;
		if (!body) return;
		if (isArray(body))
			body.forEach((b) => {
				syncs = syncs.concat(getResponseSyncs(syncOptions, b));
			});
		else syncs = syncs.concat(getResponseSyncs(syncOptions, body));
	});
	return syncs;
}

function getBidFloor(bid) {
	try {
		const f = bid.getFloor?.({ currency: "USD", mediaType: "*", size: "*" });
		if (isNumber(f?.floor)) return f.floor;
	} catch {}
	const pf = deepAccess(bid, "params.bidfloor");
	return isNumber(pf) ? pf : undefined;
}
function getPlacementInfo(bidReq) {
	const el = document.getElementById(bidReq.adUnitCode);
	const rect = el?.getBoundingClientRect?.();
	const vh = window.innerHeight || 0;
	let distance = 0;
	if (rect) {
		const mid = rect.top + rect.height / 2;
		distance =
			mid > window.scrollY + vh
				? Math.round(mid - (window.scrollY + vh))
				: Math.round(mid);
	}
	return cleanObj({ DistanceToView: distance });
}
function prepareBidRequests(bidReq) {
	const isVideo = !!deepAccess(bidReq, "mediaTypes.video");
	const sizes = isVideo
		? deepAccess(bidReq, "mediaTypes.video.playerSize")
		: deepAccess(bidReq, "mediaTypes.banner.sizes");
	return cleanObj({
		CallbackId: bidReq.bidId,
		Aid: Number(deepAccess(bidReq, "params.source")),
		AdType: isVideo ? "video" : "display",
		PlacementId: bidReq.adUnitCode,
		Sizes: parseSizesInput(sizes).join(","),
		BidFloor: getBidFloor(bidReq),
		GPID: deepAccess(bidReq, "ortb2Imp.ext.gpid"),
		...getPlacementInfo(bidReq),
	});
}
function remapBidRequest(bidRequests, adapterRequest) {
	const tag = {
		Domain: deepAccess(adapterRequest, "refererInfo.page"),
		USP: deepAccess(adapterRequest, "uspConsent"),
		Coppa: deepAccess(adapterRequest, "ortb2.regs.coppa") ? 1 : 0,
		AgeVerification: deepAccess(
			adapterRequest,
			"ortb2.regs.ext.age_verification",
		),
		Schain: deepAccess(bidRequests[0], "schain"),
		UserEids: deepAccess(bidRequests[0], "userIdAsEids"),
		UserIds: deepAccess(bidRequests[0], "userId"),
		Tmax: adapterRequest?.timeout,
	};
	if (deepAccess(adapterRequest, "gdprConsent.gdprApplies")) {
		tag.GDPR = 1;
		tag.GDPRConsent = deepAccess(adapterRequest, "gdprConsent.consentString");
	}

	const gpp =
		adapterRequest?.gppConsent?.gppString || adapterRequest?.ortb2?.regs?.gpp;
	const gppSid =
		adapterRequest?.gppConsent?.applicableSections?.toString() ||
		adapterRequest?.ortb2?.regs?.gpp_sid;
	tag.GPP = gpp;
	tag.GPPSid = gppSid;
	return cleanObj(tag);
}
function bidToTag(bidRequests, adapterRequest) {
	const tag = remapBidRequest(bidRequests, adapterRequest);
	const bids = bidRequests.map(prepareBidRequests);
	return { tag, bids };
}

function createBid(b) {
	return cleanObj({
		requestId: b.requestId,
		creativeId: b.cmpId,
		width: b.width,
		height: b.height,
		cpm: b.cpm,
		currency: b.cur,
		netRevenue: true,
		ttl: 300,
		mediaType: b.vastUrl ? "video" : "banner",
		ad: b.ad,
		adUrl: b.adUrl,
		vastUrl: b.vastUrl,
		meta: { advertiserDomains: b.adomain || [] },
	});
}
function parseResponseBody(serverResponse, adapterRequest) {
	const out = [];
	const list = serverResponse?.bids;
	if (!isArray(list)) return out;
	list.forEach((srvBid) => {
		const match = (adapterRequest?.bids || []).find(
			(req) => req.bidId === srvBid.requestId,
		);
		if (match) out.push(createBid(srvBid));
	});
	return out;
}

export const spec = {
	code: BIDDER_CODE,
	gvlid: 1134,
	supportedMediaTypes: ["banner", "video"],

	isBidRequestValid(bid) {
		const src = Number(deepAccess(bid, "params.source"));
		return Number.isFinite(src);
	},

	buildRequests(bidRequests, adapterRequest) {
		const chunkSize = 5;
		const { tag, bids } = bidToTag(bidRequests, adapterRequest);
		return chunk(bids, chunkSize).map((b) => ({
			method: "POST",
			url: ENDPOINT,
			data: { ...tag, BidRequests: b },
			adapterRequest,
		}));
	},

	interpretResponse(serverResponse, { adapterRequest }) {
		const body = serverResponse?.body;
		if (!body) return [];
		if (isArray(body)) {
			let acc = [];
			body.forEach((br) => {
				acc = flatten(acc, parseResponseBody(br, adapterRequest));
			});
			return acc;
		}
		return parseResponseBody(body, adapterRequest);
	},

	getUserSyncs: getUserSyncsFn,
};

export default spec;

if (typeof window !== "undefined") {
	window.bidmaticAdapter = spec;
}
