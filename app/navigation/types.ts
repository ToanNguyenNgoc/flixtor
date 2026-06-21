import type { NavigatorScreenParams } from '@react-navigation/native';
import type { ResetPasswordRouteParams } from '@/types';

// ─── Navigation Types ─────────────────────────────────────

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: ResetPasswordRouteParams | undefined;
};

export type RootStackParamList = {
  RootTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: ResetPasswordRouteParams | undefined;
  History: undefined;
  MovieDetail: { slug: string };
  Setting: undefined;
  Watch: {
    slug: string;
    episodeSlug?: string;
    serverName?: string;
    resumeProgress?: number;
    initialProgressSeconds?: number;
  };
};

export type MainTabParamList = {
  Home: undefined;
  Search: { keyword?: string } | undefined;
  Filter: {
    type?: string;
    category?: string;
    country?: string;
    year?: string;
    lang?: string;
    sort?: string;
    requestId?: number;
  } | undefined;
  Favorites: undefined;
  History: undefined;
  Profile: undefined;
};
