import { useQuery } from '@tanstack/react-query';
import { getCountries } from '@/services/api/phimApi';

export function useCountries() {
  return useQuery({
    queryKey: ['countries'],
    queryFn: getCountries,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}
