import { forwardRef } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
	variant?: Variant;
};

const base = [
	"inline-flex items-center justify-center gap-2 select-none",
	"px-5 py-2.5 rounded-xl text-sm font-medium",
	"transition-[transform,box-shadow,background-color,border-color,color] duration-200",
	"motion-reduce:transition-none motion-reduce:hover:transform-none",
	"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
	"ring-offset-white dark:ring-offset-slate-900",
	"disabled:opacity-50 disabled:cursor-not-allowed",
].join(" ");

const variants: Record<Variant, string> = {
	primary: [
		"text-white",
		"bg-gradient-to-r from-blue-600 to-indigo-600",
		"hover:from-blue-500 hover:to-indigo-500",
		"shadow-lg hover:shadow-xl",
		"motion-safe:hover:scale-[1.02] active:scale-95",
		"focus-visible:ring-blue-500",
		"border border-transparent",
	].join(" "),
	secondary: [
		"bg-white/95 text-slate-800",
		"border border-slate-300 shadow-sm",
		"hover:bg-white hover:shadow-md",
		"dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600 dark:hover:bg-slate-600 dark:hover:shadow-lg",
		"motion-safe:hover:translate-y-[-1px]",
		"focus-visible:ring-blue-500",
	].join(" "),
	ghost: [
		"bg-transparent text-slate-700 dark:text-slate-300",
		"hover:bg-black/5 dark:hover:bg-white/10",
		"border border-transparent",
		"focus-visible:ring-slate-400",
	].join(" "),
	danger: [
		"text-white",
		"bg-gradient-to-r from-red-600 to-rose-600",
		"hover:from-red-500 hover:to-rose-600",
		"shadow-lg hover:shadow-xl",
		"motion-safe:hover:scale-[1.02] active:scale-95",
		"focus-visible:ring-red-500",
		"border border-transparent",
	].join(" "),
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
	{ className, variant = "secondary", type = "button", ...props },
	ref,
) {
	return (
		<button
			ref={ref}
			type={type}
			className={cn(base, variants[variant], className)}
			{...props}
		/>
	);
});
