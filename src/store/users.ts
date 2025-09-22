import { create } from "zustand";

type User = { id: string; name: string };
type UsersState = {
	byId: Record<string, User>;
	upsert: (u: User) => void;
};

export const useUsersStore = create<UsersState>()((set) => ({
	byId: {},
	upsert: (u) => set((s) => ({ byId: { ...s.byId, [u.id]: u } })),
}));
