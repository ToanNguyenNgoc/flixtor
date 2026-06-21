// ============================================================
// ENVIRONMENT CONFIG
// ============================================================

const ENV = {
  development: {
    API_BASE_URL: 'https://api.flixtor.dev/v1',
    TMDB_API_KEY: 'your_tmdb_api_key_here',
    IS_MOCK: true, // Use mock data while no backend
    LOG_LEVEL: 'debug',
  },
  staging: {
    API_BASE_URL: 'https://api-staging.flixtor.dev/v1',
    TMDB_API_KEY: 'your_tmdb_api_key_here',
    IS_MOCK: false,
    LOG_LEVEL: 'warn',
  },
  production: {
    API_BASE_URL: 'https://api.flixtor.com/v1',
    TMDB_API_KEY: 'your_tmdb_api_key_here',
    IS_MOCK: false,
    LOG_LEVEL: 'error',
  },
};

// Change this to switch environments
const CURRENT_ENV: keyof typeof ENV = 'development';

export const Config = ENV[CURRENT_ENV];

export default Config;
