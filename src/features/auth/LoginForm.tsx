// src/features/auth/LoginForm.tsx
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { z } from "zod";

const schema = z.object({
	email: z.string().email("Enter a valid email"),
	password: z.string().min(6, "Password must be at least 6 characters"),
});
type FormData = z.infer<typeof schema>;

const inputCls =
	"w-full rounded-lg px-3 py-2 shadow-sm " +
	"text-gray-900 dark:text-gray-100 " +
	"bg-white dark:bg-gray-800 " +
	"border border-gray-300 dark:border-gray-600 " +
	"placeholder-gray-500 dark:placeholder-gray-400 " +
	"focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

export default function LoginForm() {
	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<FormData>({ resolver: zodResolver(schema), mode: "onTouched" });

	const onSubmit = async (data: FormData) => {
		console.log("Login:", data);
	};

	return (
		<div className="max-w-md mx-auto p-6 rounded-2xl border bg-white/80 dark:bg-gray-800/80 shadow">
			<h2 className="text-2xl font-bold mb-4">Login</h2>

			<form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
				<div>
					<input
						{...register("email")}
						placeholder="Email"
						className={inputCls}
					/>
					{errors.email && (
						<p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
					)}
				</div>

				<div>
					<input
						type="password"
						{...register("password")}
						placeholder="Password"
						className={inputCls}
					/>
					{errors.password && (
						<p className="text-sm text-red-500 mt-1">
							{errors.password.message}
						</p>
					)}
				</div>

				<button
					type="submit"
					disabled={isSubmitting}
					className="w-full rounded-lg bg-blue-600 text-white py-2 font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{isSubmitting ? "Signing in…" : "Login"}
				</button>

				<p className="text-sm text-gray-600 dark:text-gray-300 text-center">
					Don’t have an account?{" "}
					<Link
						to="/register"
						className="font-medium text-blue-600 hover:underline"
					>
						Sign up
					</Link>
				</p>
			</form>
		</div>
	);
}
