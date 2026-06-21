import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { DownloadItem, DownloadStatus } from '@/types';

interface DownloadState {
  items: Record<string, DownloadItem>;
  queue: string[];
  hydrated: boolean;
  setHydrated: (value: boolean) => void;
  addDownload: (item: DownloadItem) => void;
  updateDownload: (id: string, patch: Partial<DownloadItem>) => void;
  updateStatus: (id: string, status: DownloadStatus, patch?: Partial<DownloadItem>) => void;
  removeDownload: (id: string) => void;
  setQueue: (queue: string[]) => void;
  getDownload: (id: string) => DownloadItem | undefined;
  getByMedia: (movieSlug: string, episodeSlug?: string, serverName?: string) => DownloadItem | undefined;
  getAll: () => DownloadItem[];
}

function sortQueue(queue: string[], items: Record<string, DownloadItem>): string[] {
  return [...queue].sort((a, b) => {
    const left = items[a]?.createdAt ?? 0;
    const right = items[b]?.createdAt ?? 0;
    return left - right;
  });
}

export const useDownloadStore = create<DownloadState>()(
  persist(
    (set, get) => ({
      items: {},
      queue: [],
      hydrated: false,

      setHydrated: (value) => set({ hydrated: value }),

      addDownload: (item) => {
        set(state => {
          const items = { ...state.items, [item.id]: item };
          const queue = state.queue.includes(item.id) ? state.queue : [...state.queue, item.id];
          return {
            items,
            queue: sortQueue(queue, items),
          };
        });
      },

      updateDownload: (id, patch) => {
        set(state => {
          const current = state.items[id];
          if (!current) return state;
          const next = {
            ...current,
            ...patch,
            updatedAt: Date.now(),
          };
          return {
            items: { ...state.items, [id]: next },
          };
        });
      },

      updateStatus: (id, status, patch) => {
        set(state => {
          const current = state.items[id];
          if (!current) return state;

          const next: DownloadItem = {
            ...current,
            ...patch,
            status,
            updatedAt: Date.now(),
          };

          if (status === 'completed') {
            next.downloadedAt = Date.now();
            next.downloadProgress = 100;
          }

          return {
            items: { ...state.items, [id]: next },
          };
        });
      },

      removeDownload: (id) => {
        set(state => {
          const items = { ...state.items };
          delete items[id];
          return {
            items,
            queue: state.queue.filter(itemId => itemId !== id),
          };
        });
      },

      setQueue: (queue) => {
        set(state => ({
          queue: sortQueue(queue, state.items),
        }));
      },

      getDownload: id => get().items[id],

      getByMedia: (movieSlug, episodeSlug, serverName) => {
        const items = Object.values(get().items);
        return items.find(item => (
          item.movieSlug === movieSlug
          && (item.episodeSlug ?? '') === (episodeSlug ?? '')
          && (item.serverName ?? '') === (serverName ?? '')
        ));
      },

      getAll: () => {
        const state = get();
        return state.queue
          .map(id => state.items[id])
          .filter((item): item is DownloadItem => Boolean(item));
      },
    }),
    {
      name: 'flixtor-downloads',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => state => {
        state?.setHydrated(true);
      },
    },
  ),
);
