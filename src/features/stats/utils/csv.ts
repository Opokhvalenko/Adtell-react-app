/** Leading characters that make Excel/Sheets treat a cell as a formula (CSV injection). */
const FORMULA_START = /^[=+\-@\t\r]/;

/**
 * Event fields come from a public endpoint, so a text cell may carry a formula: neutralise it.
 * Numbers are written as they are (a negative number is not a formula).
 */
function cell(value: unknown): string {
	if (value == null) return "";
	const text = String(value);
	const safe =
		typeof value === "string" && FORMULA_START.test(text) ? `'${text}` : text;
	return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function rowsToCsv(rows: ReadonlyArray<object>): string {
	const first = rows[0];
	if (!first) return "";
	const headers = Object.keys(first);
	const lines = rows.map((row) => {
		const record = new Map<string, unknown>(Object.entries(row));
		return headers.map((h) => cell(record.get(h))).join(",");
	});
	return [headers.map(cell).join(","), ...lines].join("\n");
}
