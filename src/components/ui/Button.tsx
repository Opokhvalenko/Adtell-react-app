import { forwardRef } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
const styles: Record<Variant, string> = {
	primary:
		"px-6 py-3 rounded-xl text-base font-semibold border shadow-lg transition-all duration-300 ease-in-out bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-500 hover:from-blue-500 hover:to-indigo-500 hover:shadow-xl hover:scale-105 hover:-translate-y-0.5 active:scale-95 cursor-pointer select-none backdrop-blur-sm",
	secondary:
		"px-6 py-3 rounded-xl text-base font-semibold border shadow-sm transition-all duration-300 ease-in-out bg-white/95 text-gray-800 border-gray-300 hover:bg-white hover:shadow-md hover:scale-105 hover:-translate-y-0.5 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-500 dark:hover:bg-gray-600 dark:hover:shadow-lg cursor-pointer select-none backdrop-blur-sm",
	ghost:
		"bg-transparent hover:bg-black/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300",
	danger:
		"px-6 py-3 rounded-xl text-base font-semibold border shadow-lg transition-all duration-300 ease-in-out bg-gradient-to-r from-red-600 to-red-700 text-white border-red-500 hover:from-red-500 hover:to-red-600 hover:shadow-xl hover:scale-105 hover:-translate-y-0.5 active:scale-95 cursor-pointer select-none backdrop-blur-sm",
};

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
	variant?: Variant;
};
export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
	{ className, variant = "secondary", ...props },
	ref,
) {
	return (
		<button
			ref={ref}
			className={cn(
				"inline-flex items-center justify-center gap-2 transition-all duration-200",
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ring-offset-white dark:ring-offset-gray-900",
				"disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
				styles[variant],
				className,
			)}
			{...props}
		/>
	);
});
