import { Switch } from "@headlessui/react";
import { useEffect } from "react";
import { cn } from "@/lib/cn";
import { useThemeStore } from "@/store";

export default function ThemeToggle({ className }: { className?: string }) {
	const { theme, toggleTheme, ensureApplied } = useThemeStore();

	useEffect(() => {
		ensureApplied();
	}, [ensureApplied]);

	const enabled = theme === "dark";

	return (
		<Switch
			checked={enabled}
			onChange={toggleTheme}
			title={enabled ? "Light Mode" : "Dark Mode"}
			aria-label="Toggle theme"
			className={cn(
				"relative inline-flex h-6 w-11 items-center rounded-full transition",
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
				"focus-visible:ring-offset-2 ring-offset-white dark:ring-offset-gray-900",
				"motion-safe:duration-200",
				enabled ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600",
				className,
			)}
		>
			<span
				className={cn(
					"pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition",
					"motion-safe:duration-200",
					enabled ? "translate-x-5" : "translate-x-1",
				)}
			/>
			<span className="sr-only">Toggle theme</span>
		</Switch>
	);
}
