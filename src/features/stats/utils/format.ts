export const fmtInt = (v: unknown) => {
	const n = Number(v);
	return Number.isFinite(n)
		? new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 0 }).format(n)
		: "—";
};

export const fmtFloat2 = (v: unknown) => {
	const n = Number(v);
	return Number.isFinite(n)
		? new Intl.NumberFormat("uk-UA", {
				minimumFractionDigits: 2,
				maximumFractionDigits: 2,
			}).format(n)
		: "—";
};

export const fmtPct = (v: unknown) => {
	const n = Number(v);
	if (!Number.isFinite(n)) return "—";
	return `${new Intl.NumberFormat("uk-UA", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(n)}%`;
};
