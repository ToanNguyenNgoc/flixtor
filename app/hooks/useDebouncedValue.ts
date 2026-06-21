import { useEffect, useRef, useState } from 'react';

export function useDebouncedValue<T>(value: T, delay = 400): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    timerRef.current = setTimeout(() => setDebouncedValue(value), delay);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value, delay]);

  return debouncedValue;
}
