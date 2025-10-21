import { createStore } from "../lib/zustand";

export type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "theme";
const isBrowser = typeof window !== "undefined";
const media = isBrowser
	? window.matchMedia("(prefers-color-scheme: dark)")
	: null;

function computeIsDark(theme: Theme): boolean {
	const prefersDark = media?.matches ?? false;
	return theme === "dark" || (theme === "system" && prefersDark);
}

function readStored(): Theme {
	if (!isBrowser) return "system";
	try {
		const saved = window.localStorage.getItem(STORAGE_KEY);
		if (saved === "light" || saved === "dark" || saved === "system")
			return saved;
	} catch {}
	return "system";
}

function applyThemeToDOM(theme: Theme) {
	if (typeof document === "undefined") return;
	const isDark = computeIsDark(theme);
	const root = document.documentElement;
	root.classList.toggle("dark", isDark);
	root.style.colorScheme = isDark ? "dark" : "light";
}

function persistTheme(t: Theme) {
	try {
		window.localStorage.setItem(STORAGE_KEY, t);
	} catch {}
}

export interface ThemeState {
	theme: Theme;
	isDark: boolean;
	ensureApplied: () => void;
	setTheme: (t: Theme) => void;
	toggleTheme: () => void;
	setSystem: () => void;
	setLight: () => void;
	setDark: () => void;
}

let hydrated = false;

export const useThemeStore = createStore<ThemeState>(
	"theme",
	(set, get) => {
		const boot = (isBrowser ? window.__THEME_BOOT__ : undefined) as
			| { saved: Theme; wantDark: boolean }
			| undefined;

		const initialTheme: Theme = boot?.saved ?? readStored();
		const initialDark =
			typeof boot?.wantDark === "boolean"
				? boot.wantDark
				: computeIsDark(initialTheme);

		if (!hydrated) {
			applyThemeToDOM(initialTheme);
			hydrated = true;
		}

		if (media) {
			media.addEventListener("change", () => {
				const t = get().theme;
				if (t === "system") {
					applyThemeToDOM(t);
					set({ isDark: computeIsDark(t) });
				}
			});
		}

		if (isBrowser) {
			window.addEventListener("storage", (e: StorageEvent) => {
				if (e.key === STORAGE_KEY) {
					const t = readStored();
					applyThemeToDOM(t);
					set({ theme: t, isDark: computeIsDark(t) });
				}
			});
		}

		return {
			theme: initialTheme,
			isDark: initialDark,

			ensureApplied: () => {
				const t = get().theme;
				applyThemeToDOM(t);
				set({ isDark: computeIsDark(t) });
			},

			setTheme: (t) => {
				persistTheme(t);
				applyThemeToDOM(t);
				set({ theme: t, isDark: computeIsDark(t) });
				if (isBrowser) {
					window.dispatchEvent(
						new CustomEvent("themechange", { detail: { theme: t } }),
					);
				}
			},

			toggleTheme: () => {
				const cur = get().theme;
				const currentIsDark = computeIsDark(cur);
				const next: Theme = currentIsDark ? "light" : "dark";
				get().setTheme(next);
			},

			setSystem: () => get().setTheme("system"),
			setLight: () => get().setTheme("light"),
			setDark: () => get().setTheme("dark"),
		};
	},
	{ persist: false },
);
