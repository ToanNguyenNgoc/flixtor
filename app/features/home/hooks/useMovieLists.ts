import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import {
  getLatestMovies,
  getMovieList,
  getMoviesByCategory,
  getMoviesByCountry,
  getMoviesByYear,
  extractItems,
  extractPagination,
} from '@/services/api/phimApi';
import { MOVIE_TYPE_LIST } from '@/services/api/endpoints';
import type { KKMovie, MovieFilterParams } from '@/types';

// ─── Latest movies ────────────────────────────────────────

export function useLatestMovies(page = 1) {
  return useQuery({
    queryKey: ['latestMovies', page],
    queryFn: () => getLatestMovies(page),
    staleTime: 1000 * 60 * 5,
  });
}

// ─── Movie list by type (single page) ────────────────────

export function useMovieList(typeList: string, page = 1, extra: Partial<MovieFilterParams> = {}) {
  return useQuery({
    queryKey: ['movieList', typeList, page, extra],
    queryFn: () => getMovieList({ typeList, page, ...extra }),
    staleTime: 1000 * 60 * 5,
    select: data => extractItems(data),
  });
}

export function useCountryMovieList(country: string, page = 1, extra: Partial<MovieFilterParams> = {}) {
  return useQuery({
    queryKey: ['countryMovieList', country, page, extra],
    queryFn: () => getMoviesByCountry({ country, page, ...extra }),
    staleTime: 1000 * 60 * 5,
    select: data => extractItems(data),
  });
}

// ─── Infinite movie list ───────────────────────────────────

interface InfiniteParams extends Partial<MovieFilterParams> {
  typeList?: string;
  category?: string;
  country?: string;
  year?: string;
}

function fetchPage(params: InfiniteParams, pageParam: number) {
  if (params.category && !params.typeList) {
    return getMoviesByCategory({ ...params, page: pageParam });
  }
  if (params.country && !params.typeList) {
    return getMoviesByCountry({ ...params, page: pageParam });
  }
  if (params.year && !params.typeList) {
    return getMoviesByYear({ ...params, page: pageParam });
  }
  return getMovieList({ ...params, typeList: params.typeList ?? MOVIE_TYPE_LIST.PHIM_BO, page: pageParam });
}

export function useInfiniteMovieList(params: InfiniteParams) {
  return useInfiniteQuery({
    queryKey: ['infiniteMovieList', params],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => fetchPage(params, pageParam),
    getNextPageParam: lastPage => {
      const pagination = extractPagination(lastPage);
      const current = Number(pagination?.currentPage ?? pagination?.current_page ?? 1);
      const total = Number(pagination?.totalPages ?? pagination?.total_pages ?? 1);
      return current < total ? current + 1 : undefined;
    },
    staleTime: 1000 * 60 * 5,
  });
}

// ─── Extract all movies from infinite pages ───────────────

export function flattenInfiniteMovies(data?: { pages: ReturnType<typeof extractItems>[] } | { pages: Awaited<ReturnType<typeof getMovieList>>[] }): KKMovie[] {
  if (!data?.pages) return [];
  return (data.pages as Awaited<ReturnType<typeof getMovieList>>[]).flatMap(page => extractItems(page));
}
