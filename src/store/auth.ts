import { apiLogout, fetchMe } from "../lib/auth";
import { safeLocalStorage } from "../lib/safe-storage";
import { createStore } from "../lib/zustand";

/** Older builds persisted the whole auth store, including a session token, under this key. */
const LEGACY_PERSIST_KEY = "auth";
safeLocalStorage.removeItem(LEGACY_PERSIST_KEY);

type AuthState = {
	isLoggedIn: boolean;
	isLoading: boolean;
	hydrate: () => Promise<void>;
	logout: () => Promise<void>;
};

/**
 * Only UI state: the session itself is in httpOnly cookies, so nothing here is persisted and no
 * token is ever readable by JavaScript.
 */
export const useAuth = createStore<AuthState>(
	"auth",
	(set) => ({
		isLoggedIn: false,
		isLoading: true,

		hydrate: async () => {
			try {
				set({ isLoggedIn: (await fetchMe()) !== null });
			} catch {
				set({ isLoggedIn: false });
			} finally {
				set({ isLoading: false });
			}
		},

		logout: async () => {
			await apiLogout().catch(() => {});
			set({ isLoggedIn: false });
		},
	}),
	{ label: "auth", persist: false },
);
