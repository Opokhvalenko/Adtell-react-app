import { create } from "zustand";

type Theme = "light" | "dark";

function getInitialTheme(): Theme {
	try {
		// SSR / тести
		if (typeof window === "undefined") return "light";

		const saved = localStorage.getItem("theme");
		if (saved === "light" || saved === "dark") return saved;

		if (typeof window.matchMedia === "function") {
			return window.matchMedia("(prefers-color-scheme: dark)").matches
				? "dark"
				: "light";
		}
		return "light";
	} catch {
		return "light";
	}
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
	setTheme: (t: Theme) => void;
	toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => {
	const initial = getInitialTheme();
	// синхронізуємо DOM одразу при створенні стора
	applyThemeToDOM(initial);

	return {
		theme: initial,
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
});
