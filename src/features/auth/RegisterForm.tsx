import { useNavigate } from "react-router-dom";
import { useAuth } from "@/store/auth";
import AuthForm from "./AuthForm";
import { RegisterSchema, type RegisterValues } from "./schemas";

export default function RegisterForm() {
	const navigate = useNavigate();
	const { login } = useAuth();

	return (
		<AuthForm<RegisterValues>
			title="Sign up"
			schema={RegisterSchema}
			submitLabel="Create account"
			fields={[
				{ name: "name", label: "Name", autoComplete: "name" },
				{ name: "email", label: "Email", type: "email", autoComplete: "email" },
				{
					name: "password",
					label: "Password",
					type: "password",
					autoComplete: "new-password",
				},
				{
					name: "confirmPassword",
					label: "Confirm Password",
					type: "password",
					autoComplete: "new-password",
				},
			]}
			onSubmit={async (_values) => {
				await login();
				navigate("/", { replace: true });
			}}
		/>
	);
}
