import type { LinkingOptions } from '@react-navigation/native';
import { Linking } from 'react-native';
import type { RootStackParamList } from './types';

const HTTP_RESET_LINK_PREFIX = 'http://link-flixtor.vercel.app';
const HTTPS_RESET_LINK_PREFIX = 'https://link-flixtor.vercel.app';
const RESET_PASSWORD_SCREEN = 'reset-password';
const DEDUPE_WINDOW_MS = 1500;

let lastHandledUrl: string | null = null;
let lastHandledTimestamp = 0;

function normalizeIncomingUrl(url: string): string {
  if (!url.startsWith(HTTPS_RESET_LINK_PREFIX) && !url.startsWith(HTTP_RESET_LINK_PREFIX)) {
    return url;
  }

  try {
    const parsedUrl = new URL(url);
    const screen = parsedUrl.searchParams.get('screen');
    const token = parsedUrl.searchParams.get('token')?.trim();

    if (screen !== RESET_PASSWORD_SCREEN) {
      return url;
    }

    return token
      ? `flixtor://reset-password/${encodeURIComponent(token)}`
      : 'flixtor://reset-password';
  } catch {
    return url;
  }
}

function shouldHandleUrl(url: string): boolean {
  const now = Date.now();

  if (lastHandledUrl === url && now - lastHandledTimestamp < DEDUPE_WINDOW_MS) {
    return false;
  }

  lastHandledUrl = url;
  lastHandledTimestamp = now;
  return true;
}

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [
    'flixtor://',
    HTTPS_RESET_LINK_PREFIX,
    HTTP_RESET_LINK_PREFIX,
  ],
  async getInitialURL() {
    const initialUrl = await Linking.getInitialURL();

    if (!initialUrl) {
      return null;
    }

    const normalizedUrl = normalizeIncomingUrl(initialUrl);
    shouldHandleUrl(normalizedUrl);
    return normalizedUrl;
  },
  subscribe(listener) {
    const subscription = Linking.addEventListener('url', ({ url }) => {
      const normalizedUrl = normalizeIncomingUrl(url);

      if (!shouldHandleUrl(normalizedUrl)) {
        return;
      }

      listener(normalizedUrl);
    });

    return () => {
      subscription.remove();
    };
  },
  config: {
    initialRouteName: 'RootTabs',
    screens: {
      RootTabs: {
        path: '',
        screens: {
          Home: 'app',
          Search: 'search',
          Filter: 'discover',
          Profile: 'profile',
        },
      },
      Login: 'login',
      Register: 'register',
      ForgotPassword: 'forgot-password',
      ResetPassword: 'reset-password/:token?',
      History: 'history',
      MovieDetail: 'movie/:slug',
      Setting: 'settings',
      Watch: 'watch/:slug/:episodeSlug?',
    },
  },
};

export default linking;
