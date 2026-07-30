import { create } from 'zustand';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import AuthService, { getAuthErrorMessage } from '@/features/auth/services/authService';
import {
  ACCESS_TOKEN_REFRESH_BUFFER_MS,
  buildPersistedAuthSession,
  isTokenExpired,
} from '@/features/auth/utils/authSession';
import {
  setTokenRefreshHandler,
  setUnauthorizedHandler,
} from '@/services/api/axiosClient';
import {
  getItem,
  removeItem,
  setItem,
  StorageKeys,
  TokenStorage,
} from '@/utils/storage';
import type { PersistedAuthSession, User } from '@/types';

type AuthProvider = 'credentials' | 'google' | null;

interface SessionPayload {
  authProvider?: Exclude<AuthProvider, null>;
  expiresIn?: string;
  refreshExpiresIn?: string;
  refreshToken?: string | null;
  token: string;
  user: User;
}

interface RefreshTokenPayload {
  expiresIn?: string;
  refreshExpiresIn?: string;
  refreshToken?: string;
  token: string;
}

interface PersistedTokenResult extends PersistedAuthSession {
  refreshToken: string | null;
}

interface AuthState {
  accessTokenExpiresAt: number | null;
  authProvider: AuthProvider;
  isAuthenticated: boolean;
  isCheckingAuth: boolean;
  isLoading: boolean;
  refreshToken: string | null;
  refreshTokenExpiresAt: number | null;
  token: string | null;
  user: User | null;
  getProfile: () => Promise<User>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<string>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  restoreSession: () => Promise<void>;
  setAuthSession: (session: SessionPayload) => Promise<void>;
}

const emptyAuthState = {
  accessTokenExpiresAt: null,
  authProvider: null,
  refreshToken: null,
  refreshTokenExpiresAt: null,
  token: null,
  user: null,
  isAuthenticated: false,
};

function getPersistedSessionFromState(
  state: Pick<AuthState, 'accessTokenExpiresAt' | 'refreshTokenExpiresAt'>,
): PersistedAuthSession {
  return {
    accessTokenExpiresAt: state.accessTokenExpiresAt,
    refreshTokenExpiresAt: state.refreshTokenExpiresAt,
  };
}

async function persistSession({
  authProvider = 'credentials',
  expiresIn,
  refreshExpiresIn,
  refreshToken,
  token,
  user,
}: SessionPayload): Promise<PersistedTokenResult> {
  const persistedSession = buildPersistedAuthSession({
    expiresIn,
    refreshExpiresIn,
  });

  await Promise.all([
    TokenStorage.setAccessToken(token),
    refreshToken
      ? TokenStorage.setRefreshToken(refreshToken)
      : TokenStorage.removeRefreshToken(),
    TokenStorage.setAuthSession(persistedSession),
    setItem(StorageKeys.AUTH_PROVIDER, authProvider),
    setItem(StorageKeys.USER, user),
  ]);

  return {
    ...persistedSession,
    refreshToken: refreshToken ?? null,
  };
}

async function persistRefreshedTokens({
  currentRefreshToken,
  currentSession,
  expiresIn,
  refreshExpiresIn,
  refreshToken,
  token,
}: RefreshTokenPayload & {
  currentRefreshToken: string | null;
  currentSession: PersistedAuthSession;
}): Promise<PersistedTokenResult> {
  const refreshedSession = buildPersistedAuthSession({
    expiresIn,
    refreshExpiresIn,
  });
  const nextRefreshToken = refreshToken?.trim().length ? refreshToken.trim() : currentRefreshToken;
  const persistedSession: PersistedAuthSession = {
    accessTokenExpiresAt: refreshedSession.accessTokenExpiresAt,
    refreshTokenExpiresAt: refreshedSession.refreshTokenExpiresAt ?? currentSession.refreshTokenExpiresAt,
  };

  await Promise.all([
    TokenStorage.setAccessToken(token),
    nextRefreshToken
      ? TokenStorage.setRefreshToken(nextRefreshToken)
      : TokenStorage.removeRefreshToken(),
    TokenStorage.setAuthSession(persistedSession),
  ]);

  return {
    ...persistedSession,
    refreshToken: nextRefreshToken ?? null,
  };
}

async function clearPersistedSession(): Promise<void> {
  await Promise.all([
    TokenStorage.removeAccessToken(),
    TokenStorage.removeRefreshToken(),
    TokenStorage.removeAuthSession(),
    removeItem(StorageKeys.AUTH_PROVIDER),
    removeItem(StorageKeys.USER),
    removeItem(StorageKeys.SELECTED_PROFILE),
  ]);
}

export const useAuthStore = create<AuthState>((set, get) => ({
  ...emptyAuthState,
  isLoading: false,
  isCheckingAuth: false,

  setAuthSession: async session => {
    const persistedTokens = await persistSession(session);

    set({
      accessTokenExpiresAt: persistedTokens.accessTokenExpiresAt,
      authProvider: session.authProvider ?? 'credentials',
      token: session.token,
      refreshToken: persistedTokens.refreshToken,
      refreshTokenExpiresAt: persistedTokens.refreshTokenExpiresAt,
      user: session.user,
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
        expiresIn: response.expiresIn,
        refreshExpiresIn: response.refreshExpiresIn,
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
        expiresIn: response.expiresIn,
        refreshExpiresIn: response.refreshExpiresIn,
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

  refreshSession: async () => {
    const state = get();
    const [currentRefreshToken, storedSession] = await Promise.all([
      state.refreshToken ?? TokenStorage.getRefreshToken(),
      (state.accessTokenExpiresAt !== null || state.refreshTokenExpiresAt !== null)
        ? Promise.resolve(getPersistedSessionFromState(state))
        : TokenStorage.getAuthSession(),
    ]);

    if (!currentRefreshToken) {
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }

    const currentSession = storedSession ?? {
      accessTokenExpiresAt: null,
      refreshTokenExpiresAt: null,
    };

    if (isTokenExpired(currentSession.refreshTokenExpiresAt)) {
      throw new Error('Refresh token đã hết hạn. Vui lòng đăng nhập lại.');
    }

    const [storedUser, authProvider] = await Promise.all([
      state.user ? Promise.resolve(state.user) : getItem<User>(StorageKeys.USER),
      state.authProvider
        ? Promise.resolve(state.authProvider)
        : getItem<Exclude<AuthProvider, null>>(StorageKeys.AUTH_PROVIDER),
    ]);
    const response = await AuthService.refreshToken({
      refreshToken: currentRefreshToken,
    });
    const persistedTokens = await persistRefreshedTokens({
      token: response.token,
      refreshToken: response.refreshToken,
      expiresIn: response.expiresIn,
      refreshExpiresIn: response.refreshExpiresIn,
      currentRefreshToken,
      currentSession,
    });

    set({
      accessTokenExpiresAt: persistedTokens.accessTokenExpiresAt,
      authProvider: authProvider ?? 'credentials',
      token: response.token,
      refreshToken: persistedTokens.refreshToken,
      refreshTokenExpiresAt: persistedTokens.refreshTokenExpiresAt,
      user: storedUser ?? null,
      isAuthenticated: true,
    });

    return response.token;
  },

  getProfile: async () => {
    const [currentToken, currentRefreshToken] = await Promise.all([
      get().token ?? TokenStorage.getAccessToken(),
      get().refreshToken ?? TokenStorage.getRefreshToken(),
    ]);

    if (!currentToken && !currentRefreshToken) {
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }

    try {
      const response = await AuthService.getMe();
      const latestState = get();

      await setItem(StorageKeys.USER, response.user);
      set({
        token: latestState.token ?? currentToken ?? null,
        refreshToken: latestState.refreshToken ?? currentRefreshToken ?? null,
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
      const [token, refreshToken, authProvider, storedUser, storedSession] = await Promise.all([
        TokenStorage.getAccessToken(),
        TokenStorage.getRefreshToken(),
        getItem<AuthProvider>(StorageKeys.AUTH_PROVIDER),
        getItem<User>(StorageKeys.USER),
        TokenStorage.getAuthSession(),
      ]);

      if (!token && !refreshToken) {
        set({
          ...emptyAuthState,
          isCheckingAuth: false,
        });
        return;
      }

      set({
        accessTokenExpiresAt: storedSession?.accessTokenExpiresAt ?? null,
        authProvider: authProvider ?? 'credentials',
        token: token ?? null,
        refreshToken: refreshToken ?? null,
        refreshTokenExpiresAt: storedSession?.refreshTokenExpiresAt ?? null,
        user: storedUser,
        isAuthenticated: true,
      });

      if (!token || isTokenExpired(storedSession?.accessTokenExpiresAt, ACCESS_TOKEN_REFRESH_BUFFER_MS)) {
        await get().refreshSession();
      }

      const response = await AuthService.getMe();
      const latestState = get();

      await setItem(StorageKeys.USER, response.user);
      set({
        accessTokenExpiresAt: latestState.accessTokenExpiresAt,
        authProvider: latestState.authProvider ?? authProvider ?? 'credentials',
        token: latestState.token ?? token ?? null,
        refreshToken: latestState.refreshToken ?? refreshToken ?? null,
        refreshTokenExpiresAt: latestState.refreshTokenExpiresAt,
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

setTokenRefreshHandler(async () => {
  return useAuthStore.getState().refreshSession();
});

setUnauthorizedHandler(async () => {
  const state = useAuthStore.getState();

  if (!state.token && !state.refreshToken && !state.isAuthenticated) {
    return;
  }

  await clearPersistedSession();
  useAuthStore.setState({
    ...emptyAuthState,
    isLoading: false,
    isCheckingAuth: false,
  });
});
