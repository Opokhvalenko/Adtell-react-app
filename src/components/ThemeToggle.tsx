import { Switch } from "@headlessui/react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { useThemeStore } from "../store/theme";
export default function ThemeToggle({ className }: { className?: string }) {
	const { theme, toggleTheme, ensureApplied } = useThemeStore();
	const [isTransitioning, setIsTransitioning] = useState(false);
	useEffect(() => {
		ensureApplied();
	}, [ensureApplied]);
	const enabled = theme === "dark";
	const handleToggle = () => {
		console.log("Current theme:", theme);
		setIsTransitioning(true);
		setTimeout(() => {
			toggleTheme();
			console.log("Theme toggled to:", theme === "dark" ? "light" : "dark");
			setTimeout(() => setIsTransitioning(false), 300);
		}, 100);
	};
	return (
		<div className="relative">
			<Switch
				checked={enabled}
				onChange={handleToggle}
				className={cn(
					"relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 shadow-lg",
					isTransitioning ? "opacity-50" : "opacity-100",
					enabled
						? "bg-gradient-to-r from-emerald-500 to-cyan-500"
						: "bg-gray-200 dark:bg-gray-700",
					className,
				)}
			>
				<span
					className={cn(
						"absolute left-1 top-1/2 -translate-y-1/2 text-xs transition-opacity duration-200",
						enabled ? "opacity-0" : "opacity-100",
					)}
				>
					☀️
				</span>
				<span
					className={cn(
						"inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-300",
						enabled ? "translate-x-6" : "translate-x-1",
					)}
				/>
				<span
					className={cn(
						"absolute right-1 top-1/2 -translate-y-1/2 text-xs transition-opacity duration-200",
						enabled ? "opacity-100" : "opacity-0",
					)}
				>
					🌙
				</span>
			</Switch>
		</div>
	);
}
