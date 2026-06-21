// ============================================================
// STORAGE UTILITIES — AsyncStorage wrappers
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';

export const StorageKeys = {
  ACCESS_TOKEN: '@flixtor/access_token',
  REFRESH_TOKEN: '@flixtor/refresh_token',
  AUTH_PROVIDER: '@flixtor/auth_provider',
  USER: '@flixtor/user',
  SELECTED_PROFILE: '@flixtor/selected_profile',
  MY_LIST: '@flixtor/my_list',
  CONTINUE_WATCHING: '@flixtor/continue_watching',
  DOWNLOAD_QUEUE: '@flixtor/download_queue',
  APP_SETTINGS: '@flixtor/app_settings',
  SEARCH_HISTORY: '@flixtor/search_history',
} as const;

type StorageKey = (typeof StorageKeys)[keyof typeof StorageKeys];
const AUTH_TOKEN_SERVICE = 'com.flixtor.auth.access-token';
const AUTH_TOKEN_ACCOUNT = 'access-token';

let cachedAccessToken: string | null | undefined;

/**
 * Store a value (auto JSON stringifies objects)
 */
export const setItem = async <T>(key: StorageKey, value: T): Promise<void> => {
  try {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    await AsyncStorage.setItem(key, serialized);
  } catch (error) {
    console.error(`[Storage] Failed to set "${key}":`, error);
  }
};

/**
 * Get a value (auto JSON parses if not a string)
 */
export const getItem = async <T>(key: StorageKey): Promise<T | null> => {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return raw as unknown as T;
    }
  } catch (error) {
    console.error(`[Storage] Failed to get "${key}":`, error);
    return null;
  }
};

/**
 * Remove a value
 */
export const removeItem = async (key: StorageKey): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error(`[Storage] Failed to remove "${key}":`, error);
  }
};

/**
 * Clear all app storage
 */
export const clearAll = async (): Promise<void> => {
  try {
    const keys = Object.values(StorageKeys);
    await AsyncStorage.multiRemove(keys);
  } catch (error) {
    console.error('[Storage] Failed to clear all:', error);
  }
};

/**
 * Get multiple items at once
 */
export const multiGet = async <T>(keys: StorageKey[]): Promise<Record<string, T | null>> => {
  try {
    const pairs = await AsyncStorage.multiGet(keys);
    return pairs.reduce((acc, [key, value]) => {
      try {
        acc[key] = value ? (JSON.parse(value) as T) : null;
      } catch {
        acc[key] = value as unknown as T;
      }
      return acc;
    }, {} as Record<string, T | null>);
  } catch (error) {
    console.error('[Storage] Failed to multiGet:', error);
    return {};
  }
};

/**
 * Token-specific helpers
 */
export const TokenStorage = {
  getAccessToken: async (): Promise<string | null> => {
    if (cachedAccessToken !== undefined) {
      return cachedAccessToken;
    }

    try {
      const credentials = await Keychain.getGenericPassword({
        service: AUTH_TOKEN_SERVICE,
      });

      if (credentials) {
        cachedAccessToken = credentials.password;
        await removeItem(StorageKeys.ACCESS_TOKEN);
        return cachedAccessToken;
      }
    } catch (error) {
      console.warn('[Storage] Failed to read secure token, falling back to AsyncStorage.', error);
    }

    const legacyToken = await getItem<string>(StorageKeys.ACCESS_TOKEN);

    if (legacyToken) {
      cachedAccessToken = legacyToken;
      await TokenStorage.setAccessToken(legacyToken);
      await removeItem(StorageKeys.ACCESS_TOKEN);
      return legacyToken;
    }

    cachedAccessToken = null;
    return null;
  },
  setAccessToken: async (token: string) => {
    cachedAccessToken = token;

    try {
      await Keychain.setGenericPassword(AUTH_TOKEN_ACCOUNT, token, {
        service: AUTH_TOKEN_SERVICE,
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
      await removeItem(StorageKeys.ACCESS_TOKEN);
      return;
    } catch (error) {
      console.warn('[Storage] Failed to write secure token, using AsyncStorage fallback.', error);
    }

    await setItem(StorageKeys.ACCESS_TOKEN, token);
  },
  removeAccessToken: async () => {
    cachedAccessToken = null;

    try {
      await Keychain.resetGenericPassword({
        service: AUTH_TOKEN_SERVICE,
      });
    } catch (error) {
      console.warn('[Storage] Failed to clear secure token.', error);
    }

    await removeItem(StorageKeys.ACCESS_TOKEN);
  },
  getRefreshToken: () => getItem<string>(StorageKeys.REFRESH_TOKEN),
  setRefreshToken: (token: string) => setItem(StorageKeys.REFRESH_TOKEN, token),
  removeRefreshToken: () => removeItem(StorageKeys.REFRESH_TOKEN),
};
