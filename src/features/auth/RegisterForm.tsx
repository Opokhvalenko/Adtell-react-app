// src/features/auth/RegisterForm.tsx
import { zodResolver } from "@hookform/resolvers/zod";
import { useId } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const RegisterSchema = z
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

type RegisterValues = z.infer<typeof RegisterSchema>;

const inputCls =
	"w-full rounded-lg px-3 py-2 shadow-sm " +
	"text-gray-900 dark:text-gray-100 " +
	"bg-white dark:bg-gray-800 " +
	"border border-gray-300 dark:border-gray-600 " +
	"placeholder-gray-500 dark:placeholder-gray-400 " +
	"focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

export default function RegisterForm(props: {
	onSubmitSuccess?: (data: RegisterValues) => void;
}) {
	const nameId = useId();
	const emailId = useId();
	const passwordId = useId();
	const confirmPasswordId = useId();

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<RegisterValues>({
		resolver: zodResolver(RegisterSchema),
		mode: "onTouched",
	});

	const onSubmit = async (values: RegisterValues) => {
		props.onSubmitSuccess?.(values);
	};

	return (
		<div className="max-w-md mx-auto p-6 rounded-2xl border bg-white/80 dark:bg-gray-800/80 shadow">
			<h2 className="text-2xl font-bold mb-4">Sign up</h2>

			<form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
				<div>
					<label
						htmlFor={nameId}
						className="block text-sm mb-1 text-gray-700 dark:text-gray-200"
					>
						Name
					</label>
					<input
						id={nameId}
						type="text"
						autoComplete="name"
						{...register("name")}
						className={inputCls}
					/>
					{errors.name && (
						<p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
					)}
				</div>

				<div>
					<label
						htmlFor={emailId}
						className="block text-sm mb-1 text-gray-700 dark:text-gray-200"
					>
						Email
					</label>
					<input
						id={emailId}
						type="email"
						autoComplete="email"
						{...register("email")}
						className={inputCls}
					/>
					{errors.email && (
						<p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
					)}
				</div>

				<div>
					<label
						htmlFor={passwordId}
						className="block text-sm mb-1 text-gray-700 dark:text-gray-200"
					>
						Password
					</label>
					<input
						id={passwordId}
						type="password"
						autoComplete="new-password"
						{...register("password")}
						className={inputCls}
					/>
					{errors.password && (
						<p className="text-sm text-red-500 mt-1">
							{errors.password.message}
						</p>
					)}
				</div>

				<div>
					<label
						htmlFor={confirmPasswordId}
						className="block text-sm mb-1 text-gray-700 dark:text-gray-200"
					>
						Confirm Password
					</label>
					<input
						id={confirmPasswordId}
						type="password"
						autoComplete="new-password"
						{...register("confirmPassword")}
						className={inputCls}
					/>
					{errors.confirmPassword && (
						<p className="text-sm text-red-500 mt-1">
							{errors.confirmPassword.message}
						</p>
					)}
				</div>

				<button
					type="submit"
					disabled={isSubmitting}
					className="w-full rounded-lg bg-blue-600 text-white py-2 font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{isSubmitting ? "Submitting..." : "Create account"}
				</button>
			</form>
		</div>
	);
}
