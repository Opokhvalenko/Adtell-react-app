import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/store/auth";
import AuthForm from "./AuthForm";
import { LoginSchema, type LoginValues } from "./schemas";

export default function LoginForm() {
	const navigate = useNavigate();
	const { login } = useAuth();

	return (
		<AuthForm<LoginValues>
			title="Login"
			schema={LoginSchema}
			submitLabel="Login"
			fields={[
				{ name: "email", label: "Email", type: "email", autoComplete: "email" },
				{
					name: "password",
					label: "Password",
					type: "password",
					autoComplete: "current-password",
				},
			]}
			onSubmit={async (_values) => {
				await login();
				navigate("/", { replace: true });
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
