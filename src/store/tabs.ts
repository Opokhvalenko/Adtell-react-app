import { shallow } from "zustand/shallow";
import { createWithEqualityFn } from "zustand/traditional";

type Tab = { id: string; title: string };
type TabsState = {
	tabs: Tab[];
	activeId?: string;
	open: (t: Tab) => void;
	close: (id: string) => void;
	setActive: (id: string) => void;
};

export const useTabsStore = createWithEqualityFn<TabsState>()((set, _get) => ({
	tabs: [],
	activeId: undefined,

	open: (t) =>
		set((s) => ({
			tabs: s.tabs.some((x) => x.id === t.id) ? s.tabs : [...s.tabs, t],
			activeId: t.id,
		})),

	close: (id) =>
		set((s) => {
			const tabs = s.tabs.filter((x) => x.id !== id);
			const nextActive =
				s.activeId === id ? tabs[Math.max(0, tabs.length - 1)]?.id : s.activeId;
			return { tabs, activeId: nextActive };
		}),

	setActive: (id) => set({ activeId: id }),
}));

export const useActiveTabId = () => useTabsStore((s) => s.activeId, shallow);
