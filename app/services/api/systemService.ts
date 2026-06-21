import { get, type ApiRequestConfig } from './axiosClient';
import type { SystemStatusPlatform, SystemStatusResponse } from '@/types';

const SYSTEM_STATUS_ENDPOINT = 'https://flix-api.longdc.click/system-status';
const SYSTEM_STATUS_TIMEOUT_MS = 8000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseSystemStatusResponse(data: unknown): SystemStatusResponse {
  if (!isRecord(data)) {
    throw new Error('Invalid system status response.');
  }

  const { status, platform, blocked, redirectUrl } = data;

  if (
    typeof status !== 'boolean'
    || typeof platform !== 'string'
    || typeof blocked !== 'boolean'
  ) {
    throw new Error('Invalid system status response.');
  }

  return {
    status,
    platform: platform.trim() || 'app',
    blocked,
    redirectUrl: typeof redirectUrl === 'string' ? redirectUrl.trim() : '',
  };
}

async function getSystemStatus(platform: SystemStatusPlatform): Promise<SystemStatusResponse> {
  const normalizedPlatform = typeof platform === 'string' && platform.trim().length > 0
    ? platform.trim()
    : 'app';

  const requestConfig: ApiRequestConfig = {
    headers: {
      Accept: 'application/json',
    },
    params: {
      platform: normalizedPlatform,
    },
    skipAuth: true,
    timeout: SYSTEM_STATUS_TIMEOUT_MS,
  };

  const response = await get<unknown>(SYSTEM_STATUS_ENDPOINT, requestConfig);

  return parseSystemStatusResponse(response.data);
}

const SystemService = {
  getSystemStatus,
};

export default SystemService;
