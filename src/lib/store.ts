// src/lib/store.ts
import { create } from "zustand";

type Theme = "light" | "dark";
interface ThemeState {
	theme: Theme;
	setTheme: (t: Theme) => void;
	toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
	theme: (() => {
		const saved = localStorage.getItem("theme");
		if (saved === "light" || saved === "dark") return saved;
		return window.matchMedia("(prefers-color-scheme: dark)").matches
			? "dark"
			: "light";
	})(),
	setTheme: (t) => {
		localStorage.setItem("theme", t);
		document.documentElement.classList.toggle("dark", t === "dark");
		set({ theme: t });
	},
	toggleTheme: () => {
		const next = get().theme === "dark" ? "light" : "dark";
		localStorage.setItem("theme", next);
		document.documentElement.classList.toggle("dark", next === "dark");
		set({ theme: next });
	},
}));
