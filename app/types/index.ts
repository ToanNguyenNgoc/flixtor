// ============================================================
// SHARED TYPESCRIPT INTERFACES — KKPhim + App types
// ============================================================

// ─── KKPhim API Types ─────────────────────────────────────

export interface KKCategory {
  _id?: string;
  name: string;
  slug: string;
}

export interface KKCountry {
  _id?: string;
  name: string;
  slug: string;
}

export interface KKMovie {
  _id?: string;
  name: string;
  slug: string;
  origin_name?: string;
  type?: string; // 'single' | 'series' | 'hoathinh' | 'tvshows'
  status?: string;
  thumb_url?: string;
  poster_url?: string;
  year?: number;
  episode_current?: string;
  episode_total?: string;
  quality?: string;
  lang?: string;
  time?: string;
  modified?: { time?: string };
  category?: KKCategory[];
  country?: KKCountry[];
}

export interface KKEpisode {
  name?: string;
  slug?: string;
  filename?: string;
  link_embed?: string;
  link_m3u8?: string;
  server_name?: string; // injected from server
}

export interface KKEpisodeServer {
  server_name?: string;
  server_data?: KKEpisode[];
}

export interface KKMovieDetail {
  _id?: string;
  name: string;
  slug: string;
  origin_name?: string;
  content?: string; // HTML
  type?: string;
  status?: string;
  thumb_url?: string;
  poster_url?: string;
  trailer_url?: string;
  time?: string;
  episode_current?: string;
  episode_total?: string;
  quality?: string;
  lang?: string;
  year?: number;
  actor?: string[];
  director?: string[];
  category?: KKCategory[];
  country?: KKCountry[];
  chieurap?: boolean;
  sub_docquyen?: boolean;
  notify?: string;
  showtimes?: string;
}

export interface KKPagination {
  totalItems?: number;
  totalPages?: number;
  total_pages?: number;
  currentPage?: number;
  current_page?: number;
  totalItemsPerPage?: number;
}

export interface KKListResponse {
  status?: boolean | string;
  msg?: string;
  data?: {
    items?: KKMovie[];
    params?: {
      pagination?: KKPagination;
      type_slug?: string;
    };
    APP_DOMAIN_FRONTEND?: string;
    APP_DOMAIN_CDN_IMAGE?: string;
  };
  items?: KKMovie[]; // v3 response
  pagination?: KKPagination; // v3
}

export interface KKDetailResponse {
  status?: boolean | string;
  msg?: string;
  movie?: KKMovieDetail;
  episodes?: KKEpisodeServer[];
}

// ─── Video Source Types ────────────────────────────────────

export type VideoSourceType = 'm3u8' | 'embed' | 'none';

export interface VideoSource {
  type: VideoSourceType;
  uri: string;
  fallbackUri?: string;
}

// ─── Favorite & History ────────────────────────────────────

export interface FavoriteMovie {
  slug: string;
  name?: string;
  origin_name?: string;
  poster_url?: string;
  thumb_url?: string;
  year?: number;
  episode_current?: string;
  quality?: string;
  lang?: string;
  updatedAt: number;
}

export interface LocalWatchHistoryItem {
  slug: string;
  episodeSlug?: string;
  episodeName?: string;
  name?: string;
  origin_name?: string;
  poster_url?: string;
  thumb_url?: string;
  progress: number;
  duration: number;
  percent: number;
  lastWatchedAt: number;
}

export interface WatchHistoryPayload {
  movieSlug: string;
  episodeSlug?: string | null;
  progressSeconds: number;
}

export interface WatchHistoryMovie {
  name: string;
  thumbUrl?: string;
  posterUrl?: string;
  year?: number;
  type?: string;
}

export interface WatchHistoryItem {
  movieSlug: string;
  episodeSlug?: string | null;
  progressSeconds: number;
  watchedAt: string;
  movie: WatchHistoryMovie;
}

export interface WatchHistoryPagination {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  totalItemsPerPage: number;
}

export interface WatchHistoryResponse {
  status: boolean;
  items: WatchHistoryItem[];
  pagination: WatchHistoryPagination;
}

export type SystemStatusPlatform = 'app' | (string & {});

export interface SystemStatusResponse {
  status: boolean;
  platform: SystemStatusPlatform;
  blocked: boolean;
  redirectUrl?: string;
}

export interface UseSystemStatusReturn {
  isCheckingSystemStatus: boolean;
  isBlocked: boolean;
  redirectUrl: string;
  systemStatusError: string | null;
  refetchSystemStatus: () => Promise<void>;
}

// ─── Auth ─────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  role: string;
  emailVerified: boolean;
  isBlocked?: boolean;
  blockReason?: string;
  createdAt: string;
}

export interface AuthTokenResponse {
  status: boolean;
  token: string;
  refreshToken?: string;
  expiresIn?: string;
  refreshExpiresIn?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse extends AuthTokenResponse {
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
}

export interface RegisterResponse extends AuthTokenResponse {
  user: User;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse extends AuthTokenResponse {}

export interface PersistedAuthSession {
  accessTokenExpiresAt: number | null;
  refreshTokenExpiresAt: number | null;
}

export interface MeResponse {
  status: boolean;
  user: User;
}

export interface ForgotPasswordRequest {
  email: string;
  platform: 'MOBA';
}

export interface ForgotPasswordResponse {
  status: boolean;
  msg: string;
}

export interface GoogleUserInfo {
  id?: string;
  email?: string;
  name?: string | null;
  givenName?: string | null;
  familyName?: string | null;
  photo?: string | null;
}

export interface GoogleAuthPayload {
  email: string;
  familyName: string;
  givenName: string;
  id: string;
  name: string;
  photo: string;
}

export interface GoogleAuthResponse extends AuthTokenResponse {
  user: User;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface ResetPasswordResponse {
  status: boolean;
  msg: string;
}

export interface ResetPasswordRouteParams {
  token?: string;
}

// ─── Filter params ─────────────────────────────────────────

export interface MovieFilterParams {
  typeList?: string;
  category?: string;
  country?: string;
  year?: string;
  lang?: string;
  sortField?: string;
  sortType?: 'asc' | 'desc';
  limit?: number;
  page?: number;
}
