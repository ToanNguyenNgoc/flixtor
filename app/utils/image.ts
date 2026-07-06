// ─── Image helpers for KKPhim ─────────────────────────────

const IMAGE_DOMAIN = 'https://phimimg.com';
const FALLBACK_PLACEHOLDER = 'https://via.placeholder.com/200x300/141414/ffffff?text=No+Image';

function normalizeMovieImageUrl(path?: string | null): string {
  if (!path) return FALLBACK_PLACEHOLDER;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${IMAGE_DOMAIN}${normalized}`;
}

export function getOriginalMovieImageUrl(path?: string | null): string {
  return normalizeMovieImageUrl(path);
}

export function getMovieImageUrl(path?: string | null): string {
  return normalizeMovieImageUrl(path);
}

export function getOriginalImageUrlFromProxy(url?: string | null): string | null {
  return url ?? null;
}

export function getPosterSource(path?: string | null): { uri: string } {
  return { uri: getMovieImageUrl(path) };
}

export function getThumbSource(path?: string | null): { uri: string } {
  return { uri: getMovieImageUrl(path) };
}
