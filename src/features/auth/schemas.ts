import { z } from "zod";

/** Same limits as the backend (8–128), so the form never accepts what the API rejects. */
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 128;
const password = z
	.string()
	.min(PASSWORD_MIN, `Password must be at least ${PASSWORD_MIN} characters`)
	.max(PASSWORD_MAX, `Password must be at most ${PASSWORD_MAX} characters`);

export const LoginSchema = z.object({
	email: z.string().trim().email("Enter a valid email"),
	password,
});
export type LoginValues = z.infer<typeof LoginSchema>;

export const RegisterSchema = z
	.object({
		email: z.string().trim().email("Enter a valid email"),
		password,
		confirmPassword: z.string(),
	})
	.refine((d) => d.password === d.confirmPassword, {
		path: ["confirmPassword"],
		message: "Passwords must match",
	});
export type RegisterValues = z.infer<typeof RegisterSchema>;
