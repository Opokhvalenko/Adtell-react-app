import { createStore } from "../lib/zustand";

const API_URL = import.meta.env.DEV
	? "" // у dev підемо через Vite proxy відносними шляхами
	: (
			(import.meta.env.VITE_API_URL as string | undefined) ||
			"https://addtell-backend.onrender.com"
		).replace(/\/$/, "");

type Credentials = { email: string; password: string };

type AuthState = {
	isLoggedIn: boolean;
	isLoading: boolean;
	token: string | null;
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
		token: null,

		hydrate: async () => {
			try {
				const res = await fetch(`${API_URL}/auth/me`, {
					// ⬅️ без /api
					credentials: "include",
				});
				if (res.ok) {
					const user = await res.json();
					set({ isLoggedIn: true, token: user.token || null });
				} else {
					set({ isLoggedIn: false, token: null });
				}
			} catch {
				set({ isLoggedIn: false, token: null });
			} finally {
				set({ isLoading: false });
			}
		},

		login: async (creds) => {
			const r = await fetch(`${API_URL}/auth/login`, {
				// ⬅️
				method: "POST",
				headers: { "content-type": "application/json" },
				credentials: "include",
				body: JSON.stringify(creds),
			});
			if (!r.ok) throw new Error(await r.text());

			const me = await fetch(`${API_URL}/auth/me`, {
				// ⬅️
				credentials: "include",
			});
			if (me.ok) {
				const user = await me.json();
				set({ isLoggedIn: true, token: user.token || null, isLoading: false });
			} else {
				set({ isLoggedIn: false, token: null, isLoading: false });
			}
		},

		register: async (creds) => {
			const r = await fetch(`${API_URL}/auth/register`, {
				// ⬅️
				method: "POST",
				headers: { "content-type": "application/json" },
				credentials: "include",
				body: JSON.stringify(creds),
			});
			if (!r.ok) throw new Error(await r.text());

			const me = await fetch(`${API_URL}/auth/me`, {
				// ⬅️
				credentials: "include",
			});
			if (me.ok) {
				const user = await me.json();
				set({ isLoggedIn: true, token: user.token || null, isLoading: false });
			} else {
				set({ isLoggedIn: false, token: null, isLoading: false });
			}
		},

		logout: async () => {
			await fetch(`${API_URL}/auth/logout`, {
				// ⬅️
				method: "POST",
				credentials: "include",
			}).catch(() => {});
			set({ isLoggedIn: false, token: null });
		},
	}),
	{ label: "auth" },
);
