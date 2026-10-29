import { create } from 'zustand';
import { getItem, setItem, StorageKeys } from '@/utils/storage';

interface FaphouseState {
  /** Faphouse mặc định ẩn; chỉ bật khi nhập đúng mã ở màn tìm kiếm. */
  isEnabled: boolean;
  isHydrated: boolean;
  initialize: () => Promise<void>;
  enable: () => Promise<void>;
  disable: () => Promise<void>;
}

async function persistEnabled(value: boolean): Promise<void> {
  try {
    await setItem<boolean>(StorageKeys.FAPHOUSE_ENABLED, value);
  } catch (error) {
    console.warn('[Faphouse] Failed to persist enabled flag.', error);
  }
}

export const useFaphouseStore = create<FaphouseState>((set, get) => ({
  isEnabled: false,
  isHydrated: false,

  initialize: async () => {
    if (get().isHydrated) {
      return;
    }

    try {
      const stored = await getItem<unknown>(StorageKeys.FAPHOUSE_ENABLED);
      set({ isEnabled: stored === true, isHydrated: true });
    } catch (error) {
      console.warn('[Faphouse] Failed to hydrate enabled flag.', error);
      set({ isHydrated: true });
    }
  },

  enable: async () => {
    set({ isEnabled: true });
    await persistEnabled(true);
  },

  disable: async () => {
    set({ isEnabled: false });
    await persistEnabled(false);
  },
}));
