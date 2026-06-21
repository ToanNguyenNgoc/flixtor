import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import {
  getItem,
  setItem,
  StorageKeys,
  TokenStorage,
} from '@/utils/storage';

export type ApiServerKey = 'flixApi' | 'phimApi';

interface AppSettingsStorage {
  apiServer?: ApiServerKey;
}

const API_SERVER_BASE_URLS: Record<ApiServerKey, string> = {
  flixApi: 'https://flix-api.longdc.click',
  phimApi: 'https://phimapi.com',
};

interface AppRequestConfig extends InternalAxiosRequestConfig {
  skipAuth?: boolean;
}

export interface ApiRequestConfig extends AxiosRequestConfig {
  skipAuth?: boolean;
}

type UnauthorizedHandler = () => void | Promise<void>;

let unauthorizedHandler: UnauthorizedHandler | null = null;

export const API_SERVER_OPTIONS = [
  {
    key: 'flixApi',
    label: 'Flix API',
    description: 'Server mặc định nội bộ',
    baseUrl: API_SERVER_BASE_URLS.flixApi,
  },
  {
    key: 'phimApi',
    label: 'Phim API',
    description: 'Server công khai gốc',
    baseUrl: API_SERVER_BASE_URLS.phimApi,
  },
] as const satisfies ReadonlyArray<{
  key: ApiServerKey;
  label: string;
  description: string;
  baseUrl: string;
}>;

export const DEFAULT_API_SERVER_KEY: ApiServerKey = 'flixApi';
export const DEFAULT_BASE_URL = API_SERVER_BASE_URLS[DEFAULT_API_SERVER_KEY];

function isApiServerKey(value: unknown): value is ApiServerKey {
  return value === 'flixApi' || value === 'phimApi';
}

function normalizeAppSettings(value: unknown): AppSettingsStorage {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as AppSettingsStorage;
  }

  return {};
}

function applyApiServer(serverKey: ApiServerKey): void {
  apiClient.defaults.baseURL = API_SERVER_BASE_URLS[serverKey];
}

export async function getStoredApiServer(): Promise<ApiServerKey> {
  const rawSettings = await getItem<unknown>(StorageKeys.APP_SETTINGS);
  const settings = normalizeAppSettings(rawSettings);

  return isApiServerKey(settings.apiServer) ? settings.apiServer : DEFAULT_API_SERVER_KEY;
}

export async function initializeApiServer(): Promise<ApiServerKey> {
  const serverKey = await getStoredApiServer();
  applyApiServer(serverKey);
  return serverKey;
}

export async function setApiServer(serverKey: ApiServerKey): Promise<void> {
  const rawSettings = await getItem<unknown>(StorageKeys.APP_SETTINGS);
  const settings = normalizeAppSettings(rawSettings);

  applyApiServer(serverKey);

  await setItem<AppSettingsStorage>(StorageKeys.APP_SETTINGS, {
    ...settings,
    apiServer: serverKey,
  });
}

export function getCurrentBaseUrl(): string {
  return apiClient.defaults.baseURL ?? DEFAULT_BASE_URL;
}

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  unauthorizedHandler = handler;
}

export const apiClient = axios.create({
  baseURL: DEFAULT_BASE_URL,
  timeout: 20000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach Bearer token nếu có
apiClient.interceptors.request.use(async (config: AppRequestConfig) => {
  try {
    if (config.skipAuth) {
      return config;
    }

    const token = await TokenStorage.getAccessToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.warn('[API] Failed to attach access token.', error);
  }

  return config;
});

// Response interceptor — basic error handling
apiClient.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const requestConfig = error.config as AppRequestConfig | undefined;
    const status = error.response?.status;
    const method = requestConfig?.method?.toUpperCase() ?? 'REQUEST';
    const url = requestConfig?.url ?? 'unknown-url';

    if (status && status >= 400) {
      console.warn(`[API] ${method} ${url} failed with status ${status}.`);
    } else if (error.code) {
      console.warn(`[API] ${method} ${url} failed with code ${error.code}.`);
    }

    if (status === 401 && !requestConfig?.skipAuth && unauthorizedHandler) {
      await unauthorizedHandler();
    }

    return Promise.reject(error);
  },
);

export const get = <T>(url: string, config?: ApiRequestConfig) => apiClient.get<T>(url, config);
export const post = <T>(url: string, data?: unknown, config?: ApiRequestConfig) => apiClient.post<T>(url, data, config);
export const put = <T>(url: string, data?: unknown, config?: ApiRequestConfig) => apiClient.put<T>(url, data, config);
export const del = <T>(url: string, config?: ApiRequestConfig) => apiClient.delete<T>(url, config);

export default apiClient;
