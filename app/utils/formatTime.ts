// ============================================================
// FORMAT TIME UTILITIES
// ============================================================

/**
 * Format seconds into MM:SS display
 * e.g. 125 → "2:05"
 */
export const formatTime = (seconds: number): string => {
  if (!seconds || isNaN(seconds) || seconds < 0) {
    return '0:00';
  }
  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${minutes}:${String(secs).padStart(2, '0')}`;
};

/**
 * Format minutes into human-readable duration
 * e.g. 125 → "2h 5m"
 */
export const formatDuration = (minutes: number): string => {
  if (!minutes || isNaN(minutes) || minutes < 0) {
    return '0m';
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) {
    return `${mins}m`;
  }
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}m`;
};

/**
 * Format duration in seconds to human-readable
 * e.g. 7500 seconds → "2h 5m"
 */
export const formatDurationSeconds = (seconds: number): string => {
  return formatDuration(Math.floor(seconds / 60));
};

/**
 * Format a relative time string (e.g. "2 days ago")
 */
export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffSeconds < 60) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffWeeks < 4) return `${diffWeeks}w ago`;
  if (diffMonths < 12) return `${diffMonths}mo ago`;
  return `${Math.floor(diffMonths / 12)}y ago`;
};

/**
 * Format progress percentage
 * e.g. 0.75 → "75%"
 */
export const formatProgress = (progress: number): string => {
  return `${Math.round(progress * 100)}%`;
};

/**
 * Calculate remaining time
 * e.g. totalSeconds=7200, progressTime=3600 → "1h left"
 */
export const formatRemainingTime = (totalSeconds: number, progressTime: number): string => {
  const remaining = totalSeconds - progressTime;
  if (remaining <= 0) return 'Done';
  return `${formatDurationSeconds(remaining)} left`;
};
