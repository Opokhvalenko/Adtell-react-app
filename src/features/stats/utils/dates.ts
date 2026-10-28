/**
 * The backend groups statistics by UTC day, so the page works in UTC calendar days too:
 * `toISOString()` dates and local "today" disagree around midnight (00:30 in Kyiv is still
 * yesterday in UTC), and mixing them showed the wrong range.
 */
const DAY_MS = 86_400_000;

/** `YYYY-MM-DD` of the current UTC day. */
export function utcToday(now = new Date()): string {
	return now.toISOString().slice(0, 10);
}

/** Moves a `YYYY-MM-DD` day by whole days. */
export function addDays(ymd: string, days: number): string {
	return new Date(Date.parse(`${ymd}T00:00:00Z`) + days * DAY_MS)
		.toISOString()
		.slice(0, 10);
}
