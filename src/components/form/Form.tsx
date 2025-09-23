import type React from "react";
import {
	type DefaultValues,
	type FieldValues,
	FormProvider,
	type SubmitHandler,
	type UseFormReturn,
	useForm,
} from "react-hook-form";
import { zodResolverCompat } from "./zodResolverCompat";

type Props<TFieldValues extends FieldValues> = {
	schema: Parameters<typeof zodResolverCompat<TFieldValues>>[0];
	defaultValues?: DefaultValues<TFieldValues>;
	onSubmit: SubmitHandler<TFieldValues>;
	className?: string;
	children?:
		| React.ReactNode
		| ((
				methods: UseFormReturn<TFieldValues, unknown, TFieldValues>,
		  ) => React.ReactNode);
	mode?: "onSubmit" | "onBlur" | "onChange" | "onTouched" | "all";
};

export default function Form<TFieldValues extends FieldValues>({
	schema,
	defaultValues,
	onSubmit,
	className,
	children,
	mode = "onTouched",
}: Props<TFieldValues>) {
	const methods = useForm<TFieldValues, unknown, TFieldValues>({
		resolver: zodResolverCompat<TFieldValues>(schema),
		defaultValues,
		mode,
	});

	const rendered =
		typeof children === "function"
			? (
					children as (
						m: UseFormReturn<TFieldValues, unknown, TFieldValues>,
					) => React.ReactNode
				)(methods)
			: children;

	return (
		<FormProvider
			{...(methods as UseFormReturn<TFieldValues, unknown, TFieldValues>)}
		>
			<form
				className={className}
				onSubmit={methods.handleSubmit(onSubmit)}
				noValidate
			>
				{rendered}
			</form>
		</FormProvider>
	);
}
