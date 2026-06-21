import { useQuery } from '@tanstack/react-query';
import { getCategories } from '@/services/api/phimApi';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}
