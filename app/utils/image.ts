// ─── Image helpers for KKPhim ─────────────────────────────

const IMAGE_DOMAIN = 'https://phimimg.com';
const IMAGE_PROXY_ENDPOINT = 'https://phimapi.com/image.php?url=';
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
  const originalUrl = normalizeMovieImageUrl(path);

  if (
    originalUrl === FALLBACK_PLACEHOLDER
    || originalUrl.startsWith(IMAGE_PROXY_ENDPOINT)
  ) {
    return originalUrl;
  }

  return `${IMAGE_PROXY_ENDPOINT}${encodeURIComponent(originalUrl)}`;
}

export function getOriginalImageUrlFromProxy(url?: string | null): string | null {
  if (!url || !url.startsWith(IMAGE_PROXY_ENDPOINT)) {
    return null;
  }

  try {
    const parsedUrl = new URL(url);
    return parsedUrl.searchParams.get('url');
  } catch {
    const encodedUrl = url.split('?url=')[1];
    return encodedUrl ? decodeURIComponent(encodedUrl) : null;
  }
}

export function getPosterSource(path?: string | null): { uri: string } {
  return { uri: getMovieImageUrl(path) };
}

export function getThumbSource(path?: string | null): { uri: string } {
  return { uri: getMovieImageUrl(path) };
}
