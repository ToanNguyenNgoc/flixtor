import { create } from 'zustand';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import AuthService, { getAuthErrorMessage } from '@/features/auth/services/authService';
import { setUnauthorizedHandler } from '@/services/api/axiosClient';
import {
  getItem,
  removeItem,
  setItem,
  StorageKeys,
  TokenStorage,
} from '@/utils/storage';
import type { User } from '@/types';

type AuthProvider = 'credentials' | 'google' | null;

interface AuthState {
  authProvider: AuthProvider;
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isCheckingAuth: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  setAuthSession: (session: {
    authProvider?: Exclude<AuthProvider, null>;
    refreshToken?: string | null;
    token: string;
    user: User;
  }) => Promise<void>;
  logout: () => Promise<void>;
  getProfile: () => Promise<User>;
  restoreSession: () => Promise<void>;
}

const emptyAuthState = {
  authProvider: null,
  token: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,
};

async function persistSession(
  token: string,
  user: User,
  refreshToken?: string | null,
  authProvider: Exclude<AuthProvider, null> = 'credentials',
): Promise<void> {
  await TokenStorage.setAccessToken(token);

  if (refreshToken) {
    await TokenStorage.setRefreshToken(refreshToken);
  } else {
    await TokenStorage.removeRefreshToken();
  }

  await setItem(StorageKeys.AUTH_PROVIDER, authProvider);
  await setItem(StorageKeys.USER, user);
}

async function clearPersistedSession(): Promise<void> {
  await Promise.all([
    TokenStorage.removeAccessToken(),
    TokenStorage.removeRefreshToken(),
    removeItem(StorageKeys.AUTH_PROVIDER),
    removeItem(StorageKeys.USER),
    removeItem(StorageKeys.SELECTED_PROFILE),
  ]);
}

export const useAuthStore = create<AuthState>((set, get) => ({
  ...emptyAuthState,
  isLoading: false,
  isCheckingAuth: false,

  setAuthSession: async ({ token, user, refreshToken, authProvider = 'credentials' }) => {
    await persistSession(token, user, refreshToken, authProvider);

    set({
      authProvider,
      token,
      refreshToken: refreshToken ?? null,
      user,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  login: async (email, password) => {
    const normalizedEmail = email.trim();
    const normalizedPassword = password.trim();

    if (!normalizedEmail) {
      throw new Error('Vui lòng nhập email.');
    }

    if (!normalizedPassword) {
      throw new Error('Vui lòng nhập mật khẩu.');
    }

    set({ isLoading: true });

    try {
      const response = await AuthService.login({
        email: normalizedEmail,
        password,
      });

      await get().setAuthSession({
        token: response.token,
        refreshToken: response.refreshToken,
        user: response.user,
        authProvider: 'credentials',
      });
    } catch (error) {
      await clearPersistedSession();
      set({
        ...emptyAuthState,
        isLoading: false,
        isCheckingAuth: false,
      });
      throw new Error(getAuthErrorMessage(error));
    }
  },

  register: async (email, password, displayName) => {
    const normalizedEmail = email.trim();
    const normalizedPassword = password.trim();
    const normalizedDisplayName = displayName.trim();

    if (!normalizedEmail) {
      throw new Error('Vui lòng nhập email.');
    }

    if (!/\S+@\S+\.\S+/.test(normalizedEmail)) {
      throw new Error('Email không đúng định dạng.');
    }

    if (!normalizedDisplayName) {
      throw new Error('Vui lòng nhập tên hiển thị.');
    }

    if (!normalizedPassword) {
      throw new Error('Vui lòng nhập mật khẩu.');
    }

    if (normalizedPassword.length < 6) {
      throw new Error('Mật khẩu phải có ít nhất 6 ký tự.');
    }

    set({ isLoading: true });

    try {
      const response = await AuthService.register({
        email: normalizedEmail,
        password,
        displayName: normalizedDisplayName,
      });

      await get().setAuthSession({
        token: response.token,
        refreshToken: response.refreshToken,
        user: response.user,
        authProvider: 'credentials',
      });
    } catch (error) {
      await clearPersistedSession();
      set({
        ...emptyAuthState,
        isLoading: false,
        isCheckingAuth: false,
      });
      throw new Error(getAuthErrorMessage(error));
    }
  },

  logout: async () => {
    set({ isLoading: true });

    try {
      if (get().authProvider === 'google') {
        await GoogleSignin.signOut().catch(() => null);
      }

      await AuthService.logout();
    } finally {
      await clearPersistedSession();
      set({
        ...emptyAuthState,
        isLoading: false,
        isCheckingAuth: false,
      });
    }
  },

  getProfile: async () => {
    const currentToken = get().token ?? await TokenStorage.getAccessToken();

    if (!currentToken) {
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }

    try {
      const response = await AuthService.getMe();

      await setItem(StorageKeys.USER, response.user);
      set({
        token: currentToken,
        user: response.user,
        isAuthenticated: true,
      });

      return response.user;
    } catch (error) {
      throw new Error(getAuthErrorMessage(error));
    }
  },

  restoreSession: async () => {
    set({ isCheckingAuth: true });

    try {
      const [token, refreshToken, authProvider] = await Promise.all([
        TokenStorage.getAccessToken(),
        TokenStorage.getRefreshToken(),
        getItem<AuthProvider>(StorageKeys.AUTH_PROVIDER),
      ]);

      if (!token) {
        set({
          ...emptyAuthState,
          isCheckingAuth: false,
        });
        return;
      }

      set({
        authProvider: authProvider ?? 'credentials',
        token,
        refreshToken: refreshToken ?? null,
        isAuthenticated: true,
      });

      const response = await AuthService.getMe();
      await setItem(StorageKeys.USER, response.user);

      set({
        authProvider: authProvider ?? 'credentials',
        token,
        refreshToken: refreshToken ?? null,
        user: response.user,
        isAuthenticated: true,
        isCheckingAuth: false,
      });
    } catch {
      await clearPersistedSession();
      set({
        ...emptyAuthState,
        isCheckingAuth: false,
      });
    }
  },
}));

setUnauthorizedHandler(async () => {
  const state = useAuthStore.getState();

  if (!state.token && !state.isAuthenticated) {
    return;
  }

  await clearPersistedSession();
  useAuthStore.setState({
    ...emptyAuthState,
    isLoading: false,
    isCheckingAuth: false,
  });
});
