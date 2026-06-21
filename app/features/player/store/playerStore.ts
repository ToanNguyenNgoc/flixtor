// ============================================================
// PLAYER STORE — Stub (replaced by WatchHistoryStore)
// ============================================================
// This store is no longer the primary store for video tracking.
// Progress saving is now handled by useWatchHistoryStore.
import { create } from 'zustand';

interface PlayerStoreState {
  isPlaying: boolean;
  setIsPlaying: (value: boolean) => void;
}

export const usePlayerStore = create<PlayerStoreState>(set => ({
  isPlaying: false,
  setIsPlaying: (value: boolean) => set({ isPlaying: value }),
}));
