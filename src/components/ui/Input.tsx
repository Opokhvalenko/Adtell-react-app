import { forwardRef } from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
	label?: string;
	error?: string;
	hint?: string;
};

const base =
	"w-full rounded-lg px-3 py-2 shadow-sm bg-white dark:bg-gray-800 " +
	"text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 " +
	"placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none " +
	"focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

export default forwardRef<HTMLInputElement, Props>(function Input(
	{ id, label, error, hint, className, ...props },
	ref,
) {
	const errId = error ? `${id}-error` : undefined;
	const hintId = hint ? `${id}-hint` : undefined;

	return (
		<div>
			{label && (
				<label
					htmlFor={id}
					className="block text-sm mb-1 text-gray-700 dark:text-gray-200"
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
				<p id={errId} className="text-sm text-red-500 mt-1" aria-live="polite">
					{error}
				</p>
			)}
			{!error && hint && (
				<p id={hintId} className="text-xs text-gray-500 mt-1">
					{hint}
				</p>
			)}
		</div>
	);
});
