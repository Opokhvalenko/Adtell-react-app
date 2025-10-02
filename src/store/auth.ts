import { createStore } from "../lib/zustand";

const API_URL = import.meta.env.DEV
	? ""
	: (
			(import.meta.env.VITE_API_URL as string | undefined) ||
			"http://127.0.0.1:3000"
		).replace(/\/$/, "");

type Credentials = { email: string; password: string };

type AuthState = {
	isLoggedIn: boolean;
	isLoading: boolean;
	hydrate: () => Promise<void>;
	login: (creds: Credentials) => Promise<void>;
	register: (creds: Credentials) => Promise<void>;
	logout: () => Promise<void>;
};

export const useAuth = createStore<AuthState>(
	"auth",
	(set) => ({
		isLoggedIn: false,
		isLoading: true,

		hydrate: async () => {
			try {
				const res = await fetch(`${API_URL}/auth/me`, {
					credentials: "include",
				});
				set({ isLoggedIn: res.ok });
			} finally {
				set({ isLoading: false });
			}
		},

		login: async (creds) => {
			const r = await fetch(`${API_URL}/auth/login`, {
				method: "POST",
				headers: { "content-type": "application/json" },
				credentials: "include",
				body: JSON.stringify(creds),
			});
			if (!r.ok) throw new Error(await r.text());

			// критично: одразу перевіряємо, що cookie застосувались
			const me = await fetch(`${API_URL}/auth/me`, { credentials: "include" });
			set({ isLoggedIn: me.ok });
		},

		register: async (creds) => {
			const r = await fetch(`${API_URL}/auth/register`, {
				method: "POST",
				headers: { "content-type": "application/json" },
				credentials: "include",
				body: JSON.stringify(creds),
			});
			if (!r.ok) throw new Error(await r.text());

			const me = await fetch(`${API_URL}/auth/me`, { credentials: "include" });
			set({ isLoggedIn: me.ok });
		},

		logout: async () => {
			await fetch(`${API_URL}/auth/logout`, {
				method: "POST",
				credentials: "include",
			}).catch(() => {});
			set({ isLoggedIn: false });
		},
	}),
	{ label: "auth" },
);
