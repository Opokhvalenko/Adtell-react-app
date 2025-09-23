import {
	type FieldPath,
	type FieldValues,
	get,
	useFormContext,
} from "react-hook-form";
import Input from "../ui/Input";

type Props<T extends FieldValues> = {
	name: FieldPath<T>;
	label?: string;
	type?: "text" | "email" | "password";
	autoComplete?: string;
	placeholder?: string;
	disabled?: boolean;
};

export default function FormField<T extends FieldValues>({
	name,
	label,
	type = "text",
	autoComplete,
	placeholder,
	disabled,
}: Props<T>) {
	const {
		register,
		formState: { errors },
	} = useFormContext<T>();

	const err = get(errors, name) as { message?: string } | undefined;

	return (
		<Input
			{...register(name)}
			label={label}
			type={type}
			autoComplete={autoComplete}
			placeholder={placeholder}
			disabled={disabled}
			error={err?.message}
		/>
	);
}
