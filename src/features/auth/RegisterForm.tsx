import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRegister } from "@/lib/auth";
import { toMessage } from "@/lib/httpError";
import { useAuth } from "@/store/auth";
import AuthForm from "./AuthForm";
import { RegisterSchema, type RegisterValues } from "./schemas";

export default function RegisterForm() {
	const navigate = useNavigate();
	const { hydrate } = useAuth();
	const [pending, setPending] = useState(false);
	const [err, setErr] = useState<string | null>(null);

	return (
		<AuthForm<RegisterValues>
			title="Sign up"
			schema={RegisterSchema}
			submitLabel="Create account"
			submitting={pending}
			error={err}
			fields={[
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
			onSubmit={async (values) => {
				setErr(null);
				setPending(true);
				try {
					await apiRegister(values.email.trim(), values.password);
				} catch (e) {
					setErr(toMessage(e, "Registration failed"));
					setPending(false);
					return;
				}
				// Registration already starts the session (cookies), no separate login needed
				await hydrate();
				setPending(false);
				navigate("/", { replace: true });
			}}
		/>
	);
}
