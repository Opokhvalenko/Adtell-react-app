import { describe, expect, it } from "vitest";
import { toMessage } from "./httpError";

describe("toMessage", () => {
	it("extracts message from Error instance", () => {
		expect(toMessage(new Error("boom"))).toBe("boom");
	});

	it("returns string errors as-is", () => {
		expect(toMessage("something broke")).toBe("something broke");
	});

	it("extracts message from plain object", () => {
		expect(toMessage({ message: "not found" })).toBe("not found");
	});

	it("returns fallback for null", () => {
		expect(toMessage(null)).toBe("Request failed");
	});

	it("returns fallback for undefined", () => {
		expect(toMessage(undefined)).toBe("Request failed");
	});

	it("returns fallback for number", () => {
		expect(toMessage(42)).toBe("Request failed");
	});

	it("returns custom fallback", () => {
		expect(toMessage(null, "Custom error")).toBe("Custom error");
	});

	it("returns fallback for object with empty message", () => {
		expect(toMessage({ message: "  " })).toBe("Request failed");
	});

	it("returns fallback for object without message", () => {
		expect(toMessage({ code: 500 })).toBe("Request failed");
	});
});
