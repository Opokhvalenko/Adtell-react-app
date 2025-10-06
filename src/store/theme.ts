import { createStore } from "../lib/zustand";

export type Theme = "light" | "dark";

const STORAGE_KEY = "theme";
const isBrowser = typeof window !== "undefined";

function preferredTheme(): Theme {
	if (!isBrowser || typeof window.matchMedia !== "function") return "light";
	return window.matchMedia("(prefers-color-scheme: dark)").matches
		? "dark"
		: "light";
}

function readInitialTheme(): Theme {
	if (!isBrowser) return "light";
	try {
		const saved = window.localStorage.getItem(STORAGE_KEY);
		if (saved === "light" || saved === "dark") return saved;
	} catch {}
	return preferredTheme();
}

function applyThemeToDOM(next: Theme) {
	if (typeof document === "undefined") return;
	const root = document.documentElement;
	const isDark = next === "dark";

	if (isDark === root.classList.contains("dark")) return;
	root.classList.toggle("dark", isDark);

	root.style.colorScheme = isDark ? "dark" : "light";
}

function persistTheme(t: Theme) {
	try {
		window.localStorage.setItem(STORAGE_KEY, t);
	} catch {
		// ignore
	}
}

export interface ThemeState {
	theme: Theme;
	ensureApplied: () => void;
	setTheme: (t: Theme) => void;
	toggleTheme: () => void;
}

let hydrated = false;

export const useThemeStore = createStore<ThemeState>(
	"theme",
	(set, get) => {
		const initial = readInitialTheme();

		if (!hydrated) {
			applyThemeToDOM(initial);
			hydrated = true;
		}

		if (isBrowser) {
			window.addEventListener("storage", (e: StorageEvent) => {
				if (e.key === STORAGE_KEY) {
					const val = e.newValue;
					if (val === "light" || val === "dark") {
						applyThemeToDOM(val);
						set({ theme: val });
					}
				}
			});
		}

		return {
			theme: initial,
			ensureApplied: () => applyThemeToDOM(get().theme),

			setTheme: (t) => {
				applyThemeToDOM(t);
				persistTheme(t);
				set({ theme: t });
				if (isBrowser) {
					window.dispatchEvent(
						new CustomEvent("themechange", { detail: { theme: t } }),
					);
				}
			},

			toggleTheme: () => {
				const next: Theme = get().theme === "dark" ? "light" : "dark";
				applyThemeToDOM(next);
				persistTheme(next);
				set({ theme: next });
				if (isBrowser) {
					window.dispatchEvent(
						new CustomEvent("themechange", { detail: { theme: next } }),
					);
				}
			},
		};
	},
	{ persist: false },
);
