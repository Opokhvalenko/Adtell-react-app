import { forwardRef } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost";
const styles: Record<Variant, string> = {
	primary:
		"bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600",
	secondary:
		"bg-white text-gray-900 border border-gray-300 hover:bg-white/90 dark:bg-white/10 dark:text-gray-100 dark:border-white/20",
	ghost: "bg-transparent hover:bg-black/5 dark:hover:bg-white/10",
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
				"inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium shadow-sm",
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ring-offset-white dark:ring-offset-gray-900",
				styles[variant],
				className,
			)}
			{...props}
		/>
	);
});
