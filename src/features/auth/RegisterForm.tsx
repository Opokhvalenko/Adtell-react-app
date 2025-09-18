import { zodResolver } from "@hookform/resolvers/zod";
import { useId } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "../../stores/auth";

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

export default function RegisterForm() {
	const nameId = useId();
	const emailId = useId();
	const passwordId = useId();
	const confirmPasswordId = useId();

	const nameErrId = `${nameId}-error`;
	const emailErrId = `${emailId}-error`;
	const passwordErrId = `${passwordId}-error`;
	const confirmErrId = `${confirmPasswordId}-error`;

	const navigate = useNavigate();
	const { login } = useAuth(); // після реєстрації просто увімкнемо "вхід"

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<RegisterValues>({
		resolver: zodResolver(RegisterSchema),
		mode: "onTouched",
	});

	const onSubmit = async () => {
		// демо: в реальному житті робимо запит і потім логін
		login();
		navigate("/", { replace: true });
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
						placeholder="Your name"
						aria-invalid={!!errors.name}
						aria-describedby={errors.name ? nameErrId : undefined}
						className={inputCls}
						{...register("name")}
					/>
					{errors.name && (
						<p
							id={nameErrId}
							className="text-sm text-red-500 mt-1"
							aria-live="polite"
						>
							{errors.name.message}
						</p>
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
						inputMode="email"
						autoComplete="email"
						placeholder="name@example.com"
						aria-invalid={!!errors.email}
						aria-describedby={errors.email ? emailErrId : undefined}
						className={inputCls}
						{...register("email")}
					/>
					{errors.email && (
						<p
							id={emailErrId}
							className="text-sm text-red-500 mt-1"
							aria-live="polite"
						>
							{errors.email.message}
						</p>
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
						placeholder="••••••"
						aria-invalid={!!errors.password}
						aria-describedby={errors.password ? passwordErrId : undefined}
						className={inputCls}
						{...register("password")}
					/>
					{errors.password && (
						<p
							id={passwordErrId}
							className="text-sm text-red-500 mt-1"
							aria-live="polite"
						>
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
						placeholder="••••••"
						aria-invalid={!!errors.confirmPassword}
						aria-describedby={errors.confirmPassword ? confirmErrId : undefined}
						className={inputCls}
						{...register("confirmPassword")}
					/>
					{errors.confirmPassword && (
						<p
							id={confirmErrId}
							className="text-sm text-red-500 mt-1"
							aria-live="polite"
						>
							{errors.confirmPassword.message}
						</p>
					)}
				</div>

				<button
					type="submit"
					disabled={isSubmitting}
					className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{isSubmitting ? "Submitting..." : "Create account"}
				</button>
			</form>
		</div>
	);
}
