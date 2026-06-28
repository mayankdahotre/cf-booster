import { create } from 'zustand';
import type { UserSettings, SearchResult } from '@/types';

interface AppState {
  sidebarOpen: boolean;
  commandPaletteOpen: boolean;
  searchQuery: string;
  searchResults: SearchResult[];
  initialized: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: SearchResult[]) => void;
  setInitialized: (initialized: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: true,
  commandPaletteOpen: false,
  searchQuery: '',
  searchResults: [],
  initialized: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSearchResults: (results) => set({ searchResults: results }),
  setInitialized: (initialized) => set({ initialized }),
}));

interface SettingsState {
  settings: UserSettings | null;
  setSettings: (settings: UserSettings) => void;
  updateSettings: (partial: Partial<UserSettings>) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: null,
  setSettings: (settings) => set({ settings }),
  updateSettings: (partial) =>
    set((s) => ({
      settings: s.settings ? { ...s.settings, ...partial } : null,
    })),
}));
