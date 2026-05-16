import { create } from "zustand";
import { devtools } from "zustand/middleware";

export type TabType = "add-sale"; // extend as needed

export interface Tab {
	id: string;
	type: TabType;
	title: string;
	props?: Record<string, unknown>; // pass any data the tab needs
	isDirty?: boolean; // unsaved changes indicator (like vscode •)
}

const MAX_TABS = 5;

interface TabStore {
	tabs: Tab[];
	activeTabId: string | null;
	openTab: (tab: Omit<Tab, "id">) => void;
	closeTab: (id: string) => void;
	setActiveTab: (id: string) => void;
	closeAllTabs: () => void;
}

export const useTabStore = create<TabStore>()(
	devtools(
		(set, get) => ({
			tabs: [],
			activeTabId: null,

			openTab: (tabConfig) => {
				const { tabs } = get();
				if (tabs.length >= MAX_TABS) {
					alert("Maximum of 5 tabs allowed"); // replace with your toast
					return;
				}
				const newTab: Tab = { ...tabConfig, id: crypto.randomUUID() };
				set(
					{ tabs: [...tabs, newTab], activeTabId: newTab.id },
					false,
					"openTab",
				);
			},

			closeTab: (id) => {
				const { tabs, activeTabId } = get();
				const idx = tabs.findIndex((t) => t.id === id);
				const remaining = tabs.filter((t) => t.id !== id);

				// activate the nearest tab after closing
				let nextActive = activeTabId;
				if (activeTabId === id) {
					nextActive =
						remaining[idx]?.id ?? remaining[idx - 1]?.id ?? null;
				}

				set({ tabs: remaining, activeTabId: nextActive }, false, "closeTab");
			},

			setActiveTab: (id) =>
				set({ activeTabId: id }, false, "setActiveTab"),

			closeAllTabs: () =>
				set({ tabs: [], activeTabId: null }, false, "closeAllTabs"),
		}),
		{ name: "TabStore" },
	),
);
