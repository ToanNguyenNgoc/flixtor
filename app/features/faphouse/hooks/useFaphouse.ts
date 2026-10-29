import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { FAPHOUSE_PAGE_SIZE } from '@/utils/constants';
import { FaphouseService, toWatchDetail } from '../services/faphouseService';
import type { FaphouseMovie, FaphouseMovieParams } from '../types';

const ONE_HOUR = 1000 * 60 * 60;
const FIVE_MINUTES = 1000 * 60 * 5;

export function useFaphouseLatest(enabled = true) {
  return useQuery({
    queryKey: ['faphouse', 'latest'],
    queryFn: () => FaphouseService.getMovies({ sort: 'latest', page: 1, limit: FAPHOUSE_PAGE_SIZE }),
    enabled,
    staleTime: FIVE_MINUTES,
    select: data => data.items,
  });
}

export function useFaphouseInfiniteMovies(params: Omit<FaphouseMovieParams, 'page'>) {
  return useInfiniteQuery({
    queryKey: ['faphouse', 'movies', params],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => FaphouseService.getMovies({
      ...params,
      page: pageParam,
      limit: FAPHOUSE_PAGE_SIZE,
    }),
    getNextPageParam: lastPage => (lastPage.hasNextPage ? lastPage.page + 1 : undefined),
    staleTime: FIVE_MINUTES,
  });
}

export function useFaphouseMovieDetail(slug: string) {
  return useQuery({
    queryKey: ['faphouse', 'detail', slug],
    queryFn: () => FaphouseService.getMovieDetail(slug),
    enabled: !!slug,
    staleTime: 1000 * 60 * 10,
    retry: 2,
  });
}

/** Detail đã chuyển sang shape của WatchScreen; `slug` rỗng thì không gọi API. */
export function useFaphouseWatchDetail(slug: string) {
  return useQuery({
    queryKey: ['faphouse', 'detail', slug],
    queryFn: () => FaphouseService.getMovieDetail(slug),
    enabled: !!slug,
    staleTime: 1000 * 60 * 10,
    retry: 2,
    select: (movie: FaphouseMovie) => toWatchDetail(movie),
  });
}

export function useFaphouseGenres() {
  return useQuery({
    queryKey: ['faphouse', 'genres'],
    queryFn: FaphouseService.getGenres,
    staleTime: ONE_HOUR,
  });
}

export function useFaphouseCountries() {
  return useQuery({
    queryKey: ['faphouse', 'countries'],
    queryFn: FaphouseService.getCountries,
    staleTime: ONE_HOUR,
  });
}

export function useFaphouseActors() {
  return useQuery({
    queryKey: ['faphouse', 'actors'],
    queryFn: FaphouseService.getActors,
    staleTime: ONE_HOUR,
  });
}
