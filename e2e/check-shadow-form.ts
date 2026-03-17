import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, "../screenshots");
const FE = "https://adtell-react-app.vercel.app";

async function run() {
	const browser = await chromium.launch();
	const context = await browser.newContext({
		viewport: { width: 1440, height: 900 },
	});
	const page = await context.newPage();

	// Login first
	await page.goto(`${FE}/login`, {
		waitUntil: "domcontentloaded",
		timeout: 30000,
	});
	await page.waitForTimeout(2000);
	await page.fill('input[autocomplete="email"]', "demo@adtell.app");
	await page.fill('input[autocomplete="current-password"]', "Demo1234!");
	await page.getByRole("button", { name: /login/i }).click();

	try {
		await page.waitForURL("**/", { timeout: 10000 });
		console.log("[OK] Logged in");
	} catch {
		console.log("[FAIL] Login failed");
		await page.screenshot({
			path: path.join(OUT, "deployed-login-fail.png"),
			fullPage: true,
		});
		await browser.close();
		return;
	}

	// Navigate to create ad (shadow form)
	await page.goto(`${FE}/ads/create`, {
		waitUntil: "domcontentloaded",
		timeout: 15000,
	});
	await page.waitForTimeout(3000);

	const url = page.url();
	console.log(`URL: ${url}`);

	const bodyText = await page.locator("body").textContent();
	console.log(`Page text (first 300): ${bodyText?.trim().substring(0, 300)}`);

	await page.screenshot({
		path: path.join(OUT, "deployed-create-ad.png"),
		fullPage: true,
	});
	console.log("[OK] Screenshot: deployed-create-ad.png");

	// Also check ad demo
	await page.goto(`${FE}/ads/demo`, {
		waitUntil: "domcontentloaded",
		timeout: 15000,
	});
	await page.waitForTimeout(3000);
	await page.screenshot({
		path: path.join(OUT, "deployed-ad-demo.png"),
		fullPage: true,
	});
	console.log("[OK] Screenshot: deployed-ad-demo.png");

	// Check ads debug
	await page.goto(`${FE}/ads-debug`, {
		waitUntil: "domcontentloaded",
		timeout: 15000,
	});
	await page.waitForTimeout(3000);
	await page.screenshot({
		path: path.join(OUT, "deployed-ads-debug.png"),
		fullPage: true,
	});
	console.log("[OK] Screenshot: deployed-ads-debug.png");

	await browser.close();
	console.log("Done.");
}

run();
