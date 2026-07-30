import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import { ACCESS_TOKEN_REFRESH_BUFFER_MS, isTokenExpired } from '@/features/auth/utils/authSession';
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
  _retry?: boolean;
}

export interface ApiRequestConfig extends AxiosRequestConfig {
  skipAuth?: boolean;
}

type UnauthorizedHandler = () => void | Promise<void>;
type TokenRefreshTrigger = 'preflight' | 'unauthorized';
type TokenRefreshHandler = (trigger: TokenRefreshTrigger) => Promise<string | null>;

let unauthorizedHandler: UnauthorizedHandler | null = null;
let tokenRefreshHandler: TokenRefreshHandler | null = null;
let refreshPromise: Promise<string | null> | null = null;

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

export function setTokenRefreshHandler(handler: TokenRefreshHandler | null): void {
  tokenRefreshHandler = handler;
}

async function runTokenRefresh(trigger: TokenRefreshTrigger): Promise<string | null> {
  if (!tokenRefreshHandler) {
    return null;
  }

  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        return await tokenRefreshHandler(trigger);
      } finally {
        refreshPromise = null;
      }
    })();
  }

  return refreshPromise;
}

async function getAccessTokenForRequest(currentToken: string | null): Promise<string | null> {
  const [refreshToken, authSession] = await Promise.all([
    TokenStorage.getRefreshToken(),
    TokenStorage.getAuthSession(),
  ]);
  const shouldTryRefresh = Boolean(refreshToken)
    && (
      !currentToken
      || isTokenExpired(authSession?.accessTokenExpiresAt, ACCESS_TOKEN_REFRESH_BUFFER_MS)
    );

  if (!shouldTryRefresh) {
    return currentToken;
  }

  try {
    const refreshedToken = await runTokenRefresh('preflight');
    return refreshedToken ?? currentToken;
  } catch (error) {
    if (currentToken && !isTokenExpired(authSession?.accessTokenExpiresAt)) {
      console.warn('[API] Failed to refresh access token before request. Using current token.', error);
      return currentToken;
    }

    if (unauthorizedHandler) {
      await unauthorizedHandler();
    }

    throw error;
  }
}

export const apiClient = axios.create({
  baseURL: DEFAULT_BASE_URL,
  timeout: 20000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'x-platform':'app',
  },
});

// Request interceptor — attach Bearer token nếu có
apiClient.interceptors.request.use(async (config: AppRequestConfig) => {
  try {
    if (config.skipAuth) {
      return config;
    }

    const currentToken = await TokenStorage.getAccessToken();
    const token = await getAccessTokenForRequest(currentToken);

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

    if (status === 401 && requestConfig && !requestConfig.skipAuth) {
      if (!requestConfig._retry) {
        requestConfig._retry = true;

        try {
          const refreshedToken = await runTokenRefresh('unauthorized');

          if (refreshedToken) {
            requestConfig.headers.Authorization = `Bearer ${refreshedToken}`;
            return apiClient(requestConfig);
          }
        } catch (refreshError) {
          console.warn('[API] Failed to refresh access token after 401.', refreshError);
        }
      }

      if (unauthorizedHandler) {
        await unauthorizedHandler();
      }
    }

    return Promise.reject(error);
  },
);

export const get = <T>(url: string, config?: ApiRequestConfig) => apiClient.get<T>(url, config);
export const post = <T>(url: string, data?: unknown, config?: ApiRequestConfig) => apiClient.post<T>(url, data, config);
export const put = <T>(url: string, data?: unknown, config?: ApiRequestConfig) => apiClient.put<T>(url, data, config);
export const del = <T>(url: string, config?: ApiRequestConfig) => apiClient.delete<T>(url, config);

export default apiClient;
