// ============================================================
// DEBOUNCE UTILITY
// ============================================================

/**
 * Creates a debounced version of a function.
 * The debounced function delays invoking fn until after `delay` ms
 * have elapsed since the last time the debounced function was invoked.
 *
 * @example
 * const debouncedSearch = debounce((query: string) => search(query), 500);
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>): void => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * Creates a throttled version of a function.
 * The throttled function invokes fn at most once per `interval` ms.
 *
 * @example
 * const throttledSave = throttle((progress: number) => save(progress), 3000);
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  interval: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>): void => {
    const now = Date.now();
    const remaining = interval - (now - lastCall);

    if (remaining <= 0) {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastCall = now;
      fn(...args);
    } else {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        timeoutId = null;
        fn(...args);
      }, remaining);
    }
  };
}
