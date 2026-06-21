// useVideoProgress.ts — DEPRECATED (replaced by WatchScreen + watchHistoryStore)
export function useVideoProgress(_movieId: string) {
  return { onProgress: (_time: number) => {} };
}
