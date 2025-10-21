import { Switch } from "@headlessui/react";
import { useEffect } from "react";
import { cn } from "@/lib/cn";
import { type Theme, useThemeStore } from "@/store/theme";

export default function ThemeToggle({ className }: { className?: string }) {
	const theme = useThemeStore((s) => s.theme);
	const isDark = useThemeStore((s) => s.isDark);
	const setTheme = useThemeStore((s) => s.setTheme);
	const setSystem = useThemeStore((s) => s.setSystem);
	const ensureApplied = useThemeStore((s) => s.ensureApplied);

	useEffect(() => {
		ensureApplied();
	}, [ensureApplied]);

	const onSwitch = (checked: boolean) => {
		const next: Theme = checked ? "dark" : "light";
		setTheme(next);
	};

	const label =
		theme === "system" ? "System" : theme === "dark" ? "Dark" : "Light";

	return (
		<div className={cn("flex items-center gap-2", className)}>
			<Switch
				checked={isDark}
				onChange={onSwitch}
				className={cn(
					"relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 shadow-lg",
					isDark
						? "bg-gradient-to-r from-emerald-500 to-cyan-500"
						: "bg-gray-200 dark:bg-gray-700",
				)}
				title={`Theme: ${label}`}
			>
				<span
					className={cn(
						"absolute left-1 top-1/2 -translate-y-1/2 text-xs transition-opacity duration-200",
						isDark ? "opacity-0" : "opacity-100",
					)}
				>
					☀️
				</span>
				<span
					className={cn(
						"inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-300",
						isDark ? "translate-x-6" : "translate-x-1",
					)}
				/>
				<span
					className={cn(
						"absolute right-1 top-1/2 -translate-y-1/2 text-xs transition-opacity duration-200",
						isDark ? "opacity-100" : "opacity-0",
					)}
				>
					🌙
				</span>
			</Switch>

			<button
				type="button"
				onClick={setSystem}
				className={cn(
					"rounded-md px-2.5 py-1 text-xs border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800",
					theme === "system" && "ring-2 ring-emerald-500 ring-offset-2",
				)}
				title="Follow system theme"
			>
				System
			</button>
		</div>
	);
}
