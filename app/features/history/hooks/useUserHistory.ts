import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import UserHistoryService from '@/features/history/services/userHistoryService';
import { useAuthStore } from '@/features/auth/store/authStore';
import type { WatchHistoryResponse } from '@/types';

export const USER_HISTORY_QUERY_KEY = ['userHistory'] as const;

function removeMovieFromHistoryResponse(
  current: WatchHistoryResponse | undefined,
  movieSlug: string,
): WatchHistoryResponse | undefined {
  if (!current?.status) {
    return current;
  }

  const normalizedMovieSlug = movieSlug.trim();

  if (!normalizedMovieSlug) {
    return current;
  }

  const nextItems = current.items.filter(item => item.movieSlug !== normalizedMovieSlug);

  if (nextItems.length === current.items.length) {
    return current;
  }

  const removedCount = current.items.length - nextItems.length;
  const itemsPerPage = Math.max(1, current.pagination.totalItemsPerPage);
  const totalItems = Math.max(0, current.pagination.totalItems - removedCount);
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  return {
    ...current,
    items: nextItems,
    pagination: {
      ...current.pagination,
      totalItems,
      totalPages,
      currentPage: Math.min(current.pagination.currentPage, totalPages),
    },
  };
}

export function removeMovieFromUserHistoryCache(
  queryClient: QueryClient,
  movieSlug: string,
): Array<[readonly unknown[], WatchHistoryResponse | undefined]> {
  const previousQueries = queryClient.getQueriesData<WatchHistoryResponse>({
    queryKey: USER_HISTORY_QUERY_KEY,
  });

  previousQueries.forEach(([queryKey, current]) => {
    queryClient.setQueryData<WatchHistoryResponse | undefined>(
      queryKey,
      removeMovieFromHistoryResponse(current, movieSlug),
    );
  });

  return previousQueries;
}

export function useUserHistory(page = 1, limit = 20) {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const token = useAuthStore(state => state.token);

  return useQuery({
    queryKey: [...USER_HISTORY_QUERY_KEY, page, limit],
    queryFn: () => UserHistoryService.getHistory({ page, limit }),
    enabled: isAuthenticated && Boolean(token),
    staleTime: 1000 * 60,
  });
}

export function useDeleteUserHistory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (movieSlug: string) => UserHistoryService.deleteHistory(movieSlug),
    onMutate: async movieSlug => {
      await queryClient.cancelQueries({ queryKey: USER_HISTORY_QUERY_KEY });

      const previousQueries = removeMovieFromUserHistoryCache(queryClient, movieSlug);

      return { previousQueries };
    },
    onError: (_error, _movieSlug, context) => {
      context?.previousQueries.forEach(([queryKey, previousData]) => {
        queryClient.setQueryData(queryKey, previousData);
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: USER_HISTORY_QUERY_KEY });
    },
  });
}
