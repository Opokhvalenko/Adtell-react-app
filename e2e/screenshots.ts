import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.BASE_URL || "http://localhost:5173";
const OUT = path.resolve(__dirname, "../screenshots");

fs.mkdirSync(OUT, { recursive: true });

async function run() {
	const browser = await chromium.launch();
	const context = await browser.newContext({
		viewport: { width: 1440, height: 900 },
	});

	const page = await context.newPage();

	await page.goto(`${BASE}/login`, {
		waitUntil: "domcontentloaded",
		timeout: 15000,
	});
	await page.waitForTimeout(1000);
	await page.screenshot({
		path: path.join(OUT, "login.png"),
		fullPage: true,
	});
	console.log("[OK] login");

	await page.fill('input[autocomplete="email"]', "demo@adtell.app");
	await page.fill('input[autocomplete="current-password"]', "Demo1234!");
	await page.getByRole("button", { name: /login/i }).click();
	await page.waitForURL("**/", { timeout: 10000 });
	await page.waitForTimeout(2000);

	console.log("[OK] logged in");

	const publicPages = [
		{ name: "feed", path: "/", wait: 3000 },
		{ name: "register", path: "/register", wait: 1000 },
	];

	const protectedPages = [
		{ name: "auction-debug", path: "/ads-debug", wait: 4000 },
		{ name: "stats", path: "/stats", wait: 3000 },
	];

	await page.screenshot({
		path: path.join(OUT, "feed.png"),
		fullPage: true,
	});
	console.log("[OK] feed");

	for (const { name, path: pagePath, wait } of [
		...publicPages.slice(1),
		...protectedPages,
	]) {
		await page.goto(`${BASE}${pagePath}`, {
			waitUntil: "domcontentloaded",
			timeout: 15000,
		});
		await page.waitForTimeout(wait);
		await page.screenshot({
			path: path.join(OUT, `${name}.png`),
			fullPage: true,
		});
		console.log(`[OK] ${name}`);
	}

	await browser.close();
}

run();
