import { useInfiniteQuery } from '@tanstack/react-query';
import { extractItems, extractPagination, searchMoviesPage } from '@/services/api/phimApi';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import type { KKMovie } from '@/types';

export function useSearchMovies(keyword: string, limit = 18) {
  const debouncedKeyword = useDebouncedValue(keyword, 400);

  return useInfiniteQuery({
    queryKey: ['searchMovies', debouncedKeyword, limit],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) => searchMoviesPage(
      debouncedKeyword,
      pageParam,
      limit,
      signal,
    ),
    enabled: debouncedKeyword.trim().length >= 2,
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 2,
    getNextPageParam: lastPage => {
      const pagination = extractPagination(lastPage);
      const current = Number(pagination?.currentPage ?? pagination?.current_page ?? 1);
      const total = Number(pagination?.totalPages ?? pagination?.total_pages ?? 1);
      return current < total ? current + 1 : undefined;
    },
    select: data => data.pages.flatMap(page => extractItems(page)) as KKMovie[],
  });
}
