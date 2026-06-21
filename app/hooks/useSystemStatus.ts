import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import SystemService from '@/services/api/systemService';
import type {
  SystemStatusResponse,
  UseSystemStatusReturn,
} from '@/types';

const FOREGROUND_RECHECK_COOLDOWN_MS = 30 * 1000;

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return 'Unknown system status error.';
}

export function useSystemStatus(): UseSystemStatusReturn {
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const isMountedRef = useRef(true);
  const lastCheckedAtRef = useRef(0);
  const requestRef = useRef<Promise<void> | null>(null);
  const [isCheckingSystemStatus, setIsCheckingSystemStatus] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState('');
  const [systemStatusError, setSystemStatusError] = useState<string | null>(null);

  const applySystemStatus = useCallback((response: SystemStatusResponse) => {
    if (response.status !== true) {
      setSystemStatusError(null);
      setIsBlocked(false);
      setRedirectUrl('');
      return;
    }

    setSystemStatusError(null);
    setIsBlocked(response.blocked === true);
    setRedirectUrl(response.redirectUrl?.trim() ?? '');
  }, []);

  const runSystemStatusCheck = useCallback(async (showLoader: boolean) => {
    if (requestRef.current) {
      return requestRef.current;
    }

    if (showLoader) {
      setIsCheckingSystemStatus(true);
    }

    const request = (async () => {
      try {
        const response = await SystemService.getSystemStatus('app');

        if (!isMountedRef.current) {
          return;
        }

        applySystemStatus(response);
      } catch (error) {
        console.warn('[SystemStatus] Failed to check app availability.', error);

        if (!isMountedRef.current) {
          return;
        }

        setSystemStatusError(getErrorMessage(error));
        setIsBlocked(false);
        setRedirectUrl('');
      } finally {
        if (isMountedRef.current) {
          if (showLoader) {
            setIsCheckingSystemStatus(false);
          }

          lastCheckedAtRef.current = Date.now();
        }

        requestRef.current = null;
      }
    })();

    requestRef.current = request;
    return request;
  }, [applySystemStatus]);

  const refetchSystemStatus = useCallback(async () => {
    await runSystemStatusCheck(true);
  }, [runSystemStatusCheck]);

  useEffect(() => {
    isMountedRef.current = true;
    refetchSystemStatus().catch(() => null);

    return () => {
      isMountedRef.current = false;
    };
  }, [refetchSystemStatus]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      const previousAppState = appStateRef.current;
      appStateRef.current = nextAppState;

      if (
        (previousAppState !== 'background' && previousAppState !== 'inactive')
        || nextAppState !== 'active'
      ) {
        return;
      }

      if (Date.now() - lastCheckedAtRef.current < FOREGROUND_RECHECK_COOLDOWN_MS) {
        return;
      }

      runSystemStatusCheck(false).catch(() => null);
    });

    return () => {
      subscription.remove();
    };
  }, [runSystemStatusCheck]);

  return {
    isCheckingSystemStatus,
    isBlocked,
    redirectUrl,
    systemStatusError,
    refetchSystemStatus,
  };
}

export default useSystemStatus;
