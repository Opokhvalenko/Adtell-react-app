import { describe, expect, it } from "vitest";
import { LoginSchema, RegisterSchema } from "./schemas";

describe("LoginSchema", () => {
	it("accepts valid credentials", () => {
		const result = LoginSchema.safeParse({
			email: "user@example.com",
			password: "secret123",
		});
		expect(result.success).toBe(true);
	});

	it("trims email whitespace", () => {
		const result = LoginSchema.safeParse({
			email: "  user@example.com  ",
			password: "secret123",
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.email).toBe("user@example.com");
		}
	});

	it("rejects invalid email", () => {
		const result = LoginSchema.safeParse({
			email: "not-an-email",
			password: "secret123",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0].message).toBe("Enter a valid email");
		}
	});

	it("rejects empty email", () => {
		const result = LoginSchema.safeParse({ email: "", password: "secret123" });
		expect(result.success).toBe(false);
	});

	it("rejects short password", () => {
		const result = LoginSchema.safeParse({
			email: "user@example.com",
			password: "12345",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0].message).toBe(
				"Password must be at least 6 characters",
			);
		}
	});

	it("rejects empty password", () => {
		const result = LoginSchema.safeParse({
			email: "user@example.com",
			password: "",
		});
		expect(result.success).toBe(false);
	});
});

describe("RegisterSchema", () => {
	const valid = {
		name: "John",
		email: "john@example.com",
		password: "secret123",
		confirmPassword: "secret123",
	};

	it("accepts valid registration data", () => {
		const result = RegisterSchema.safeParse(valid);
		expect(result.success).toBe(true);
	});

	it("rejects short name", () => {
		const result = RegisterSchema.safeParse({ ...valid, name: "J" });
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0].message).toBe(
				"Name must be at least 2 characters",
			);
		}
	});

	it("trims name whitespace", () => {
		const result = RegisterSchema.safeParse({ ...valid, name: "  Jo  " });
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.name).toBe("Jo");
		}
	});

	it("rejects mismatched passwords", () => {
		const result = RegisterSchema.safeParse({
			...valid,
			confirmPassword: "different",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0].message).toBe("Passwords must match");
		}
	});

	it("rejects invalid email", () => {
		const result = RegisterSchema.safeParse({ ...valid, email: "bad" });
		expect(result.success).toBe(false);
	});

	it("rejects short password", () => {
		const result = RegisterSchema.safeParse({
			...valid,
			password: "123",
			confirmPassword: "123",
		});
		expect(result.success).toBe(false);
	});
});
