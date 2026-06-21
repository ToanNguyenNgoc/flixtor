// ============================================================
// MY LIST STORE — DEPRECATED (replaced by favoriteStore)
// ============================================================
import { create } from 'zustand';

interface MyListState {
  initialize: () => Promise<void>;
}

export const useMyListStore = create<MyListState>(() => ({
  initialize: async () => { /* noop — use favoriteStore */ },
}));
