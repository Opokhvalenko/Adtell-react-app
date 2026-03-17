import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, "../screenshots");
const FE = "https://adtell-react-app.vercel.app";
const BE = "https://addtell-backend.onrender.com";

async function run() {
	const browser = await chromium.launch();
	const page = await browser.newPage({
		viewport: { width: 1440, height: 900 },
	});

	console.log("=== BACKEND ===");
	try {
		const healthRes = await page.goto(`${BE}/health`, { timeout: 30000 });
		const healthText = await page.locator("body").textContent();
		console.log(
			`Health: ${healthRes?.status()} — ${healthText?.substring(0, 200)}`,
		);
	} catch (e) {
		console.log(`Health: FAILED — ${e}`);
	}

	console.log("\n=== FRONTEND ===");
	const res = await page.goto(FE, {
		waitUntil: "domcontentloaded",
		timeout: 30000,
	});
	console.log(`Status: ${res?.status()}`);
	await page.waitForTimeout(5000);

	const title = await page.title();
	console.log(`Title: ${title}`);

	const bodyText = await page.locator("body").textContent();
	const hasUkrainian = /[а-яіїєґА-ЯІЇЄҐ]{3,}/.test(bodyText || "");
	console.log(`Has Ukrainian text: ${hasUkrainian}`);

	const headerText = await page
		.locator("header")
		.first()
		.textContent()
		.catch(() => "no header");
	console.log(`Header: ${headerText?.trim().substring(0, 150)}`);

	const footerText = await page
		.locator("footer")
		.first()
		.textContent()
		.catch(() => "no footer");
	console.log(`Footer: ${footerText?.trim().substring(0, 150)}`);

	await page.screenshot({
		path: path.join(OUT, "deployed-feed.png"),
		fullPage: true,
	});
	console.log("Screenshot: deployed-feed.png");

	const pages = [
		{ name: "deployed-login", path: "/login" },
		{ name: "deployed-register", path: "/register" },
	];

	for (const { name, path: p } of pages) {
		await page.goto(`${FE}${p}`, {
			waitUntil: "domcontentloaded",
			timeout: 15000,
		});
		await page.waitForTimeout(2000);
		await page.screenshot({
			path: path.join(OUT, `${name}.png`),
			fullPage: true,
		});
		console.log(`Screenshot: ${name}.png`);
	}

	await browser.close();
	console.log("\nDone.");
}

run();
