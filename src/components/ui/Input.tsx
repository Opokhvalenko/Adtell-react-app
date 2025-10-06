import { forwardRef } from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
	label?: string;
	error?: string;
	hint?: string;
};

const base = "w-full input-field";

export default forwardRef<HTMLInputElement, Props>(function Input(
	{ id, label, error, hint, className, ...props },
	ref,
) {
	const errId = error ? `${id}-error` : undefined;
	const hintId = hint ? `${id}-hint` : undefined;

	return (
		<div className="space-y-2">
			{label && (
				<label
					htmlFor={id}
					className="block text-sm font-semibold text-gray-700 dark:text-gray-200"
				>
					{label}
				</label>
			)}
			<input
				ref={ref}
				id={id}
				aria-invalid={!!error}
				aria-describedby={
					[errId, hintId].filter(Boolean).join(" ") || undefined
				}
				className={`${base} ${className ?? ""}`}
				{...props}
			/>
			{error && (
				<div className="flex items-center gap-2">
					<span className="text-red-500 text-sm">⚠️</span>
					<p
						id={errId}
						className="text-sm text-red-500 font-medium"
						aria-live="polite"
					>
						{error}
					</p>
				</div>
			)}
			{!error && hint && (
				<p id={hintId} className="text-xs text-gray-500 dark:text-gray-400">
					{hint}
				</p>
			)}
		</div>
	);
});
