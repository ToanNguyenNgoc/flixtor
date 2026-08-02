import { create } from 'zustand';
import { getItem, setItem, StorageKeys } from '@/utils/storage';

export type ManualLandscapeOrientationPreference = 'left' | 'right';

interface StoredPlayerPreferences {
  manualLandscapeOrientation?: ManualLandscapeOrientationPreference;
  pictureInPictureEnabled?: boolean;
}

interface PlayerPreferencesState {
  isHydrated: boolean;
  manualLandscapeOrientation: ManualLandscapeOrientationPreference;
  pictureInPictureEnabled: boolean;
  initialize: () => Promise<void>;
  setManualLandscapeOrientation: (
    value: ManualLandscapeOrientationPreference,
  ) => Promise<void>;
  setPictureInPictureEnabled: (value: boolean) => Promise<void>;
}

export const DEFAULT_MANUAL_LANDSCAPE_ORIENTATION: ManualLandscapeOrientationPreference = 'left';
export const DEFAULT_PICTURE_IN_PICTURE_ENABLED = true;

function normalizePlayerPreferences(value: unknown): StoredPlayerPreferences {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return value as StoredPlayerPreferences;
}

function resolveManualLandscapeOrientation(
  value: unknown,
): ManualLandscapeOrientationPreference {
  return value === 'right' ? 'right' : DEFAULT_MANUAL_LANDSCAPE_ORIENTATION;
}

function resolvePictureInPictureEnabled(value: unknown): boolean {
  return typeof value === 'boolean' ? value : DEFAULT_PICTURE_IN_PICTURE_ENABLED;
}

let hydratePromise: Promise<void> | null = null;

async function persistPlayerPreferences(
  preferences: StoredPlayerPreferences,
): Promise<void> {
  await setItem<StoredPlayerPreferences>(StorageKeys.PLAYER_PREFERENCES, preferences);
}

export const usePlayerPreferencesStore = create<PlayerPreferencesState>((set, get) => ({
  isHydrated: false,
  manualLandscapeOrientation: DEFAULT_MANUAL_LANDSCAPE_ORIENTATION,
  pictureInPictureEnabled: DEFAULT_PICTURE_IN_PICTURE_ENABLED,

  initialize: async () => {
    if (get().isHydrated) {
      return;
    }

    if (hydratePromise) {
      return hydratePromise;
    }

    hydratePromise = (async () => {
      try {
        const rawPreferences = await getItem<unknown>(StorageKeys.PLAYER_PREFERENCES);
        const preferences = normalizePlayerPreferences(rawPreferences);

        set({
          manualLandscapeOrientation: resolveManualLandscapeOrientation(
            preferences.manualLandscapeOrientation,
          ),
          pictureInPictureEnabled: resolvePictureInPictureEnabled(
            preferences.pictureInPictureEnabled,
          ),
          isHydrated: true,
        });
      } catch (error) {
        console.warn('[PlayerPreferences] Failed to hydrate preferences.', error);
        set({ isHydrated: true });
      } finally {
        hydratePromise = null;
      }
    })();

    return hydratePromise;
  },

  setManualLandscapeOrientation: async value => {
    const pictureInPictureEnabled = get().pictureInPictureEnabled;

    set({ manualLandscapeOrientation: value });
    await persistPlayerPreferences({
      manualLandscapeOrientation: value,
      pictureInPictureEnabled,
    });
  },

  setPictureInPictureEnabled: async value => {
    const manualLandscapeOrientation = get().manualLandscapeOrientation;

    set({ pictureInPictureEnabled: value });
    await persistPlayerPreferences({
      manualLandscapeOrientation,
      pictureInPictureEnabled: value,
    });
  },
}));
