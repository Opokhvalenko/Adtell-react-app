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
		<div className="max-w-md mx-auto p-6 rounded-2xl border bg-white/80 dark:bg-gray-800/80 shadow">
			<h2 className="text-2xl font-bold mb-4">{title}</h2>

			{error ? (
				<div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200 px-3 py-2 text-sm">
					{error}
				</div>
			) : null}

			<Form<T>
				schema={schema}
				defaultValues={defaultValues}
				onSubmit={onSubmit}
				className="space-y-4"
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

				<Button type="submit" className="w-full" disabled={submitting}>
					{submitting ? "Please wait…" : submitLabel}
				</Button>

				{footer}
			</Form>
		</div>
	);
}
