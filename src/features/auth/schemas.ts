import { z } from "zod";

export const LoginSchema = z.object({
	email: z.string().trim().email("Enter a valid email"),
	password: z.string().min(6, "Password must be at least 6 characters"),
});
export type LoginValues = z.infer<typeof LoginSchema>;

export const RegisterSchema = z
	.object({
		name: z.string().trim().min(2, "Name must be at least 2 characters"),
		email: z.string().trim().email("Enter a valid email"),
		password: z.string().min(6, "Password must be at least 6 characters"),
		confirmPassword: z.string(),
	})
	.refine((d) => d.password === d.confirmPassword, {
		path: ["confirmPassword"],
		message: "Passwords must match",
	});
export type RegisterValues = z.infer<typeof RegisterSchema>;
