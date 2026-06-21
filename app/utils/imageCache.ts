import FastImage from 'react-native-fast-image';
import { getMovieImageUrl } from './image';

const prefetchedUrls = new Set<string>();
const DEFAULT_PREFETCH_LIMIT = 12;

export const IMAGE_PREFETCH_LIMITS = {
  homeHero: 8,
  movieDetail: 2,
} as const;

/**
 * Prefetches an array of image URLs to memory/disk cache.
 * Uses FastImage.preload under the hood.
 */
export function prefetchImages(
  urls: (string | null | undefined)[],
  limit = DEFAULT_PREFETCH_LIMIT,
) {
  try {
    const validUrls = urls
      .filter((url): url is string => !!url && typeof url === 'string')
      .map(url => url.trim())
      .map(url => getMovieImageUrl(url))
      .filter(Boolean);
    if (validUrls.length === 0) return;

    const uniqueUrls = validUrls.filter((url, index) => validUrls.indexOf(url) === index);
    const urlsToPrefetch = uniqueUrls
      .filter(url => !prefetchedUrls.has(url))
      .slice(0, limit);
    if (urlsToPrefetch.length === 0) return;

    urlsToPrefetch.forEach(url => prefetchedUrls.add(url));
    const uris = urlsToPrefetch.map(url => ({ uri: url }));
    FastImage.preload(uris);
  } catch (error) {
    console.warn('Error prefetching images:', error);
  }
}
