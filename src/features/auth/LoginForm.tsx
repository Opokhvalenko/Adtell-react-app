import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiLogin } from "@/lib/auth";
import { toMessage } from "@/lib/httpError";
import { useAuth } from "@/store/auth";
import AuthForm from "./AuthForm";
import { LoginSchema, type LoginValues } from "./schemas";

export default function LoginForm() {
	const navigate = useNavigate();
	const { hydrate } = useAuth();
	const [pending, setPending] = useState(false);
	const [err, setErr] = useState<string | null>(null);

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
				setErr(null);
				setPending(true);
				try {
					await apiLogin(values.email.trim(), values.password);
					await hydrate();
					navigate("/", { replace: true });
				} catch (e) {
					setErr(toMessage(e, "Invalid credentials"));
				} finally {
					setPending(false);
				}
			}}
			footer={
				<p className="text-sm text-gray-600 dark:text-gray-300 text-center">
					Don’t have an account?{" "}
					<Link
						to="/register"
						className="font-medium text-blue-600 hover:underline"
					>
						Sign up
					</Link>
				</p>
			}
		/>
	);
}
