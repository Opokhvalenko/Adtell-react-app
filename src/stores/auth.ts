import { create } from "zustand";

export type AuthState = {
  isLoggedIn: boolean;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
  hydrate: () => Promise<void>;
};

const TOKEN_KEY = "token";

export const useAuth = create<AuthState>((set) => ({
  isLoggedIn: false,
  isLoading: true,

  // демо-логін: збережемо токен, щоб переживав перезавантаження сторінки
  login: () => {
    localStorage.setItem(TOKEN_KEY, "1");
    set({ isLoggedIn: true });
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    set({ isLoggedIn: false });
  },

  // одноразова гідратація під час старту застосунку
  hydrate: async () => {
    try {
      const hasToken = !!localStorage.getItem(TOKEN_KEY);
      set({ isLoggedIn: hasToken });
    } finally {
      set({ isLoading: false });
    }
  },
}));