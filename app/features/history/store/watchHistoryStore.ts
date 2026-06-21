import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import type { LocalWatchHistoryItem } from '@/types';

function getHistoryKey(uid?: string) {
  return `watchHistory:${uid ?? 'guest'}`;
}

function getHistoryId(slug: string, episodeSlug?: string) {
  return `${slug}:${episodeSlug ?? 'default'}`;
}

const MAX_HISTORY = 200;

interface WatchHistoryState {
  items: LocalWatchHistoryItem[];
  loadHistory: (uid?: string) => Promise<void>;
  saveProgress: (item: LocalWatchHistoryItem, uid?: string) => Promise<void>;
  removeHistory: (slug: string, episodeSlug?: string, uid?: string) => Promise<void>;
  clearHistory: (uid?: string) => Promise<void>;
  getResumeProgress: (slug: string, episodeSlug?: string) => number;
}

export const useWatchHistoryStore = create<WatchHistoryState>((set, get) => ({
  items: [],

  loadHistory: async (uid) => {
    try {
      const raw = await AsyncStorage.getItem(getHistoryKey(uid));
      set({ items: raw ? JSON.parse(raw) : [] });
    } catch {
      set({ items: [] });
    }
  },

  saveProgress: async (item, uid) => {
    const current = get().items;
    const id = getHistoryId(item.slug, item.episodeSlug);
    const normalized: LocalWatchHistoryItem = {
      ...item,
      progress: Math.max(0, item.progress ?? 0),
      duration: Math.max(0, item.duration ?? 0),
      percent:
        item.duration > 0
          ? Math.min(100, Math.round((item.progress / item.duration) * 100))
          : 0,
      lastWatchedAt: Date.now(),
    };
    const next = [
      normalized,
      ...current.filter(old => getHistoryId(old.slug, old.episodeSlug) !== id),
    ].slice(0, MAX_HISTORY);
    set({ items: next });
    try {
      await AsyncStorage.setItem(getHistoryKey(uid), JSON.stringify(next));
    } catch { /* ignore */ }
  },

  removeHistory: async (slug, episodeSlug, uid) => {
    const id = getHistoryId(slug, episodeSlug);
    const next = get().items.filter(
      item => getHistoryId(item.slug, item.episodeSlug) !== id,
    );
    set({ items: next });
    try {
      await AsyncStorage.setItem(getHistoryKey(uid), JSON.stringify(next));
    } catch { /* ignore */ }
  },

  clearHistory: async (uid) => {
    set({ items: [] });
    try {
      await AsyncStorage.removeItem(getHistoryKey(uid));
    } catch { /* ignore */ }
  },

  getResumeProgress: (slug, episodeSlug) => {
    const id = getHistoryId(slug, episodeSlug);
    const item = get().items.find(
      h => getHistoryId(h.slug, h.episodeSlug) === id,
    );
    if (!item) return 0;
    // Resume nếu progress > 30s VÀ còn hơn 60s
    if (item.progress > 30 && item.duration - item.progress > 60) {
      return item.progress;
    }
    return 0;
  },
}));
