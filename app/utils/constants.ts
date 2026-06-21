// ============================================================
// APP CONSTANTS
// ============================================================

export const APP_NAME = 'Flixtor';
export const APP_VERSION = '1.0.0';

// ─── Pagination ───────────────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 20;
export const SEARCH_PAGE_SIZE = 30;

// ─── Query Cache Times ────────────────────────────────────────
export const CACHE_TIME_SHORT = 1000 * 60 * 5;       // 5 minutes
export const CACHE_TIME_MEDIUM = 1000 * 60 * 30;     // 30 minutes
export const CACHE_TIME_LONG = 1000 * 60 * 60 * 2;   // 2 hours

// ─── Player ───────────────────────────────────────────────────
export const PLAYER_CONTROLS_HIDE_DELAY = 3000;      // 3 seconds
export const PLAYER_PROGRESS_SAVE_INTERVAL = 5000;   // Save every 5 seconds
export const PLAYER_SEEK_SECONDS = 10;               // Forward/back 10 seconds
export const PLAYER_RESUME_THRESHOLD = 30;           // Resume if >30s watched

// ─── Search ───────────────────────────────────────────────────
export const SEARCH_DEBOUNCE_MS = 400;
export const SEARCH_MIN_LENGTH = 2;

// ─── Continue Watching ────────────────────────────────────────
export const CONTINUE_WATCHING_MAX = 10;
export const WATCHED_COMPLETE_THRESHOLD = 0.9; // 90% = watched

// ─── Image ────────────────────────────────────────────────────
export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';
export const TMDB_POSTER_SIZE = 'w342';
export const TMDB_BACKDROP_SIZE = 'w780';

// ─── Popular Search Terms ─────────────────────────────────────
export const POPULAR_SEARCHES = [
  'Action',
  'Comedy',
  'Horror',
  'Thriller',
  'Romance',
  'Documentary',
  'Sci-Fi',
  'Animation',
  'Crime',
  'Drama',
];

// ─── Age Ratings ─────────────────────────────────────────────
export const AGE_RATINGS = ['G', 'PG', 'PG-13', '13+', '16+', '18+', 'R', 'NC-17'] as const;

// ─── Tab Names ────────────────────────────────────────────────
export const TAB_NAMES = {
  HOME: 'Home',
  SEARCH: 'Search',
  MY_LIST: 'My List',
  DOWNLOADS: 'Downloads',
  PROFILE: 'Profile',
} as const;
