import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiDemoLogin, apiLogin, authErrorMessage } from "@/lib/auth";
import { useAuth } from "@/store/auth";
import AuthForm from "./AuthForm";
import { LoginSchema, type LoginValues } from "./schemas";

export default function LoginForm() {
	const navigate = useNavigate();
	const { hydrate } = useAuth();
	const [pending, setPending] = useState(false);
	const [err, setErr] = useState<string | null>(null);

	async function signIn(request: () => Promise<unknown>) {
		setErr(null);
		setPending(true);
		try {
			await request();
			await hydrate();
			navigate("/", { replace: true });
		} catch (e) {
			setErr(authErrorMessage(e));
		} finally {
			setPending(false);
		}
	}

	return (
		<AuthForm<LoginValues>
			title="Login"
			schema={LoginSchema}
			submitLabel="Login"
			submitting={pending}
			error={err}
			fields={[
				{ name: "email", label: "Email", type: "email", autoComplete: "email" },
				{
					name: "password",
					label: "Password",
					type: "password",
					autoComplete: "current-password",
				},
			]}
			onSubmit={async (values) => {
				await signIn(() => apiLogin(values.email.trim(), values.password));
			}}
			footer={
				<>
					<button
						type="button"
						onClick={() => signIn(apiDemoLogin)}
						disabled={pending}
						className="w-full rounded-lg border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-60 dark:hover:bg-blue-950/40"
					>
						Try the demo account
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
				</>
			}
		/>
	);
}
