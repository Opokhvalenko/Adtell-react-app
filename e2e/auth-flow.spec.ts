import { chromium, expect, type Page, test } from "@playwright/test";

const BASE = process.env.BASE_URL || "http://localhost:5173";

let page: Page;

test.beforeAll(async () => {
	const browser = await chromium.launch();
	const context = await browser.newContext({
		viewport: { width: 1280, height: 800 },
	});
	page = await context.newPage();
});

test.afterAll(async () => {
	await page.context().browser()?.close();
});

test.describe("Auth flow E2E", () => {
	test("home page renders header and navigation", async () => {
		await page.goto(BASE, { waitUntil: "domcontentloaded" });

		const brand = page.getByRole("link", { name: /news app/i });
		await expect(brand).toBeVisible();

		const loginLink = page.getByRole("link", { name: /login/i });
		await expect(loginLink).toBeVisible();

		const signUpLink = page.getByRole("link", { name: /sign up/i });
		await expect(signUpLink).toBeVisible();
	});

	test("navigates to login page", async () => {
		await page.goto(BASE, { waitUntil: "domcontentloaded" });

		await page.getByRole("link", { name: /login/i }).click();
		await page.waitForURL("**/login");

		const heading = page.getByRole("heading", { name: /login/i });
		await expect(heading).toBeVisible();

		await expect(page.getByLabel(/email/i)).toBeVisible();
		await expect(page.getByLabel(/password/i)).toBeVisible();
	});

	test("navigates to register page", async () => {
		await page.goto(`${BASE}/register`, { waitUntil: "domcontentloaded" });

		const heading = page.getByRole("heading", { name: /sign up/i });
		await expect(heading).toBeVisible();

		await expect(page.getByLabel(/^name$/i)).toBeVisible();
		await expect(page.getByLabel(/email/i)).toBeVisible();

		const pwFields = page.getByLabel(/password/i);
		await expect(pwFields.first()).toBeVisible();
	});

	test("login form shows validation errors on empty submit", async () => {
		await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });

		await page.getByRole("button", { name: /login/i }).click();

		await expect(page.getByText(/enter a valid email/i)).toBeVisible({
			timeout: 5000,
		});
	});

	test("register form shows validation errors on empty submit", async () => {
		await page.goto(`${BASE}/register`, { waitUntil: "domcontentloaded" });

		await page.getByRole("button", { name: /create account/i }).click();

		await expect(page.getByText(/name must be at least/i)).toBeVisible({
			timeout: 5000,
		});
	});

	test("theme toggle changes appearance", async () => {
		await page.goto(BASE, { waitUntil: "domcontentloaded" });
		await page.waitForTimeout(500);

		const html = page.locator("html");
		const hadDark = await html.evaluate((el) => el.classList.contains("dark"));

		const toggleBtn = page
			.getByRole("button", { name: /toggle theme/i })
			.or(page.locator("button").filter({ hasText: /theme/i }));

		if (await toggleBtn.isVisible()) {
			await toggleBtn.click();
			await page.waitForTimeout(300);

			const hasDarkNow = await html.evaluate((el) =>
				el.classList.contains("dark"),
			);
			expect(hasDarkNow).not.toBe(hadDark);
		}
	});
});
