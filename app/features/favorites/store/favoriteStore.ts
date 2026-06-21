import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import type { FavoriteMovie } from '@/types';

function getFavoriteKey(uid?: string) {
  return `favorites:${uid ?? 'guest'}`;
}

interface FavoriteState {
  favorites: FavoriteMovie[];
  loadFavorites: (uid?: string) => Promise<void>;
  toggleFavorite: (movie: FavoriteMovie, uid?: string) => Promise<void>;
  isFavorite: (slug: string) => boolean;
  removeFavorite: (slug: string, uid?: string) => Promise<void>;
  clearFavorites: (uid?: string) => Promise<void>;
}

export const useFavoriteStore = create<FavoriteState>((set, get) => ({
  favorites: [],

  loadFavorites: async (uid) => {
    try {
      const raw = await AsyncStorage.getItem(getFavoriteKey(uid));
      set({ favorites: raw ? JSON.parse(raw) : [] });
    } catch {
      set({ favorites: [] });
    }
  },

  toggleFavorite: async (movie, uid) => {
    const current = get().favorites;
    const exists = current.some(item => item.slug === movie.slug);
    const next = exists
      ? current.filter(item => item.slug !== movie.slug)
      : [{ ...movie, updatedAt: Date.now() }, ...current];
    set({ favorites: next });
    try {
      await AsyncStorage.setItem(getFavoriteKey(uid), JSON.stringify(next));
    } catch { /* ignore */ }
  },

  isFavorite: (slug) => get().favorites.some(item => item.slug === slug),

  removeFavorite: async (slug, uid) => {
    const next = get().favorites.filter(item => item.slug !== slug);
    set({ favorites: next });
    try {
      await AsyncStorage.setItem(getFavoriteKey(uid), JSON.stringify(next));
    } catch { /* ignore */ }
  },

  clearFavorites: async (uid) => {
    set({ favorites: [] });
    try {
      await AsyncStorage.removeItem(getFavoriteKey(uid));
    } catch { /* ignore */ }
  },
}));
