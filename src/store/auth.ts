import { deleteCookie, getCookie, setCookie } from "../lib/cookies";
import { createStore } from "../lib/zustand";

type AuthState = {
	isLoggedIn: boolean;
	isLoading: boolean;
	login: (token?: string) => Promise<void>;
	logout: () => Promise<void>;
	hydrate: () => Promise<void>;
};

const TOKEN_KEY = "token";

export const useAuth = createStore<AuthState>(
	"auth",
	(set) => ({
		isLoggedIn: false,
		isLoading: true,

		login: async (token = "1") => {
			await setCookie(TOKEN_KEY, token, {
				days: 7,
				sameSite: "lax",
				secure: true,
			});
			set({ isLoggedIn: true });
		},

		logout: async () => {
			await deleteCookie(TOKEN_KEY, "/");
			set({ isLoggedIn: false });
		},

		hydrate: async () => {
			try {
				const token = await getCookie(TOKEN_KEY);
				set({ isLoggedIn: !!token });
			} finally {
				set({ isLoading: false });
			}
		},
	}),
	{ label: "auth" },
);
