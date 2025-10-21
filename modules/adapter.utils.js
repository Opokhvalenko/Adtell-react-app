export function pickSizeFromBid(bid, fallback = [300, 250]) {
	const mt = bid?.mediaTypes?.banner?.sizes;
	const guess = Array.isArray(mt) ? mt : bid?.sizes;
	const tuple =
		Array.isArray(guess) && Array.isArray(guess[0]) ? guess[0] : guess;
	const [w, h] = tuple || fallback;
	return [Number(w ?? fallback[0]), Number(h ?? fallback[1])];
}

export function adUnitCodeOf(bid, orValue = "ad-unknown") {
	return bid?.params?.adUnitCode ?? bid?.adUnitCode ?? bid?.code ?? orValue;
}

export function toQuery(obj = {}) {
	const enc = encodeURIComponent;
	return Object.keys(obj)
		.filter((k) => obj[k] !== undefined && obj[k] !== null)
		.map(
			(k) =>
				`${enc(k)}=${enc(typeof obj[k] === "object" ? JSON.stringify(obj[k]) : obj[k])}`,
		)
		.join("&");
}

export function randomCpm(min = 0.1, max = 1.0, digits = 2) {
	return Number((min + Math.random() * (max - min)).toFixed(digits));
}

export function nowId(prefix = "id") {
	return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}
