import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

type VercelConfig = {
	headers?: Array<{
		source: string;
		headers: Array<{ key: string; value: string }>;
	}>;
};

const config = JSON.parse(
	readFileSync(resolve(__dirname, "../../vercel.json"), "utf8"),
) as VercelConfig;

const site = config.headers?.find((h) => h.source === "/(.*)");
const header = (key: string) =>
	site?.headers.find((h) => h.key.toLowerCase() === key.toLowerCase())?.value;

function directives(csp: string | undefined): Map<string, string> {
	return new Map(
		(csp ?? "")
			.split(";")
			.map((d) => d.trim())
			.filter(Boolean)
			.map((d) => {
				const [name, ...values] = d.split(/\s+/);
				return [name, values.join(" ")] as const;
			}),
	);
}

describe("production security headers (vercel.json)", () => {
	const csp = directives(header("Content-Security-Policy"));

	it("apply to every path, each header once (a second copy would not be checked here)", () => {
		expect(site).toBeDefined();
		const keys = (site?.headers ?? []).map((h) => h.key.toLowerCase());
		expect(new Set(keys).size).toBe(keys.length);
	});

	it("block plugins, <base> hijacking, foreign form targets and framing by other sites", () => {
		expect(csp.get("object-src")).toBe("'none'");
		expect(csp.get("base-uri")).toBe("'self'");
		expect(csp.get("form-action")).toBe("'self'");
		// 'self': the line-item form is embedded from the same origin
		expect(csp.get("frame-ancestors")).toBe("'self'");
		expect(header("X-Frame-Options")).toBe("SAMEORIGIN");
	});

	it("never allow plain http or eval for scripts", () => {
		expect(csp.has("upgrade-insecure-requests")).toBe(true);
		for (const [name, value] of csp) {
			expect(value, name).not.toMatch(/(^|\s)http:/);
		}
		expect(csp.get("script-src")).not.toContain("'unsafe-eval'");
		expect(csp.get("default-src")).toBe("'self'");
	});

	it("send the other baseline headers", () => {
		expect(header("X-Content-Type-Options")).toBe("nosniff");
		expect(header("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
		expect(header("Permissions-Policy")).toContain("camera=()");
		expect(header("Access-Control-Allow-Origin")).not.toBe("*");
	});
});
