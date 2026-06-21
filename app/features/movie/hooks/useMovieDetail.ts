import { useQuery } from '@tanstack/react-query';
import { getMovieDetail } from '@/services/api/phimApi';

export function useMovieDetail(slug: string) {
  return useQuery({
    queryKey: ['movieDetail', slug],
    queryFn: () => getMovieDetail(slug),
    enabled: !!slug,
    staleTime: 1000 * 60 * 10,
    retry: 2,
  });
}
