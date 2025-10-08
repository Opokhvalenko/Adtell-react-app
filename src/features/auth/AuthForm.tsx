import type React from "react";
import type {
	DefaultValues,
	FieldPath,
	FieldValues,
	SubmitHandler,
} from "react-hook-form";
import Form from "@/components/form/Form";
import FormField from "@/components/form/FormField";
import { Button } from "@/components/ui/Button";

export type FieldConfig<T extends FieldValues> = {
	name: FieldPath<T>;
	label: string;
	type?: "text" | "email" | "password";
	autoComplete?: string;
	placeholder?: string;
	disabled?: boolean;
};

type AuthFormProps<T extends FieldValues> = {
	schema: Parameters<typeof Form<T>>[0]["schema"];
	fields: FieldConfig<T>[];
	onSubmit: SubmitHandler<T>;
	submitLabel: string;
	title: string;
	defaultValues?: DefaultValues<T>;
	footer?: React.ReactNode;
	error?: React.ReactNode;
	submitting?: boolean;
};

export default function AuthForm<T extends FieldValues>({
	schema,
	fields,
	onSubmit,
	submitLabel,
	title,
	defaultValues,
	footer,
	error,
	submitting,
}: AuthFormProps<T>) {
	return (
		<div className="w-full max-w-md mx-auto">
			<div className="border border-white/20 dark:border-gray-700/30 rounded-3xl shadow-2xl hover:shadow-2xl transition-all duration-300 backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 hover:scale-105 hover:-translate-y-1 p-8 glass-effect">
				<div className="text-center mb-8">
					<div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
						<span className="text-white text-2xl">
							{title === "Login" ? "🔑" : "📝"}
						</span>
					</div>
					<h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
						{title}
					</h2>
					<p className="text-gray-700 dark:text-gray-300">
						{title === "Login"
							? "Welcome back! Please sign in to your account"
							: "Create your account to get started"}
					</p>
				</div>

				{error ? (
					<div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800">
						<div className="flex items-center gap-2">
							<span className="text-red-500 text-lg">⚠️</span>
							<p className="text-red-700 dark:text-red-200 text-sm font-medium">
								{error}
							</p>
						</div>
					</div>
				) : null}

				<Form<T>
					schema={schema}
					defaultValues={defaultValues}
					onSubmit={onSubmit}
					className="space-y-6"
				>
					{fields.map((f) => (
						<FormField<T>
							key={String(f.name)}
							name={f.name}
							label={f.label}
							type={f.type}
							autoComplete={f.autoComplete}
							placeholder={f.placeholder}
							disabled={submitting || f.disabled}
						/>
					))}

					<Button
						type="submit"
						variant="primary"
						className="w-full"
						disabled={submitting}
					>
						{submitting ? (
							<>
								<div className="loading-spinner mr-2"></div>
								Please wait…
							</>
						) : (
							<>
								<span className="mr-2">{title === "Login" ? "🚀" : "✨"}</span>
								{submitLabel}
							</>
						)}
					</Button>

					{footer}
				</Form>
			</div>
		</div>
	);
}
