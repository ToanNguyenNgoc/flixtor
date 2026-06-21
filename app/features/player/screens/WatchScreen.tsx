/* eslint-disable react-native/no-inline-styles */
/**
 * WatchScreen — Video Player (iOS crash-proof)
 *
 * CRITICAL: Do NOT use <Modal> here.
 * Even when orientation is controlled by react-native-orientation-locker,
 * iOS can crash if an overlay creates another UIViewController with
 * unsupported orientations.
 *
 * Solution: Keep overlays inside the same screen tree using absolute Views.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  StatusBar, BackHandler, FlatList, Platform, Alert, Pressable, useWindowDimensions,
  AppState, type AppStateStatus,
  type GestureResponderEvent, type LayoutChangeEvent,
} from 'react-native';
import {
  useFocusEffect, useNavigation, useRoute, type RouteProp,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Orientation, { OrientationType } from 'react-native-orientation-locker';
import { useQueryClient } from '@tanstack/react-query';
import Video, {
  type VideoRef, type OnLoadData, type OnProgressData,
} from 'react-native-video';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── CenterPlayButton ────────────────────────────────────────────────────────
const CenterPlayButton = React.memo(({ isVideoBusy, playing, onTogglePlay }: { isVideoBusy: boolean, playing: boolean, onTogglePlay: () => void }) => {
  return (
    <View style={styles.centerPlayWrapper}>
      {isVideoBusy ? (
        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)} style={styles.centerPlayAbs}>
          <View style={styles.playBtn}>
            <ActivityIndicator size="large" color={Colors.white} />
          </View>
        </Animated.View>
      ) : (
        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)} style={styles.centerPlayAbs}>
          <TouchableOpacity style={styles.playBtn} onPress={onTogglePlay}>
            {playing ? <SvgIcons.Pause width={28} height={28} color={Colors.white} /> : <SvgIcons.Play width={28} height={28} color={Colors.white} />}
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
});

import type { RootStackParamList } from '@/navigation/types';
import type {
  KKEpisode,
  LocalWatchHistoryItem,
  WatchHistoryItem,
  WatchHistoryPayload,
  WatchHistoryResponse,
} from '@/types';
import { Colors, Typography, Spacing, BorderRadius } from '@/config/theme';
import { formatTime } from '@/utils/formatTime';
import { useMovieDetail } from '@/features/movie/hooks/useMovieDetail';
import { useWatchHistoryStore } from '@/features/history/store/watchHistoryStore';
import {
  getAllEpisodes,
  getCurrentEpisode,
  getEpisodeSource,
  normalizeEpisodeSlug,
} from '@/utils/episode';
import { parseM3u8Qualities, type Quality } from '@/utils/m3u8';
import {
  clearAndroidGestureExclusionRects,
  enterImmersiveVideoMode,
  exitImmersiveVideoMode,
  setAndroidGestureExclusionRect,
} from '@/utils/systemUi';
import EmbedPlayer from '@/features/player/components/EmbedPlayer';
import VideoSeekBar from '@/features/player/components/VideoSeekBar';
import { SvgIcons } from '@/assets/svg-component';
import { Icon } from '@/components/common';
import { muiColor } from '@/themes';
import { useAuthStore } from '@/features/auth/store/authStore';
import { USER_HISTORY_QUERY_KEY } from '@/features/history/hooks/useUserHistory';
import {
  getUserHistoryErrorMessage,
  UserHistoryService,
} from '@/features/history/services/userHistoryService';

// ─── Types ────────────────────────────────────────────────────────────────────

type WatchRoute = RouteProp<RootStackParamList, 'Watch'>;
type WatchNav = NativeStackNavigationProp<RootStackParamList>;

// ─── Constants ────────────────────────────────────────────────────────────────

const HIDE_MS = 3500;
const SEEK_S = 10;
const SAVE_INTERVAL_MS = 15_000;
const REMOTE_SAVE_MIN_DELTA_SECONDS = 8;
const REMOTE_SAVE_SEEK_SETTLE_MS = 1500;
const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const ACTIVE_PROGRESS_INTERVAL_MS = 250;
const IDLE_PROGRESS_INTERVAL_MS = 1000;
const UI_TIME_SYNC_EPSILON = 0.2;
const UI_BUFFER_SYNC_EPSILON = 1;
const DRAWER_INITIAL_RENDER = 18;
const DRAWER_BATCH_SIZE = 18;
const DRAWER_WINDOW_SIZE = 6;
const DRAWER_UPDATE_BATCHING_PERIOD = 50;
const HIT = { top: 16, bottom: 16, left: 16, right: 16 };
const BOTTOM_CONTROLS_TOUCH_EXCLUSION = 96;
const TOP_GESTURE_EXCLUSION = 72;

type PlayerOrientation = 'portrait' | 'landscape';

type LandscapeOrientation = 'LANDSCAPE-LEFT' | 'LANDSCAPE-RIGHT';

function mapToPlayerOrientation(orientation: OrientationType): PlayerOrientation | null {
  if (
    orientation === OrientationType['LANDSCAPE-LEFT']
    || orientation === OrientationType['LANDSCAPE-RIGHT']
  ) {
    return 'landscape';
  }

  if (
    orientation === OrientationType.PORTRAIT
    || orientation === OrientationType['PORTRAIT-UPSIDEDOWN']
  ) {
    return 'portrait';
  }

  return null;
}

function matchesManualOrientation(
  manualOrientation: PlayerOrientation,
  deviceOrientation: OrientationType,
) {
  const mappedOrientation = mapToPlayerOrientation(deviceOrientation);

  return mappedOrientation === manualOrientation;
}

function getPreferredLandscapeOrientation(
  deviceOrientation: OrientationType,
  fallbackOrientation: LandscapeOrientation,
): LandscapeOrientation {
  if (
    deviceOrientation === OrientationType['LANDSCAPE-LEFT']
    || deviceOrientation === OrientationType['LANDSCAPE-RIGHT']
  ) {
    return deviceOrientation;
  }

  return fallbackOrientation;
}

// Unique key — slug/name can duplicate ("Full"), use index+link tail
function makeEpKey(ep: KKEpisode, idx: number): string {
  return `ep_${idx}_${ep.slug ?? ''}_${(ep.link_m3u8 ?? ep.link_embed ?? '').slice(-12)}`;
}

// ─── EpisodeItem (memoized) ───────────────────────────────────────────────────

interface EpProps {
  ep: KKEpisode;
  idx: number;
  active: boolean;
  onPress: () => void;
}

const EpisodeItem = React.memo(function EpisodeItem({ ep, idx, active, onPress }: EpProps) {
  return (
    <TouchableOpacity
      style={[styles.epItem, active && styles.epItemActive]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={[styles.epText, active && styles.epTextActive]} numberOfLines={2}>
        {ep.name || `Tập ${idx + 1}`}
      </Text>
    </TouchableOpacity>
  );
});

interface PlayerMediaSurfaceProps {
  videoSourceType: 'm3u8' | 'embed' | 'none';
  videoUri: string;
  fallbackUri?: string;
  videoRef: React.RefObject<VideoRef | null>;
  isZoomed: boolean;
  playing: boolean;
  muted: boolean;
  speed: number;
  progressUpdateInterval: number;
  onLoad: (data: OnLoadData) => void;
  onProgress: (data: OnProgressData) => void;
  onBuffer: ({ isBuffering }: { isBuffering: boolean }) => void;
  onEnd: () => void;
  onError: () => void;
}

const PlayerMediaSurface = React.memo(function PlayerMediaSurface({
  videoSourceType,
  videoUri,
  fallbackUri,
  videoRef,
  isZoomed,
  playing,
  muted,
  speed,
  progressUpdateInterval,
  onLoad,
  onProgress,
  onBuffer,
  onEnd,
  onError,
}: PlayerMediaSurfaceProps) {
  if (videoSourceType === 'none') {
    return (
      <View style={styles.centerAbs}>
        <Text style={styles.errorMsg}>Tập này chưa có nguồn phát</Text>
      </View>
    );
  }

  if (videoSourceType === 'embed') {
    return <EmbedPlayer uri={fallbackUri ?? videoUri} />;
  }

  return (
    <Video
      ref={videoRef}
      source={{ uri: videoUri, type: videoSourceType === 'm3u8' ? 'm3u8' : undefined }}
      style={StyleSheet.absoluteFill}
      resizeMode={isZoomed ? 'cover' : 'contain'}
      paused={!playing}
      muted={muted}
      rate={speed}
      repeat={false}
      ignoreSilentSwitch="ignore"
      playInBackground={false}
      progressUpdateInterval={progressUpdateInterval}
      onLoad={onLoad}
      onProgress={onProgress}
      onBuffer={onBuffer}
      onEnd={onEnd}
      onError={onError}
    />
  );
});

interface EpisodeDrawerProps {
  visible: boolean;
  episodes: KKEpisode[];
  currentEp?: KKEpisode;
  onClose: () => void;
  onSelectEpisode: (episode: KKEpisode) => void;
}

const EpisodeDrawer = React.memo(function EpisodeDrawer({
  visible,
  episodes,
  currentEp,
  onClose,
  onSelectEpisode,
}: EpisodeDrawerProps) {
  const activeSlug = currentEp?.slug;
  const activeServer = currentEp?.server_name;

  const renderItem = useCallback(({ item, index }: { item: KKEpisode; index: number }) => (
    <EpisodeItem
      ep={item}
      idx={index}
      active={currentEp ? (item.slug === activeSlug && item.server_name === activeServer) : index === 0}
      onPress={() => onSelectEpisode(item)}
    />
  ), [activeServer, activeSlug, currentEp, onSelectEpisode]);

  if (!visible || episodes.length <= 1) {
    return null;
  }

  return (
    <View style={styles.drawerContainer}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

      <View style={styles.drawer}>
        <View style={styles.drawerHeader}>
          <Text style={styles.drawerTitle}>Danh sách tập ({episodes.length})</Text>
          <TouchableOpacity onPress={onClose} hitSlop={HIT} style={styles.iconBtn}>
            <SvgIcons.CrossSmallLight width={26} height={26} color={Colors.white} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={episodes}
          keyExtractor={makeEpKey}
          renderItem={renderItem}
          numColumns={3}
          columnWrapperStyle={styles.drawerRow}
          contentContainerStyle={styles.drawerList}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
          initialNumToRender={DRAWER_INITIAL_RENDER}
          maxToRenderPerBatch={DRAWER_BATCH_SIZE}
          windowSize={DRAWER_WINDOW_SIZE}
          updateCellsBatchingPeriod={DRAWER_UPDATE_BATCHING_PERIOD}
        />
      </View>
    </View>
  );
});

interface QualityDrawerProps {
  visible: boolean;
  qualities: Quality[];
  selectedUri: string;
  onClose: () => void;
  onSelectQuality: (quality: Quality) => void;
}

const QualityDrawer = React.memo(function QualityDrawer({
  visible,
  qualities,
  selectedUri,
  onClose,
  onSelectQuality,
}: QualityDrawerProps) {
  if (!visible || qualities.length <= 1) {
    return null;
  }

  return (
    <View style={styles.drawerContainer}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={styles.drawer}>
        <View style={styles.drawerHeader}>
          <Text style={styles.drawerTitle}>Chất lượng Video</Text>
          <TouchableOpacity onPress={onClose} hitSlop={HIT} style={styles.iconBtn}>
            <SvgIcons.CrossSmallLight width={26} height={26} color={Colors.white} />
          </TouchableOpacity>
        </View>
        <View style={styles.qualityGrid}>
          {qualities.map((quality, idx) => {
            const isActive = quality.uri === selectedUri;

            return (
              <TouchableOpacity
                key={`${quality.label}-${idx}`}
                style={[styles.epItem, isActive && styles.epItemActive]}
                onPress={() => onSelectQuality(quality)}
              >
                <Text style={[styles.epText, isActive && styles.epTextActive]}>{quality.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
});

// ─── WatchScreen ─────────────────────────────────────────────────────────────

export default function WatchScreen() {
  const navigation = useNavigation<WatchNav>();
  const route = useRoute<WatchRoute>();
  const insets = useSafeAreaInsets();
  const window = useWindowDimensions();
  const queryClient = useQueryClient();
  const authToken = useAuthStore(state => state.token);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  const slug: string = route.params?.slug ?? '';
  const initialEpSlug: string | undefined = route.params?.episodeSlug;
  const initialServerName: string | undefined = route.params?.serverName;
  const routeResume: number = route.params?.initialProgressSeconds ?? route.params?.resumeProgress ?? 0;

  // ── Remote data ──────────────────────────────────────────────────────────
  const { data, isLoading, isError } = useMovieDetail(slug);
  const { saveProgress, getResumeProgress } = useWatchHistoryStore();

  const movie = data?.movie;
  const allEpisodes: KKEpisode[] = getAllEpisodes(data?.episodes ?? []);

  // Track by slug — index-based fails because allEpisodes=[] on first mount
  const [currentEpSlug, setCurrentEpSlug] = useState<string | undefined>(initialEpSlug);
  const [currentServerName, setCurrentServerName] = useState<string | undefined>(initialServerName);
  const [episodesReady, setEpisodesReady] = useState(false);

  useEffect(() => {
    if (allEpisodes.length > 0 && !episodesReady) {
      setEpisodesReady(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allEpisodes.length]);

  // Resolve current episode safely
  let currentEp: KKEpisode | undefined;
  if (allEpisodes.length > 0) {
    currentEp = getCurrentEpisode(allEpisodes, currentEpSlug, currentServerName);
  }

  const videoSource = getEpisodeSource(currentEp);
  const hasEpisodes = allEpisodes.length > 1;
  const resumeAt: number = routeResume > 0
    ? routeResume
    : getResumeProgress(slug, currentEp?.slug ?? '');

  // ── Player state ─────────────────────────────────────────────────────────
  const videoRef = useRef<VideoRef | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const saveTimerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const progressRef = useRef({ time: 0, duration: 0 });
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const displayedTimeRef = useRef(0);
  const displayedBufferedTimeRef = useRef(0);
  const lastUiTimeSyncRef = useRef(0);
  const lastUiBufferSyncRef = useRef(0);
  const isDraggingSliderRef = useRef(false);

  const lastTap = useRef<number>(0);
  const singleTapTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const feedbackTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const targetSeekTime = useRef<number>(-1);
  const seekTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const seekStableRemoteSaveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastRemoteSavedProgressRef = useRef(0);
  const lastRemoteSaveAtRef = useRef(0);
  const lastRemoteSaveKeyRef = useRef('');
  const pendingRemoteSaveRef = useRef(false);
  const queuedRemoteSaveRef = useRef<{ key: string; payload: WatchHistoryPayload } | null>(null);

  const [playing, setPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedTime, setBufferedTime] = useState(0);
  const [buffering, setBuffering] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [showSpeed, setShowSpeed] = useState(false);
  const [muted, setMuted] = useState(false);
  const [showEpDrawer, setShowEpDrawer] = useState(false);

  const [tapFeedback, setTapFeedback] = useState<{ side: 'left' | 'right' | null; text: string }>({ side: null, text: '' });
  const [isZoomed, setIsZoomed] = useState(false);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);
  const [sliderValue, setSliderValue] = useState(0);
  const [isVideoLoading, setIsVideoLoading] = useState(true);

  const [qualities, setQualities] = useState<Quality[]>([]);
  const [selectedQuality, setSelectedQuality] = useState<Quality | null>(null);
  const [showQualityModal, setShowQualityModal] = useState(false);
  const [isChangingQuality, setIsChangingQuality] = useState(false);
  const pendingSeekTime = useRef<number>(-1);
  const [currentOrientation, setCurrentOrientation] = useState<PlayerOrientation>('landscape');
  const [, setManualOrientationLock] = useState<PlayerOrientation | null>(null);
  const [, setIsAutoRotateEnabled] = useState(true);
  const manualOrientationLockRef = useRef<PlayerOrientation | null>(null);
  const deviceOrientationRef = useRef<OrientationType>(Orientation.getInitialOrientation());
  const lastLandscapeOrientationRef = useRef<LandscapeOrientation>(OrientationType['LANDSCAPE-RIGHT']);
  const doSaveRef = useRef<() => void>(() => {});
  const manualOrientationTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const isEmbed = videoSource.type === 'embed';
  const videoUri = selectedQuality ? selectedQuality.uri : videoSource.uri;
  const isLandscape = currentOrientation === 'landscape';
  const isSingleEpisodeMovie = allEpisodes.length <= 1;

  const syncCurrentTime = useCallback((nextTime: number) => {
    displayedTimeRef.current = nextTime;
    setCurrentTime(previous =>
      Math.abs(previous - nextTime) < UI_TIME_SYNC_EPSILON ? previous : nextTime);
  }, []);

  const syncBufferedTime = useCallback((nextBufferedTime: number) => {
    displayedBufferedTimeRef.current = nextBufferedTime;
    setBufferedTime(previous =>
      Math.abs(previous - nextBufferedTime) < UI_BUFFER_SYNC_EPSILON ? previous : nextBufferedTime);
  }, []);

  const syncDuration = useCallback((nextDuration: number) => {
    setDuration(previous =>
      Math.abs(previous - nextDuration) < UI_TIME_SYNC_EPSILON ? previous : nextDuration);
  }, []);

  // ── Fetch Qualities ────────────────────────────────────────────────────────
  useEffect(() => {
    let active = true;
    if (videoSource.type === 'm3u8' && videoSource.uri) {
      parseM3u8Qualities(videoSource.uri)
        .then(qs => {
          if (active) {
            setQualities(qs);
            setSelectedQuality(qs[0] || null);
          }
        })
        .catch(e => console.warn('Parse qualities error:', e));
    } else {
      setQualities([]);
      setSelectedQuality(null);
    }
    return () => { active = false; };
  }, [videoSource.uri, videoSource.type]);

  // ── Orientation ──────────────────────────────────────────────────────────

  const restoreAppOrientation = useCallback(() => {
    if (manualOrientationTimerRef.current) {
      clearTimeout(manualOrientationTimerRef.current);
      manualOrientationTimerRef.current = undefined;
    }

    manualOrientationLockRef.current = null;
    setManualOrientationLock(null);
    setCurrentOrientation('portrait');

    try { Orientation.lockToPortrait(); } catch (_) { /* ignore */ }
    clearAndroidGestureExclusionRects();
    exitImmersiveVideoMode();
    StatusBar.setHidden(false, 'fade');
  }, []);

  const handleOrientationChange = useCallback((orientation: OrientationType) => {
    const mappedOrientation = mapToPlayerOrientation(orientation);

    if (!mappedOrientation) {
      return;
    }

    if (
      orientation === OrientationType['LANDSCAPE-LEFT']
      || orientation === OrientationType['LANDSCAPE-RIGHT']
    ) {
      lastLandscapeOrientationRef.current = orientation;
    }

    const currentManualOrientation = manualOrientationLockRef.current;
    if (currentManualOrientation && mappedOrientation !== currentManualOrientation) {
      return;
    }

    setCurrentOrientation(previous =>
      previous === mappedOrientation ? previous : mappedOrientation);
  }, []);

  const handleDeviceOrientationChange = useCallback((orientation: OrientationType) => {
    deviceOrientationRef.current = orientation;

    const currentManualOrientation = manualOrientationLockRef.current;
    if (!currentManualOrientation) {
      return;
    }

    if (!matchesManualOrientation(currentManualOrientation, orientation)) {
      return;
    }

    if (manualOrientationTimerRef.current) {
      clearTimeout(manualOrientationTimerRef.current);
      manualOrientationTimerRef.current = undefined;
    }

    manualOrientationLockRef.current = null;
    setManualOrientationLock(null);

    try { Orientation.unlockAllOrientations(); } catch (_) { /* ignore */ }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      manualOrientationLockRef.current = 'landscape';
      setManualOrientationLock('landscape');
      setCurrentOrientation('landscape');
      setShowControls(true);
      setIsZoomed(false);

      try { Orientation.lockToLandscape(); } catch (_) { /* ignore */ }

      Orientation.getAutoRotateState(state => {
        if (isActive) {
          setIsAutoRotateEnabled(Boolean(state));
        }
      });

      Orientation.getOrientation(orientation => {
        if (isActive) {
          handleOrientationChange(orientation);
        }
      });

      Orientation.getDeviceOrientation(orientation => {
        if (isActive) {
          deviceOrientationRef.current = orientation;

          if (matchesManualOrientation('landscape', orientation)) {
            manualOrientationLockRef.current = null;
            setManualOrientationLock(null);

            try { Orientation.unlockAllOrientations(); } catch (_) { /* ignore */ }
          }
        }
      });

      Orientation.addOrientationListener(handleOrientationChange);
      Orientation.addDeviceOrientationListener(handleDeviceOrientationChange);

      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        doSaveRef.current();
        navigation.goBack();
        return true;
      });

      return () => {
        isActive = false;
        sub.remove();
        Orientation.removeOrientationListener(handleOrientationChange);
        Orientation.removeDeviceOrientationListener(handleDeviceOrientationChange);
        restoreAppOrientation();
      };
    }, [handleDeviceOrientationChange, handleOrientationChange, navigation, restoreAppOrientation]),
  );

  useEffect(() => {
    if (isLandscape) {
      enterImmersiveVideoMode();
      StatusBar.setHidden(true, 'fade');
      return;
    }

    clearAndroidGestureExclusionRects();
    exitImmersiveVideoMode();
    StatusBar.setHidden(false, 'fade');
  }, [isLandscape]);

  // ── Auto-hide controls ───────────────────────────────────────────────────

  const scheduleHide = useCallback(() => {
    if (isDraggingSliderRef.current) {
      return;
    }
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setShowControls(false), HIDE_MS);
  }, []);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = undefined;
    }
  }, []);

  const revealControls = useCallback(() => {
    setShowControls(true);
    if (isLandscape) {
      enterImmersiveVideoMode();
    }
    scheduleHide();
  }, [isLandscape, scheduleHide]);

  useEffect(() => {
    if (!isLandscape) {
      return;
    }

    setShowControls(true);
    scheduleHide();
  }, [isLandscape, scheduleHide]);

  useEffect(() => () => {
    clearHideTimer();
    if (singleTapTimeout.current) clearTimeout(singleTapTimeout.current);
    if (feedbackTimeout.current) clearTimeout(feedbackTimeout.current);
    if (seekTimeoutRef.current) clearTimeout(seekTimeoutRef.current);
    if (manualOrientationTimerRef.current) clearTimeout(manualOrientationTimerRef.current);
    if (seekStableRemoteSaveTimerRef.current) clearTimeout(seekStableRemoteSaveTimerRef.current);
  }, [clearHideTimer]);

  // ── Double Tap & Feedback ────────────────────────────────────────────────

  const showFeedback = useCallback((text: string, side: 'left' | 'right') => {
    setTapFeedback({ text, side });
    if (feedbackTimeout.current) clearTimeout(feedbackTimeout.current);
    feedbackTimeout.current = setTimeout(() => {
      setTapFeedback({ side: null, text: '' });
    }, 800);
  }, []);

  const startSeekUI = useCallback((time: number) => {
    targetSeekTime.current = time;
    setIsSeeking(true);
    setBuffering(true);
    if (seekTimeoutRef.current) clearTimeout(seekTimeoutRef.current);
    seekTimeoutRef.current = setTimeout(() => {
      setIsSeeking(false);
      setBuffering(false);
      targetSeekTime.current = -1;
    }, 5000);
  }, []);

  const handleDoubleTapSeek = useCallback((amount: number) => {
    if (!videoRef.current) return;
    const dur = progressRef.current.duration;
    if (dur <= 0) return;

    const baseTime = (isSeeking && targetSeekTime.current !== -1) ? targetSeekTime.current : progressRef.current.time;
    const newTime = Math.max(0, Math.min(baseTime + amount, dur));

    try { videoRef.current.seek(newTime); } catch (_) { /* ignore */ }
    syncCurrentTime(newTime);
    progressRef.current.time = newTime;

    startSeekUI(newTime);
    showFeedback(amount > 0 ? `+${amount}s` : `${amount}s`, amount > 0 ? 'right' : 'left');
  }, [showFeedback, startSeekUI, isSeeking, syncCurrentTime]);

  const handleTap = useCallback((e: GestureResponderEvent) => {
    const now = Date.now();
    const locX = e.nativeEvent.locationX;

    if (now - lastTap.current < 300) {
      if (singleTapTimeout.current) {
        clearTimeout(singleTapTimeout.current);
        singleTapTimeout.current = undefined;
      }
      lastTap.current = 0;

      const screenWidth = window.width;
      if (locX < screenWidth / 2) {
        handleDoubleTapSeek(-10);
      } else {
        handleDoubleTapSeek(10);
      }
    } else {
      lastTap.current = now;
      if (singleTapTimeout.current) clearTimeout(singleTapTimeout.current);
      singleTapTimeout.current = setTimeout(() => {
        showControls ? setShowControls(false) : revealControls();
      }, 250);
    }
  }, [handleDoubleTapSeek, revealControls, showControls, window.width]);

  // ── Progress save ────────────────────────────────────────────────────────

  const saveLocalProgress = useCallback(() => {
    if (!movie || !currentEp) {
      return;
    }

    const { time, duration: dur } = progressRef.current;
    if (dur <= 0) {
      return;
    }

    const item: LocalWatchHistoryItem = {
      slug: movie.slug,
      episodeSlug: currentEp.slug,
      episodeName: currentEp.name,
      name: movie.name,
      origin_name: movie.origin_name,
      poster_url: movie.poster_url,
      thumb_url: movie.thumb_url,
      progress: time,
      duration: dur,
      percent: Math.round((time / dur) * 100),
      lastWatchedAt: Date.now(),
    };

    saveProgress(item);
  }, [movie, currentEp, saveProgress]);

  const buildRemoteHistoryEntry = useCallback((progressOverride?: number) => {
    if (!isAuthenticated || !authToken || !movie?.slug) {
      return null;
    }

    const rawProgress = progressOverride ?? progressRef.current.time;
    const progressSeconds = Math.max(0, Math.floor(rawProgress));

    if (!Number.isFinite(progressSeconds) || progressSeconds <= 0) {
      return null;
    }

    const episodeSlug = normalizeEpisodeSlug(currentEp, {
      treatAsSingle: isSingleEpisodeMovie,
      fallbackWhenMissing: isSingleEpisodeMovie ? 'full' : undefined,
    });

    const payload: WatchHistoryPayload = {
      movieSlug: movie.slug,
      episodeSlug,
      progressSeconds,
    };

    return {
      key: `${payload.movieSlug}:${payload.episodeSlug ?? 'default'}`,
      payload,
    };
  }, [authToken, currentEp, isAuthenticated, isSingleEpisodeMovie, movie?.slug]);

  const syncRemoteHistoryCache = useCallback((payload: WatchHistoryPayload) => {
    if (!movie?.slug) {
      return;
    }

    const nextItem: WatchHistoryItem = {
      movieSlug: payload.movieSlug,
      episodeSlug: payload.episodeSlug,
      progressSeconds: payload.progressSeconds,
      watchedAt: new Date().toISOString(),
      movie: {
        name: movie.name,
        thumbUrl: movie.thumb_url,
        posterUrl: movie.poster_url,
        year: movie.year,
        type: movie.type,
      },
    };

    queryClient.setQueriesData<WatchHistoryResponse>(
      { queryKey: USER_HISTORY_QUERY_KEY },
      current => {
        if (!current?.status) {
          return current;
        }

        const nextItems = [
          nextItem,
          ...current.items.filter(item => !(
            item.movieSlug === nextItem.movieSlug
            && (item.episodeSlug ?? null) === (nextItem.episodeSlug ?? null)
          )),
        ];
        const pageLimit = current.pagination.totalItemsPerPage > 0
          ? current.pagination.totalItemsPerPage
          : nextItems.length;

        return {
          ...current,
          items: nextItems.slice(0, pageLimit),
          pagination: {
            ...current.pagination,
            totalItems: Math.max(current.pagination.totalItems, nextItems.length),
          },
        };
      },
    );
  }, [movie?.name, movie?.poster_url, movie?.slug, movie?.thumb_url, movie?.type, movie?.year, queryClient]);

  const flushRemoteHistoryQueue = useCallback(async () => {
    if (pendingRemoteSaveRef.current) {
      return;
    }

    const queuedEntry = queuedRemoteSaveRef.current;
    if (!queuedEntry) {
      return;
    }

    queuedRemoteSaveRef.current = null;
    pendingRemoteSaveRef.current = true;

    try {
      await UserHistoryService.saveHistory(queuedEntry.payload);
      syncRemoteHistoryCache(queuedEntry.payload);
      queryClient.invalidateQueries({ queryKey: USER_HISTORY_QUERY_KEY }).catch(() => {});
      lastRemoteSaveKeyRef.current = queuedEntry.key;
      lastRemoteSavedProgressRef.current = queuedEntry.payload.progressSeconds;
      lastRemoteSaveAtRef.current = Date.now();
    } catch (error) {
      console.warn(`[History] ${getUserHistoryErrorMessage(error)}`);
    } finally {
      pendingRemoteSaveRef.current = false;

      if (queuedRemoteSaveRef.current) {
        flushRemoteHistoryQueue().catch(() => {});
      }
    }
  }, [queryClient, syncRemoteHistoryCache]);

  const queueRemoteHistorySave = useCallback((options?: {
    force?: boolean;
    progressOverride?: number;
  }) => {
    const nextEntry = buildRemoteHistoryEntry(options?.progressOverride);

    if (!nextEntry) {
      return;
    }

    if (nextEntry.key !== lastRemoteSaveKeyRef.current) {
      lastRemoteSaveKeyRef.current = nextEntry.key;
      lastRemoteSavedProgressRef.current = 0;
      lastRemoteSaveAtRef.current = 0;
    }

    const delta = Math.abs(nextEntry.payload.progressSeconds - lastRemoteSavedProgressRef.current);
    const throttled = Date.now() - lastRemoteSaveAtRef.current < SAVE_INTERVAL_MS;

    if (!options?.force) {
      if (delta < REMOTE_SAVE_MIN_DELTA_SECONDS || throttled) {
        return;
      }
    } else if (delta <= 0 && lastRemoteSavedProgressRef.current > 0) {
      return;
    }

    const queuedEntry = queuedRemoteSaveRef.current;
    if (!queuedEntry || nextEntry.payload.progressSeconds >= queuedEntry.payload.progressSeconds) {
      queuedRemoteSaveRef.current = nextEntry;
    }

    if (!pendingRemoteSaveRef.current) {
      flushRemoteHistoryQueue().catch(() => {});
    }
  }, [buildRemoteHistoryEntry, flushRemoteHistoryQueue]);

  const scheduleRemoteHistorySaveAfterSeek = useCallback(() => {
    if (seekStableRemoteSaveTimerRef.current) {
      clearTimeout(seekStableRemoteSaveTimerRef.current);
    }

    seekStableRemoteSaveTimerRef.current = setTimeout(() => {
      queueRemoteHistorySave({ force: true });
    }, REMOTE_SAVE_SEEK_SETTLE_MS);
  }, [queueRemoteHistorySave]);

  const savePlaybackProgress = useCallback((options?: {
    forceRemote?: boolean;
    progressOverride?: number;
  }) => {
    saveLocalProgress();
    queueRemoteHistorySave({
      force: options?.forceRemote ?? false,
      progressOverride: options?.progressOverride,
    });
  }, [queueRemoteHistorySave, saveLocalProgress]);

  useEffect(() => {
    doSaveRef.current = () => {
      savePlaybackProgress({ forceRemote: true });
    };
  }, [savePlaybackProgress]);

  useEffect(() => {
    saveTimerRef.current = setInterval(() => {
      savePlaybackProgress();
    }, SAVE_INTERVAL_MS);

    return () => {
      if (saveTimerRef.current) {
        clearInterval(saveTimerRef.current);
      }
      savePlaybackProgress({ forceRemote: true });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentEpSlug, currentServerName]);

  // ── Video events ─────────────────────────────────────────────────────────

  const onLoad = useCallback((d: OnLoadData) => {
    setIsVideoLoading(false);
    setIsChangingQuality(false);
    const nextDuration = d.duration ?? 0;
    syncDuration(nextDuration);
    syncBufferedTime(0);
    setHasError(false);
    setBuffering(false);
    progressRef.current.duration = nextDuration;
    lastUiBufferSyncRef.current = Date.now();

    if (pendingSeekTime.current !== -1) {
      const nextSeekTime = Math.max(0, Math.min(pendingSeekTime.current, nextDuration));
      try { videoRef.current?.seek(nextSeekTime); } catch (_) { /* ignore */ }
      syncCurrentTime(nextSeekTime);
      progressRef.current.time = nextSeekTime;
      pendingSeekTime.current = -1;
    } else if (resumeAt > 0 && nextDuration > 0) {
      const nextSeekTime = Math.max(0, Math.min(resumeAt, nextDuration));
      if (nextSeekTime > 0) {
        try { videoRef.current?.seek(nextSeekTime); } catch (_) { /* ignore */ }
        syncCurrentTime(nextSeekTime);
        progressRef.current.time = nextSeekTime;
      }
    }
    lastUiTimeSyncRef.current = Date.now();
    scheduleHide();
  }, [resumeAt, scheduleHide, syncBufferedTime, syncCurrentTime, syncDuration]);

  const onProgress = useCallback((d: OnProgressData) => {
    const dur = d.seekableDuration || duration;
    const nextCurrentTime = d.currentTime ?? 0;
    const nextBufferedTime = d.playableDuration ?? 0;
    progressRef.current = {
      time: nextCurrentTime,
      duration: dur,
    };
    const now = Date.now();
    const progressUiInterval = showControls || isSeeking || buffering
      ? ACTIVE_PROGRESS_INTERVAL_MS
      : IDLE_PROGRESS_INTERVAL_MS;
    const shouldUpdateBufferedUi = showControls
      || buffering
      || Math.abs(nextBufferedTime - displayedBufferedTimeRef.current) >= UI_BUFFER_SYNC_EPSILON
      || now - lastUiBufferSyncRef.current >= IDLE_PROGRESS_INTERVAL_MS;

    if (shouldUpdateBufferedUi) {
      lastUiBufferSyncRef.current = now;
      syncBufferedTime(nextBufferedTime);
    }

    if (isDraggingSlider) return;

    if (isSeeking && targetSeekTime.current !== -1) {
      if (Math.abs(nextCurrentTime - targetSeekTime.current) < 1.0) {
        setIsSeeking(false);
        setBuffering(false);
        targetSeekTime.current = -1;
        if (seekTimeoutRef.current) clearTimeout(seekTimeoutRef.current);
        lastUiTimeSyncRef.current = now;
        syncCurrentTime(nextCurrentTime);
        scheduleRemoteHistorySaveAfterSeek();
      }
    } else {
      const shouldUpdateCurrentTimeUi = showControls
        || Math.abs(nextCurrentTime - displayedTimeRef.current) >= 1
        || now - lastUiTimeSyncRef.current >= progressUiInterval;

      if (shouldUpdateCurrentTimeUi) {
        lastUiTimeSyncRef.current = now;
        syncCurrentTime(nextCurrentTime);
      }
    }
  }, [buffering, duration, isDraggingSlider, isSeeking, scheduleRemoteHistorySaveAfterSeek, showControls, syncBufferedTime, syncCurrentTime]);

  const onBuffer = useCallback(({ isBuffering: buf }: { isBuffering: boolean }) => {
    setBuffering(buf);
  }, []);

  const onError = useCallback(() => {
    setIsVideoLoading(false);
    setBuffering(false);
    setHasError(true);
  }, []);

  const onEnd = useCallback(() => {
    const finalProgress = progressRef.current.duration || duration;

    progressRef.current.time = finalProgress;
    syncCurrentTime(finalProgress);
    setPlaying(false);
    setBuffering(false);
    setIsSeeking(false);
    targetSeekTime.current = -1;

    savePlaybackProgress({
      forceRemote: true,
      progressOverride: finalProgress,
    });

    revealControls();
  }, [duration, revealControls, savePlaybackProgress, syncCurrentTime]);

  // ── Seek ─────────────────────────────────────────────────────────────────

  const seek = useCallback((secs: number) => {
    const baseTime = (isSeeking && targetSeekTime.current !== -1) ? targetSeekTime.current : currentTime;
    const target = Math.max(0, Math.min(baseTime + secs, duration));
    try { videoRef.current?.seek(target); } catch (_) { /* ignore */ }
    syncCurrentTime(target);
    startSeekUI(target);
    revealControls();
  }, [currentTime, duration, revealControls, isSeeking, startSeekUI, syncCurrentTime]);

  // ── Episode select ────────────────────────────────────────────────────────

  const selectEpisode = useCallback((ep: KKEpisode) => {
    if (!ep) return;
    const hasSource = !!(ep.link_m3u8 || ep.link_embed);
    if (!hasSource) {
      Alert.alert('Không có nguồn phát', 'Tập này chưa có link video.');
      return;
    }
    if (seekStableRemoteSaveTimerRef.current) {
      clearTimeout(seekStableRemoteSaveTimerRef.current);
      seekStableRemoteSaveTimerRef.current = undefined;
    }
    savePlaybackProgress({ forceRemote: true });
    setCurrentEpSlug(ep.slug);
    setCurrentServerName(ep.server_name);
    syncCurrentTime(0);
    syncDuration(0);
    syncBufferedTime(0);
    progressRef.current = { time: 0, duration: 0 };
    displayedTimeRef.current = 0;
    displayedBufferedTimeRef.current = 0;
    lastUiTimeSyncRef.current = 0;
    lastUiBufferSyncRef.current = 0;
    setHasError(false);
    setPlaying(true);
    setShowEpDrawer(false);
    revealControls();
  }, [revealControls, savePlaybackProgress, syncBufferedTime, syncCurrentTime, syncDuration]);

  // ── Quality select ────────────────────────────────────────────────────────
  const onSelectQuality = useCallback((q: Quality) => {
    setShowQualityModal(false);
    if (q.uri === (selectedQuality?.uri ?? videoUri)) return;

    setIsChangingQuality(true);
    pendingSeekTime.current = currentTime;
    setSelectedQuality(q);
    setPlaying(true);
  }, [currentTime, selectedQuality, videoUri]);

  // ── Back ──────────────────────────────────────────────────────────────────

  const goBack = useCallback(() => {
    savePlaybackProgress({ forceRemote: true });
    navigation.goBack();
  }, [navigation, savePlaybackProgress]);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER STATES
  // ─────────────────────────────────────────────────────────────────────────

  const onTogglePlay = useCallback(() => {
    setPlaying(previous => {
      const nextPlaying = !previous;

      if (previous && !nextPlaying) {
        savePlaybackProgress({ forceRemote: true });
      }

      return nextPlaying;
    });
    revealControls();
  }, [revealControls, savePlaybackProgress]);

  const handleSeekStart = useCallback((time: number) => {
    if (seekStableRemoteSaveTimerRef.current) {
      clearTimeout(seekStableRemoteSaveTimerRef.current);
      seekStableRemoteSaveTimerRef.current = undefined;
    }
    if (seekTimeoutRef.current) {
      clearTimeout(seekTimeoutRef.current);
      seekTimeoutRef.current = undefined;
    }
    targetSeekTime.current = -1;
    setIsSeeking(false);
    setBuffering(false);
    isDraggingSliderRef.current = true;
    setIsDraggingSlider(true);
    setSliderValue(time);
    setShowControls(true);
    clearHideTimer();
  }, [clearHideTimer]);

  const handleSeekChange = useCallback((time: number) => {
    if (!isDraggingSliderRef.current) {
      isDraggingSliderRef.current = true;
      setIsDraggingSlider(true);
    }
    setSliderValue(time);
  }, []);

  const handleSeekComplete = useCallback((time: number) => {
    const target = Math.max(0, Math.min(time, duration));
    try { videoRef.current?.seek(target); } catch (_) { /* ignore */ }
    isDraggingSliderRef.current = false;
    setIsDraggingSlider(false);
    syncCurrentTime(target);
    setSliderValue(target);
    startSeekUI(target);
    revealControls();
    scheduleRemoteHistorySaveAfterSeek();
  }, [duration, revealControls, scheduleRemoteHistorySaveAfterSeek, startSeekUI, syncCurrentTime]);

  const toggleOrientation = useCallback(() => {
    const nextOrientation: PlayerOrientation = isLandscape ? 'portrait' : 'landscape';
    const preferredLandscapeOrientation = getPreferredLandscapeOrientation(
      deviceOrientationRef.current,
      lastLandscapeOrientationRef.current,
    );

    if (manualOrientationTimerRef.current) {
      clearTimeout(manualOrientationTimerRef.current);
      manualOrientationTimerRef.current = undefined;
    }

    manualOrientationLockRef.current = nextOrientation;
    setManualOrientationLock(nextOrientation);
    setCurrentOrientation(nextOrientation);
    setShowSpeed(false);

    if (nextOrientation === 'landscape') {
      lastLandscapeOrientationRef.current = preferredLandscapeOrientation;

      try { Orientation.unlockAllOrientations(); } catch (_) { /* ignore */ }

      if (preferredLandscapeOrientation === OrientationType['LANDSCAPE-LEFT']) {
        try { Orientation.lockToLandscapeLeft(); } catch (_) { /* ignore */ }
      } else {
        try { Orientation.lockToLandscapeRight(); } catch (_) { /* ignore */ }
      }
    } else {
      try { Orientation.lockToPortrait(); } catch (_) { /* ignore */ }
    }

    if (matchesManualOrientation(nextOrientation, deviceOrientationRef.current)) {
      manualOrientationTimerRef.current = setTimeout(() => {
        if (manualOrientationLockRef.current !== nextOrientation) {
          return;
        }

        manualOrientationLockRef.current = null;
        setManualOrientationLock(null);
        try { Orientation.unlockAllOrientations(); } catch (_) { /* ignore */ }
      }, 450);
    }

    revealControls();
  }, [isLandscape, revealControls]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      const previousAppState = appStateRef.current;
      appStateRef.current = nextAppState;

      if (
        previousAppState === 'active'
        && (nextAppState === 'inactive' || nextAppState === 'background')
      ) {
        savePlaybackProgress({ forceRemote: true });
      }
    });

    return () => {
      subscription.remove();
    };
  }, [savePlaybackProgress]);

  const handleBottomBarLayout = useCallback((event: LayoutChangeEvent) => {
    if (Platform.OS !== 'android') {
      return;
    }

    if (!isLandscape) {
      clearAndroidGestureExclusionRects();
      return;
    }

    const { x, y, width: layoutWidth, height } = event.nativeEvent.layout;
    if (layoutWidth <= 0 || height <= 0) {
      return;
    }

    setAndroidGestureExclusionRect(x, y, layoutWidth, height);
  }, [isLandscape]);

  if (isLoading || !episodesReady) {
    return (
      <View style={styles.fullBlack}>
        <StatusBar hidden={isLandscape} barStyle="light-content" />
        <ActivityIndicator color={Colors.primary} size="large" />
        <Text style={styles.loadingText}>Đang tải phim...</Text>
      </View>
    );
  }

  if (isError || !movie) {
    return (
      <View style={styles.fullBlack}>
        <StatusBar hidden={isLandscape} barStyle="light-content" />
        <Text style={styles.errorMsg}>⚠️ Không tải được phim</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={goBack}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <SvgIcons.CaretLeft width={20} height={20} color={Colors.white} />
            <Text style={styles.retryText}>Quay lại</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  if (!currentEp) {
    return (
      <View style={styles.fullBlack}>
        <StatusBar hidden={isLandscape} barStyle="light-content" />
        <Text style={styles.errorMsg}>⚠️ Không tìm thấy tập phim</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={goBack}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <SvgIcons.CaretLeft width={20} height={20} color={Colors.white} />
            <Text style={styles.retryText}>Quay lại</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MAIN RENDER
  // ─────────────────────────────────────────────────────────────────────────

  let displayTime = currentTime;
  if (isDraggingSlider) {
    displayTime = sliderValue;
  } else if (isSeeking && targetSeekTime.current !== -1) {
    displayTime = targetSeekTime.current;
  }

  const isVideoBusy = isVideoLoading || buffering || isSeeking || isChangingQuality;
  const playerSurfaceStyle = isLandscape ? styles.playerSurfaceLandscape : styles.playerSurfacePortrait;
  const videoFrameStyle = styles.videoFrame;
  const controlsStyle = [
    StyleSheet.absoluteFill,
    styles.controls,
    isLandscape ? styles.controlsLandscape : styles.controlsPortrait,
  ];
  const topBarStyle = [
    styles.topBar,
    isLandscape ? styles.topBarLandscape : styles.topBarPortrait,
    {
      paddingTop: Math.max(insets.top, Spacing.sm),
      paddingLeft: isLandscape ? Math.max(insets.left, Spacing.md) : Spacing.base,
      paddingRight: isLandscape ? Math.max(insets.right, Spacing.md) : Spacing.base,
    },
  ];
  const bottomBarStyle = [
    styles.bottomBar,
    isLandscape ? styles.bottomBarLandscape : styles.bottomBarPortrait,
    {
      paddingBottom: isLandscape ? Math.max(insets.bottom, Spacing.base) : Spacing.sm,
      paddingLeft: isLandscape ? Math.max(insets.left, Spacing.md) : Spacing.sm,
      paddingRight: isLandscape ? Math.max(insets.right, Spacing.md) : Spacing.sm,
    },
  ];
  const speedMenuStyle = [
    styles.speedMenu,
    isLandscape ? styles.speedMenuLandscape : styles.speedMenuPortrait,
    isLandscape && {
      right: Math.max(insets.right, Spacing.md),
      bottom: Math.max(insets.bottom, Spacing.base) + 52,
    },
  ];
  const progressUpdateIntervalMs = showControls || isSeeking || isDraggingSlider
    ? ACTIVE_PROGRESS_INTERVAL_MS
    : IDLE_PROGRESS_INTERVAL_MS;

  return (
    <View style={styles.root}>
      <StatusBar hidden={isLandscape} barStyle="light-content" />

      <View style={[styles.playerSurface, playerSurfaceStyle]}>
        <View style={videoFrameStyle}>
          <PlayerMediaSurface
            videoSourceType={videoSource.type}
            videoUri={videoUri}
            fallbackUri={videoSource.fallbackUri}
            videoRef={videoRef}
            isZoomed={isZoomed}
            playing={playing}
            muted={muted}
            speed={speed}
            progressUpdateInterval={progressUpdateIntervalMs}
            onLoad={onLoad}
            onProgress={onProgress}
            onBuffer={onBuffer}
            onEnd={onEnd}
            onError={onError}
          />

          {hasError && (
            <View style={[styles.centerAbs, styles.errorOverlay]}>
              <Text style={styles.errorMsg}>⚠️ Server hiện tại không phát được</Text>
              <Text style={styles.errorOverlayText}>
                Vui lòng thử lại hoặc chọn server khác từ danh sách tập
              </Text>
              <View style={styles.errorActionRow}>
                <TouchableOpacity style={styles.retryBtn} onPress={() => setHasError(false)}>
                  <Text style={styles.retryText}>Thử lại</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.retryBtn} onPress={() => { setHasError(false); setShowEpDrawer(true); }}>
                  <Text style={styles.retryText}>Đổi Server / Tập</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {!showControls ? (
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={handleTap}
            />
          ) : (
            <Pressable
              style={styles.videoGestureLayer}
              onPress={handleTap}
              pointerEvents={isDraggingSlider || showEpDrawer || showQualityModal ? 'none' : 'auto'}
            />
          )}

          {!!tapFeedback.side && (
            <View style={[
              styles.feedbackOverlay,
              tapFeedback.side === 'left' ? styles.feedbackLeft : styles.feedbackRight,
            ]} pointerEvents="none">
              <View style={styles.feedbackCircle}>
                {tapFeedback.side === 'left' ? (
                  <Icon icon='TimePastLight' size={34} color={Colors.white} />
                ) : (
                  <Icon icon='TimeForwardLight' size={34} color={Colors.white} />
                )}
                <Text style={styles.feedbackText}>{tapFeedback.text}</Text>
              </View>
            </View>
          )}

          {showControls && (
            <View style={controlsStyle} pointerEvents="box-none">
            <View style={topBarStyle}>
              <TouchableOpacity onPress={goBack} style={styles.iconBtn} hitSlop={HIT}>
                <SvgIcons.CaretLeft width={26} height={26} color={Colors.white} />
              </TouchableOpacity>

              <View style={styles.titleArea}>
                <Text style={styles.titleText} numberOfLines={1}>{movie.name}</Text>
                {!!currentEp.name && (
                  <Text style={styles.epNameText} numberOfLines={1}>{currentEp.name}</Text>
                )}
              </View>

              {hasEpisodes && !isEmbed && (
                <TouchableOpacity
                  onPress={() => { setPlaying(false); setShowEpDrawer(true); }}
                  style={styles.epToggleBtn}
                  hitSlop={HIT}
                >
                  <Icon icon='ListLight' color={muiColor.grey[0]} />
                </TouchableOpacity>
              )}

              {!isEmbed && (
                <View style={styles.controlActionRow}>
                  {qualities.length > 1 && (
                    <TouchableOpacity
                      onPress={() => setShowQualityModal(true)}
                      style={styles.secondaryControlButton}
                      hitSlop={HIT}
                    >
                      <Text style={styles.secondaryControlText}>
                        {selectedQuality?.label || 'Auto'}
                      </Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => setIsZoomed(z => !z)} style={styles.secondaryControlButton} hitSlop={HIT}>
                    <Text style={styles.secondaryControlText}>{isZoomed ? 'Fit' : 'Fill'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={toggleOrientation} style={styles.secondaryControlButton} hitSlop={HIT}>
                    <Icon icon='RefreshLight' color={Colors.white} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setMuted(m => !m)} style={styles.iconBtn} hitSlop={HIT}>
                    <Icon icon='VolumeBold' color={muted ? Colors.primary : muiColor.grey[0]} />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {!isEmbed && (
              <View style={styles.centerRow}>
                <TouchableOpacity onPress={() => seek(-SEEK_S)} style={styles.seekBtn} hitSlop={HIT}>
                  <Icon icon='TimePastLight' size={34} color={muiColor.grey[0]} />
                  <Text style={styles.seekLabel}>{SEEK_S}s</Text>
                </TouchableOpacity>

                <CenterPlayButton
                  isVideoBusy={isVideoBusy}
                  playing={playing}
                  onTogglePlay={onTogglePlay}
                />

                <TouchableOpacity onPress={() => seek(SEEK_S)} style={styles.seekBtn} hitSlop={HIT}>
                  <Icon icon='TimeForwardLight' size={34} color={muiColor.grey[0]} />
                  <Text style={styles.seekLabel}>{SEEK_S}s</Text>
                </TouchableOpacity>
              </View>
            )}

            {!isEmbed && (
              <View style={bottomBarStyle} onLayout={handleBottomBarLayout}>
                <Text style={styles.timeText}>{formatTime(displayTime)}</Text>
                <VideoSeekBar
                  style={styles.slider}
                  duration={duration}
                  currentTime={displayTime}
                  bufferedTime={bufferedTime}
                  disabled={duration <= 0 || isChangingQuality}
                  isDragging={isDraggingSlider}
                  isSeeking={isSeeking}
                  targetSeekTime={targetSeekTime.current !== -1 ? targetSeekTime.current : null}
                  onSeekStart={handleSeekStart}
                  onSeekChange={handleSeekChange}
                  onSeekComplete={handleSeekComplete}
                />
                <Text style={styles.timeText}>{formatTime(duration)}</Text>
                <TouchableOpacity onPress={() => setShowSpeed(s => !s)} style={styles.speedBtn}>
                  <Text style={styles.speedText}>{speed}x</Text>
                </TouchableOpacity>
              </View>
            )}

            {showSpeed && !isEmbed && (
              <View style={speedMenuStyle}>
                {SPEEDS.map(s => (
                  <TouchableOpacity
                    key={`spd-${s}`}
                    style={[styles.speedItem, s === speed && styles.speedItemActive]}
                    onPress={() => { setSpeed(s); setShowSpeed(false); revealControls(); }}
                  >
                    <Text style={styles.speedItemText}>{s}x</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            </View>
          )}
        </View>
      </View>

      {/*
       * ── EPISODE DRAWER (absolute View — NOT Modal) ──
       *
       * REASON: <Modal> on iOS creates RCTFabricModalHostViewController.
       * When orientation is locked to landscape, that VC has no supported
       * orientation → crash: "Supported orientations has no common orientation".
       *
       * Fix: render episode list as absolute View inside the same root View.
       * This avoids creating a new UIViewController entirely.
       */}
      <EpisodeDrawer
        visible={showEpDrawer && hasEpisodes}
        episodes={allEpisodes}
        currentEp={currentEp}
        onClose={() => { setShowEpDrawer(false); setPlaying(true); }}
        onSelectEpisode={selectEpisode}
      />

      {/* ── QUALITY DRAWER ── */}
      <QualityDrawer
        visible={showQualityModal && qualities.length > 1}
        qualities={qualities}
        selectedUri={selectedQuality?.uri ?? videoUri}
        onClose={() => setShowQualityModal(false)}
        onSelectQuality={onSelectQuality}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  fullBlack: {
    flex: 1, backgroundColor: Colors.black,
    alignItems: 'center', justifyContent: 'center', gap: 16,
  },
  loadingText: { color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 12 },
  errorMsg: { color: Colors.white, fontSize: 15, textAlign: 'center', paddingHorizontal: 32 },
  retryBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24, paddingVertical: 10,
    borderRadius: BorderRadius.sm, marginTop: 12,
  },
  retryText: { color: Colors.white, fontWeight: Typography.fontWeight.bold },

  root: { flex: 1, backgroundColor: Colors.black },
  playerSurface: {
    backgroundColor: Colors.black,
    overflow: 'hidden',
  },
  playerSurfacePortrait: {
    flex: 1,
  },
  playerSurfaceLandscape: {
    flex: 1,
  },
  videoFrame: {
    ...StyleSheet.absoluteFillObject,
  },
  tapLayerWithControls: {
    bottom: BOTTOM_CONTROLS_TOUCH_EXCLUSION,
  },

  centerAbs: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center',
  },
  errorOverlay: { backgroundColor: 'rgba(0,0,0,0.82)' },
  errorOverlayText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
    marginBottom: Spacing.base,
    textAlign: 'center',
  },
  errorActionRow: {
    flexDirection: 'row',
    gap: Spacing.base,
  },

  controls: {
    backgroundColor: 'transparent',
    zIndex: 20,
    elevation: 20,
  },
  controlsPortrait: {
    justifyContent: 'center',
  },
  controlsLandscape: {
    justifyContent: 'center',
  },

  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingBottom: Spacing.xs,
  },
  topBarPortrait: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 40,
    backgroundColor: 'rgba(0,0,0,0.26)',
    paddingHorizontal: Spacing.base,
  },
  topBarLandscape: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 40,
    backgroundColor: 'rgba(0,0,0,0.26)',
    paddingHorizontal: Spacing.md,
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  icon: { color: Colors.white, fontSize: 22 },
  titleArea: { flex: 1, minWidth: 0, marginHorizontal: Spacing.sm },
  titleText: {
    color: Colors.white, fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
  },
  epNameText: { color: 'rgba(255,255,255,0.6)', fontSize: Typography.fontSize.xs, marginTop: 2 },
  epToggleBtn: { alignItems: 'center', paddingHorizontal: 8, marginRight: 4 },
  epToggleLabel: { color: Colors.white, fontSize: 9, marginTop: 1 },
  controlActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  secondaryControlButton: {
    height: 34,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    backgroundColor: 'rgba(0,0,0,0.22)',
    paddingHorizontal: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  secondaryControlText: {
    color: Colors.white,
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    marginLeft: Spacing.xs,
  },

  centerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
    paddingHorizontal: Spacing.xl,
  },
  seekBtn: { alignItems: 'center' },
  seekIcon: { color: Colors.white, fontSize: 34 },
  seekLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 2 },

  centerPlayWrapper: { width: 64, height: 64, justifyContent: 'center', alignItems: 'center' },
  centerPlayAbs: { position: 'absolute' },
  playBtn: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
  },
  playIcon: { color: Colors.white, fontSize: 28 },

  videoGestureLayer: {
    position: 'absolute',
    top: TOP_GESTURE_EXCLUSION,
    left: 0,
    right: 0,
    bottom: BOTTOM_CONTROLS_TOUCH_EXCLUSION,
    zIndex: 10,
  },
  bottomBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    gap: 4,
    zIndex: 30,
    elevation: 30,
  },
  bottomBarPortrait: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 40,
    backgroundColor: 'rgba(0,0,0,0.26)',
    paddingHorizontal: Spacing.sm,
  },
  bottomBarLandscape: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 40,
    backgroundColor: 'rgba(0,0,0,0.26)',
    paddingHorizontal: Spacing.md,
  },
  slider: { flex: 1, height: 40 },
  timeText: { color: Colors.white, fontSize: Typography.fontSize.xs, minWidth: 44, textAlign: 'center' },
  speedBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 4, paddingHorizontal: 7, paddingVertical: 3,
  },
  speedText: {
    color: Colors.white, fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
  },
  speedMenu: {
    position: 'absolute',
    right: Spacing.md,
    backgroundColor: 'rgba(18,18,18,0.97)',
    borderRadius: 8, overflow: 'hidden', elevation: 12,
  },
  speedMenuPortrait: {
    bottom: 48,
  },
  speedMenuLandscape: {
    right: Spacing.md,
  },
  speedItem: { paddingHorizontal: 24, paddingVertical: 10 },
  speedItemActive: { backgroundColor: Colors.primary },
  speedItemText: { color: Colors.white, fontSize: Typography.fontSize.sm },

  // Drawer — absolute View, NOT Modal (see comment above)
  drawerContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
    zIndex: 999,
  },
  drawer: {
    backgroundColor: '#111',
    borderTopLeftRadius: 16, borderTopRightRadius: 16,
    maxHeight: '70%',
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
  },
  drawerHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  drawerTitle: {
    flex: 1, color: Colors.white,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
  },
  drawerList: { padding: 12, paddingBottom: 24 },
  drawerRow: { gap: 8, marginBottom: 8 },
  qualityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 20,
  },

  epItem: {
    flex: 1, minWidth: 80,
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.sm,
    paddingVertical: 10, paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1.5, borderColor: 'transparent',
  },
  epItemActive: { borderColor: Colors.primary, backgroundColor: 'rgba(229,9,20,0.12)' },
  epText: { color: Colors.textSecondary, fontSize: Typography.fontSize.xs, textAlign: 'center' },
  epTextActive: { color: Colors.primary, fontWeight: Typography.fontWeight.bold },

  // Feedback
  feedbackOverlay: {
    position: 'absolute', top: 0, bottom: 0, width: '50%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center', alignItems: 'center',
  },
  feedbackLeft: { left: 0, borderTopRightRadius: 200, borderBottomRightRadius: 200 },
  feedbackRight: { right: 0, borderTopLeftRadius: 200, borderBottomLeftRadius: 200 },
  feedbackCircle: { alignItems: 'center' },
  feedbackText: { color: Colors.white, fontSize: 13, fontWeight: 'bold', marginTop: 4 },

  loadingOverlay: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 16,
    borderRadius: 8,
  },

  zoomBtn: {
    borderWidth: 1, borderColor: Colors.white, borderRadius: 4,
    paddingHorizontal: 8, paddingVertical: 2, marginRight: 8
  },
  zoomText: { color: Colors.white, fontSize: 10, fontWeight: 'bold' },
});
