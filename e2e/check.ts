import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.BASE_URL || "http://localhost:5173";
const OUT = path.resolve(__dirname, "../screenshots");

fs.mkdirSync(OUT, { recursive: true });

type CheckResult = {
	page: string;
	status: "ok" | "fail";
	screenshot: string;
	errors: string[];
	logs: string[];
};

async function run() {
	const browser = await chromium.launch();
	const context = await browser.newContext({
		viewport: { width: 1280, height: 800 },
	});

	const results: CheckResult[] = [];

	const pages = [
		{ name: "feed", path: "/" },
		{ name: "login", path: "/login" },
		{ name: "register", path: "/register" },
	];

	for (const { name, path: pagePath } of pages) {
		const page = await context.newPage();
		const errors: string[] = [];
		const logs: string[] = [];

		page.on("pageerror", (err) => errors.push(err.message));
		page.on("console", (msg) => {
			if (msg.type() === "error") logs.push(msg.text());
		});

		try {
			const res = await page.goto(`${BASE}${pagePath}`, {
				waitUntil: "domcontentloaded",
				timeout: 15000,
			});

			await page.waitForTimeout(1000);

			const screenshotPath = path.join(OUT, `${name}.png`);
			await page.screenshot({ path: screenshotPath, fullPage: true });

			results.push({
				page: name,
				status: res?.ok() ? "ok" : "fail",
				screenshot: screenshotPath,
				errors,
				logs,
			});
		} catch (e) {
			errors.push(String(e));
			results.push({
				page: name,
				status: "fail",
				screenshot: "",
				errors,
				logs,
			});
		}

		await page.close();
	}

	await browser.close();

	console.log("\n=== Browser Check Results ===\n");
	for (const r of results) {
		const icon = r.status === "ok" ? "PASS" : "FAIL";
		console.log(`[${icon}] ${r.page} — ${r.screenshot}`);
		if (r.errors.length > 0) {
			console.log(`  JS Errors: ${r.errors.join(", ")}`);
		}
		if (r.logs.length > 0) {
			console.log(`  Console Errors: ${r.logs.join(", ")}`);
		}
	}

	const failed = results.filter((r) => r.status === "fail");
	if (failed.length > 0) {
		console.log(`\n${failed.length} page(s) failed.`);
		process.exit(1);
	} else {
		console.log(`\nAll ${results.length} pages OK.`);
	}
}

run();
