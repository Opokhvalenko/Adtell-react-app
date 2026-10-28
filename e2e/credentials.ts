/**
 * Credentials for the scripted browser checks. They come from the environment, never from the
 * repository: `E2E_EMAIL=… E2E_PASSWORD=… npx tsx e2e/check-auction.ts`.
 */
export function e2eCredentials(): { email: string; password: string } {
	const email = process.env.E2E_EMAIL;
	const password = process.env.E2E_PASSWORD;
	if (!email || !password) {
		throw new Error("Set E2E_EMAIL and E2E_PASSWORD to run this check");
	}
	return { email, password };
}
