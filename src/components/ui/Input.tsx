import { forwardRef, useId } from "react";
import { cn } from "@/lib/cn";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
	label?: string;
	error?: string;
	hint?: string;
};

export default forwardRef<HTMLInputElement, Props>(function Input(
	{ id, label, error, hint, className, required, type = "text", ...props },
	ref,
) {
	const uid = useId();
	const inputId = id ?? `in-${uid}`;
	const errId = error ? `${inputId}-error` : undefined;
	const hintId = hint ? `${inputId}-hint` : undefined;

	const base = cn(
		"block w-full rounded-lg px-3 py-2.5 text-sm shadow-sm",

		"bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300",
		"dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600",

		"focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",

		"disabled:opacity-50 disabled:cursor-not-allowed",
	);

	const invalid = !!error;
	const invalidClasses = invalid
		? "border-red-500 dark:border-red-500 focus:ring-red-500"
		: "";

	return (
		<div className="space-y-2">
			{label && (
				<label
					htmlFor={inputId}
					className="block text-sm font-semibold text-slate-700 dark:text-slate-200"
				>
					{label}
					{required ? <span className="ml-0.5 text-red-600">*</span> : null}
				</label>
			)}

			<input
				ref={ref}
				id={inputId}
				type={type}
				required={required}
				aria-invalid={invalid || undefined}
				aria-describedby={
					[errId, hintId].filter(Boolean).join(" ") || undefined
				}
				aria-errormessage={invalid ? errId : undefined}
				className={cn(base, invalidClasses, className)}
				{...props}
			/>

			{invalid ? (
				<div className="flex items-start gap-2" role="alert" aria-live="polite">
					<span className="mt-0.5 text-red-500 text-sm">⚠️</span>
					<p id={errId} className="text-sm text-red-600 dark:text-red-400">
						{error}
					</p>
				</div>
			) : hint ? (
				<p id={hintId} className="text-xs text-slate-500 dark:text-slate-400">
					{hint}
				</p>
			) : null}
		</div>
	);
});
