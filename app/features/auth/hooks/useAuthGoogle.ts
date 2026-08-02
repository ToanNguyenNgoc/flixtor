import { useState } from 'react';
import { Platform } from 'react-native';
import { CommonActions, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  GoogleSignin,
  isCancelledResponse,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import AuthService from '@/features/auth/services/authService';
import { useAuthStore } from '@/features/auth/store/authStore';
import type { GoogleUserInfo } from '@/types';
import type { RootStackParamList as AppRootStackParamList } from '@/navigation/types';

let isGoogleSigninConfigured = false;
const AUTH_ROUTE_NAMES = new Set<keyof AppRootStackParamList>([
  'Login',
  'Register',
  'ForgotPassword',
  'ResetPassword',
]);

function ensureGoogleSigninConfigured() {
  if (isGoogleSigninConfigured) {
    return;
  }

  GoogleSignin.configure();
  isGoogleSigninConfigured = true;
}

function normalizeGoogleUser(googleUser: GoogleUserInfo) {
  const email = googleUser.email?.trim() ?? '';
  const id = googleUser.id?.trim() ?? '';
  const name = googleUser.name?.trim() || email;

  if (!email) {
    throw new Error('Không lấy được email từ tài khoản Google.');
  }

  if (!id) {
    throw new Error('Không lấy được mã định danh Google.');
  }

  return {
    email,
    familyName: googleUser.familyName?.trim() ?? '',
    givenName: googleUser.givenName?.trim() ?? '',
    id,
    name,
    photo: googleUser.photo?.trim() ?? '',
  };
}

function getGoogleErrorMessage(error: unknown): string {
  if (isErrorWithCode(error)) {
    switch (error.code) {
      case statusCodes.IN_PROGRESS:
        return 'Đăng nhập Google đang được xử lý. Vui lòng chờ một chút.';
      case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
        return 'Google Play Services chưa sẵn sàng trên thiết bị này.';
      default:
        break;
    }
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return 'Không thể đăng nhập với Google. Vui lòng thử lại.';
}

interface UseAuthGoogleResult {
  clearGoogleError: () => void;
  googleError: string | null;
  googleLoadingMessage: string | null;
  isGoogleBackendLoading: boolean;
  isGoogleLoading: boolean;
  signInWithGoogle: () => Promise<boolean>;
}

export function useAuthGoogle(): UseAuthGoogleResult {
  const navigation = useNavigation() as unknown as NativeStackNavigationProp<AppRootStackParamList>;
  const setAuthSession = useAuthStore(state => state.setAuthSession);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleLoadingMessage, setGoogleLoadingMessage] = useState<string | null>(null);
  const [isGoogleBackendLoading, setIsGoogleBackendLoading] = useState(false);

  const clearGoogleError = () => {
    if (googleError) {
      setGoogleError(null);
    }
  };

  const signInWithGoogle = async (): Promise<boolean> => {
    setGoogleError(null);
    setIsGoogleLoading(true);
    setIsGoogleBackendLoading(false);
    setGoogleLoadingMessage('Đang mở Google để xác thực tài khoản...');

    try {
      ensureGoogleSigninConfigured();

      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      }

      const response = await GoogleSignin.signIn();

      if (isCancelledResponse(response)) {
        return false;
      }

      if (!isSuccessResponse(response)) {
        setGoogleError('Không thể lấy thông tin đăng nhập Google.');
        return false;
      }

      const payload = normalizeGoogleUser(response.data.user);
      setIsGoogleBackendLoading(true);
      setGoogleLoadingMessage('Đang đăng nhập vào Flixtor bằng tài khoản Google...');
      const backendResponse = await AuthService.googleLogin(payload);

      await setAuthSession({
        authProvider: 'google',
        token: backendResponse.token,
        refreshToken: backendResponse.refreshToken,
        expiresIn: backendResponse.expiresIn,
        refreshExpiresIn: backendResponse.refreshExpiresIn,
        user: backendResponse.user,
      });

      console.info('[Auth][Google] Signed in user:', {
        email: payload.email,
        name: payload.name,
      });

      const state = navigation.getState();
      let nearestNonAuthRouteIndex = -1;

      for (let index = state.index - 1; index >= 0; index -= 1) {
        const routeName = state.routes[index]?.name as keyof AppRootStackParamList | undefined;

        if (routeName && !AUTH_ROUTE_NAMES.has(routeName)) {
          nearestNonAuthRouteIndex = index;
          break;
        }
      }

      if (nearestNonAuthRouteIndex >= 0) {
        navigation.dispatch(
          CommonActions.reset({
            ...state,
            index: nearestNonAuthRouteIndex,
            routes: state.routes.slice(0, nearestNonAuthRouteIndex + 1),
          }),
        );
        return true;
      }

      navigation.reset({
        index: 0,
        routes: [{ name: 'RootTabs', params: { screen: 'Profile' } }],
      });

      return true;
    } catch (error) {
      setGoogleError(getGoogleErrorMessage(error));
      return false;
    } finally {
      setGoogleLoadingMessage(null);
      setIsGoogleBackendLoading(false);
      setIsGoogleLoading(false);
    }
  };

  return {
    clearGoogleError,
    googleError,
    googleLoadingMessage,
    isGoogleBackendLoading,
    isGoogleLoading,
    signInWithGoogle,
  };
}
