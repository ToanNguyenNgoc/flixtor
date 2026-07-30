import type { PersistedAuthSession } from '@/types';

const TOKEN_TTL_PATTERN = /^(\d+)\s*(s|m|h|d)$/i;
const TOKEN_TTL_MULTIPLIER: Record<'s' | 'm' | 'h' | 'd', number> = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

export const ACCESS_TOKEN_REFRESH_BUFFER_MS = 60 * 1000;

export function parseDurationToMs(duration: string | null | undefined): number | null {
  if (typeof duration !== 'string') {
    return null;
  }

  const normalizedDuration = duration.trim().toLowerCase();

  if (!normalizedDuration) {
    return null;
  }

  if (/^\d+$/.test(normalizedDuration)) {
    return Number(normalizedDuration) * 1000;
  }

  const match = normalizedDuration.match(TOKEN_TTL_PATTERN);

  if (!match) {
    return null;
  }

  const [, rawValue, rawUnit] = match;
  const value = Number(rawValue);
  const unit = rawUnit as keyof typeof TOKEN_TTL_MULTIPLIER;

  if (!Number.isFinite(value)) {
    return null;
  }

  return value * TOKEN_TTL_MULTIPLIER[unit];
}

export function getExpiryTimestamp(
  duration: string | null | undefined,
  now = Date.now(),
): number | null {
  const durationMs = parseDurationToMs(duration);

  if (durationMs === null) {
    return null;
  }

  return now + durationMs;
}

export function buildPersistedAuthSession({
  expiresIn,
  refreshExpiresIn,
  now = Date.now(),
}: {
  expiresIn?: string;
  refreshExpiresIn?: string;
  now?: number;
}): PersistedAuthSession {
  return {
    accessTokenExpiresAt: getExpiryTimestamp(expiresIn, now),
    refreshTokenExpiresAt: getExpiryTimestamp(refreshExpiresIn, now),
  };
}

export function isTokenExpired(
  expiresAt: number | null | undefined,
  bufferMs = 0,
): boolean {
  if (typeof expiresAt !== 'number' || !Number.isFinite(expiresAt)) {
    return false;
  }

  return expiresAt <= Date.now() + bufferMs;
}
