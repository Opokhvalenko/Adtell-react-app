import { createStore } from "../lib/zustand";

type Theme = "light" | "dark";

function readInitialTheme(): Theme {
	try {
		if (typeof window === "undefined") return "light";
		const saved = localStorage.getItem("theme");
		if (saved === "light" || saved === "dark") return saved;
		if (typeof window.matchMedia === "function") {
			return window.matchMedia("(prefers-color-scheme: dark)").matches
				? "dark"
				: "light";
		}
	} catch {
		/* ignore */
	}
	return "light";
}

function applyThemeToDOM(t: Theme) {
	if (typeof document !== "undefined") {
		document.documentElement.classList.toggle("dark", t === "dark");
	}
	try {
		localStorage.setItem("theme", t);
	} catch {
		/* ignore */
	}
}

interface ThemeState {
	theme: Theme;
	ensureApplied: () => void;
	setTheme: (t: Theme) => void;
	toggleTheme: () => void;
}

export const useThemeStore = createStore<ThemeState>(
	"theme",
	(set, get) => {
		const initial = readInitialTheme();
		return {
			theme: initial,
			ensureApplied: () => applyThemeToDOM(get().theme),
			setTheme: (t) => {
				applyThemeToDOM(t);
				set({ theme: t });
			},
			toggleTheme: () => {
				const next: Theme = get().theme === "dark" ? "light" : "dark";
				applyThemeToDOM(next);
				set({ theme: next });
			},
		};
	},
	{ persist: false },
);
