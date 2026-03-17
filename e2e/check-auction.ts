import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = "http://localhost:5173";
const OUT = path.resolve(__dirname, "../screenshots");
fs.mkdirSync(OUT, { recursive: true });

async function run() {
	const browser = await chromium.launch();
	const page = await browser
		.newContext({ viewport: { width: 1440, height: 1000 } })
		.then((c) => c.newPage());

	const consoleMessages: string[] = [];
	page.on("console", (msg) => {
		const text = msg.text();
		if (
			text.includes("Prebid") ||
			text.includes("bid") ||
			text.includes("auction") ||
			text.includes("adtelligent") ||
			text.includes("bidmatic") ||
			text.includes("beautiful") ||
			text.includes("pokhvalenko") ||
			text.includes("[Ad")
		) {
			consoleMessages.push(`[${msg.type()}] ${text.substring(0, 300)}`);
		}
	});

	// Login
	await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
	await page.waitForTimeout(2000);
	await page.fill('input[autocomplete="email"]', "demo@adtell.app");
	await page.fill('input[autocomplete="current-password"]', "Demo1234!");
	await page.getByRole("button", { name: /login/i }).click();
	await page.waitForURL("**/", { timeout: 10000 });
	console.log("[OK] Logged in");

	// Wait for ads to load on feed page
	await page.waitForTimeout(8000);
	await page.screenshot({
		path: path.join(OUT, "auction-feed-logged.png"),
		fullPage: true,
	});
	console.log("[OK] Feed with ads screenshot");

	// Check ad slots content
	const slots = [
		"ad-top-adtelligent",
		"ad-right-bidmatic",
		"ad-right-beautiful",
	];
	for (const slotId of slots) {
		const el = page.locator(`#${slotId}`);
		const exists = await el.count();
		if (exists > 0) {
			const html = await el.innerHTML();
			const hasIframe = html.includes("iframe");
			const hasContent = html.trim().length > 0;
			console.log(
				`[SLOT] ${slotId}: exists=${exists > 0}, iframe=${hasIframe}, hasContent=${hasContent}, htmlLength=${html.length}`,
			);
		} else {
			console.log(`[SLOT] ${slotId}: NOT FOUND in DOM`);
		}
	}

	// Go to debug page
	await page.goto(`${BASE}/ads-debug`, { waitUntil: "domcontentloaded" });
	await page.waitForTimeout(5000);
	await page.screenshot({
		path: path.join(OUT, "auction-debug-detail.png"),
		fullPage: true,
	});
	console.log("[OK] Debug page screenshot");

	// Extract debug page info
	const debugText = await page.locator("body").textContent();

	// Check for adapter names in debug output
	const adapters = [
		"adtelligent",
		"bidmatic",
		"beautiful",
		"pokhvalenko",
		"demo",
	];
	for (const adapter of adapters) {
		const count = (
			debugText?.toLowerCase().match(new RegExp(adapter, "g")) || []
		).length;
		if (count > 0) {
			console.log(`[DEBUG] "${adapter}" mentioned ${count} times`);
		}
	}

	// Check for auction events
	const events = [
		"auctionInit",
		"auctionEnd",
		"bidRequested",
		"bidResponse",
		"bidWon",
		"noBid",
	];
	for (const event of events) {
		const count = (debugText?.match(new RegExp(event, "g")) || []).length;
		if (count > 0) {
			console.log(`[EVENT] ${event}: ${count} occurrences`);
		}
	}

	// Go to stats page
	await page.goto(`${BASE}/stats`, { waitUntil: "domcontentloaded" });
	await page.waitForTimeout(3000);
	await page.screenshot({
		path: path.join(OUT, "auction-stats-detail.png"),
		fullPage: true,
	});
	console.log("[OK] Stats page screenshot");

	// Go to ad demo page
	await page.goto(`${BASE}/ads/demo`, { waitUntil: "domcontentloaded" });
	await page.waitForTimeout(3000);
	await page.screenshot({
		path: path.join(OUT, "auction-ad-demo.png"),
		fullPage: true,
	});
	console.log("[OK] Ad demo page screenshot");

	// Print console messages
	if (consoleMessages.length > 0) {
		console.log("\n=== AD-RELATED CONSOLE MESSAGES ===");
		for (const msg of consoleMessages.slice(0, 50)) {
			console.log(msg);
		}
	} else {
		console.log("\n[WARN] No ad-related console messages captured");
	}

	await browser.close();
	console.log("\nDone.");
}

run();
