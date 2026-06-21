/**
 * Flixtor — Root App Component
 * Sets up all providers: QueryClient, GestureHandler, SafeArea, Navigation
 */
import React, { useCallback, useEffect, useState } from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BootSplash from 'react-native-bootsplash';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import RootNavigator from '@/navigation/RootNavigator';
import linking from '@/navigation/linking';
import { useFavoriteStore } from '@/features/favorites/store/favoriteStore';
import { useWatchHistoryStore } from '@/features/history/store/watchHistoryStore';
import { useAuthStore } from '@/features/auth/store/authStore';
import { initializeApiServer } from '@/services/api/axiosClient';
import { BrandNavigator } from '@/brand';
import { useSystemStatus } from '@/hooks/useSystemStatus';
import HomeScreenSkeleton from '@/features/home/components/HomeScreenSkeleton';
import { navigationRef } from '@/brand/navigator/brand.navigate';

const rootStyle = StyleSheet.create({ root: { flex: 1 } }).root;
const QUERY_STALE_TIME = 1000 * 60 * 2;
const QUERY_CACHE_TIME = 1000 * 60 * 8;

function shouldRetryQuery(failureCount: number, error: unknown) {
  if (
    typeof error === 'object'
    && error !== null
    && 'code' in error
    && error.code === 'ERR_CANCELED'
  ) {
    return false;
  }

  return failureCount < 1;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: QUERY_STALE_TIME,
      cacheTime: QUERY_CACHE_TIME,
      retry: shouldRetryQuery,
    },
  },
});

export default function App() {
  const loadFavorites = useFavoriteStore(state => state.loadFavorites);
  const loadHistory = useWatchHistoryStore(state => state.loadHistory);
  const restoreSession = useAuthStore(state => state.restoreSession);
  const [isAppReady, setIsAppReady] = useState(false);
  const {
    isCheckingSystemStatus,
    isBlocked,
    redirectUrl,
    refetchSystemStatus,
  } = useSystemStatus();

  const bootstrapApp = useCallback(async () => {
    const initResults = await Promise.allSettled([
      loadFavorites(),
      loadHistory(),
      initializeApiServer(),
      restoreSession(),
    ]);

    initResults.forEach(result => {
      if (result.status === 'rejected') {
        console.warn('[App] Bootstrap task failed.', result.reason);
      }
    });
  }, [loadFavorites, loadHistory, restoreSession]);

  useEffect(() => {
    bootstrapApp().finally(() => {
      setIsAppReady(true);
      BootSplash.hide({ fade: true });
    });
  }, [bootstrapApp]);

  const shouldShowLoading = !isAppReady || (isCheckingSystemStatus && !isBlocked);
  const activeLinking = isBlocked ? undefined : linking;

  return (
    <GestureHandlerRootView style={rootStyle}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
          <BottomSheetModalProvider>
            <NavigationContainer linking={activeLinking} ref={navigationRef}>
              {shouldShowLoading ? <HomeScreenSkeleton topInset={140} /> : null}
              {!shouldShowLoading && isBlocked ? (
                <BrandNavigator
                  isRefreshing={isCheckingSystemStatus}
                  onRetryPress={refetchSystemStatus}
                  redirectUrl={redirectUrl}
                />
              ) : null}
              {!shouldShowLoading && !isBlocked ? <RootNavigator /> : null}
            </NavigationContainer>
          </BottomSheetModalProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
