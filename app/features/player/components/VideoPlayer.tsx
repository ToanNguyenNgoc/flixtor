/**
 * VideoPlayer.tsx
 *
 * Standalone video player component — dùng trong portrait preview nếu cần.
 * Toàn bộ fullscreen landscape được xử lý bởi WatchScreen + orientation-locker.
 *
 * Component này render Video + controls trong một View 16:9.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TouchableWithoutFeedback, ActivityIndicator, Platform,
} from 'react-native';
import Video, {
  type OnProgressData, type OnLoadData, type OnBufferData, type VideoRef,
} from 'react-native-video';
import Slider from '@react-native-community/slider';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming,
} from 'react-native-reanimated';
import { Colors, Typography, Spacing } from '@/config/theme';
import { formatTime } from '@/utils/formatTime';
import EmbedPlayer from './EmbedPlayer';
import type { VideoSource } from '@/types';
import { SvgIcons } from '@/assets/svg-component';

// ─── Constants ───────────────────────────────────────────────

const HIDE_DELAY = 3500;
const SEEK_SECONDS = 10;
const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const HIT = { top: 12, bottom: 12, left: 12, right: 12 };

// ─── Props ───────────────────────────────────────────────────

export interface VideoPlayerProps {
  source: VideoSource;
  title?: string;
  episodeName?: string;
  resumeProgress?: number;
  containerWidth: number;
  containerHeight: number;
  onBack?: () => void;
  onProgress?: (currentTime: number, duration: number) => void;
}

// ─── Component ───────────────────────────────────────────────

export default function VideoPlayer({
  source,
  title,
  episodeName,
  resumeProgress = 0,
  containerWidth,
  containerHeight,
  onBack,
  onProgress,
}: VideoPlayerProps) {
  const videoRef = useRef<VideoRef | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [showSpeed, setShowSpeed] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [useFallback] = useState(source.type === 'embed');

  const controlsOpacity = useSharedValue(1);
  const controlsStyle = useAnimatedStyle(() => ({ opacity: controlsOpacity.value }));

  // ── Controls visibility ───────────────────────────────────

  const scheduleHide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      controlsOpacity.value = withTiming(0, { duration: 300 });
      setShowControls(false);
    }, HIDE_DELAY);
  }, [controlsOpacity]);

  const showAndReset = useCallback(() => {
    controlsOpacity.value = withTiming(1, { duration: 150 });
    setShowControls(true);
    scheduleHide();
  }, [controlsOpacity, scheduleHide]);

  const handleTap = useCallback(() => {
    if (showControls) {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      controlsOpacity.value = withTiming(0, { duration: 200 });
      setShowControls(false);
    } else {
      showAndReset();
    }
  }, [showControls, controlsOpacity, showAndReset]);

  useEffect(
    () => () => { if (hideTimer.current) clearTimeout(hideTimer.current); },
    [],
  );

  // ── Seek ─────────────────────────────────────────────────

  const handleSeek = useCallback((seconds: number) => {
    const target = Math.max(0, Math.min(currentTime + seconds, duration));
    videoRef.current?.seek(target);
    setCurrentTime(target);
    showAndReset();
  }, [currentTime, duration, showAndReset]);

  // ── Video events ─────────────────────────────────────────

  const handleLoad = useCallback((d: OnLoadData) => {
    setDuration(d.duration);
    if (resumeProgress > 30) {
      videoRef.current?.seek(resumeProgress);
      setCurrentTime(resumeProgress);
    }
    scheduleHide();
  }, [resumeProgress, scheduleHide]);

  const handleProgress = useCallback((d: OnProgressData) => {
    if (!isSeeking) setCurrentTime(d.currentTime);
    onProgress?.(d.currentTime, d.seekableDuration || duration);
  }, [isSeeking, duration, onProgress]);

  const handleBuffer = useCallback(({ isBuffering: buf }: OnBufferData) => {
    setIsBuffering(buf);
  }, []);

  const handleError = useCallback(() => { setHasError(true); }, []);

  // ── Render ───────────────────────────────────────────────

  return (
    <View style={[styles.root, { width: containerWidth, height: containerHeight }]}>
      <TouchableWithoutFeedback onPress={handleTap}>
        <View style={StyleSheet.absoluteFill}>
          {useFallback ? (
            <EmbedPlayer uri={source.fallbackUri ?? source.uri} />
          ) : (
            <Video
              ref={videoRef}
              source={{ uri: source.uri }}
              style={StyleSheet.absoluteFill}
              resizeMode="contain"
              paused={!isPlaying}
              muted={isMuted}
              rate={speed}
              onLoad={handleLoad}
              onProgress={handleProgress}
              onBuffer={handleBuffer}
              onError={handleError}
              repeat={false}
              ignoreSilentSwitch="ignore"
              progressUpdateInterval={1000}
              fullscreen={false}
            />
          )}
        </View>
      </TouchableWithoutFeedback>

      {/* Buffering */}
      {isBuffering && !hasError && !useFallback && (
        <ActivityIndicator style={StyleSheet.absoluteFill} color={Colors.white} size="large" />
      )}

      {/* Error */}
      {hasError && (
        <View style={[StyleSheet.absoluteFill, styles.errorOverlay]}>
          <Text style={styles.errorText}>⚠️ Không phát được video</Text>
          <TouchableOpacity onPress={() => setHasError(false)} style={styles.retryBtn}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Controls */}
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.controls, controlsStyle]}
        pointerEvents={showControls ? 'box-none' : 'none'}
      >
        {/* Top */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onBack} style={styles.iconBtn} hitSlop={HIT}>
            <SvgIcons.CaretLeft width={26} height={26} color={Colors.white} />
          </TouchableOpacity>
          <View style={styles.titleWrap}>
            {!!title && <Text style={styles.titleText} numberOfLines={1}>{title}</Text>}
            {!!episodeName && <Text style={styles.epText} numberOfLines={1}>{episodeName}</Text>}
          </View>
          <TouchableOpacity onPress={() => setIsMuted(m => !m)} style={styles.iconBtn} hitSlop={HIT}>
            <Text style={styles.iconText}>{isMuted ? '🔇' : '🔊'}</Text>
          </TouchableOpacity>
        </View>

        {/* Center */}
        <View style={styles.centerRow} pointerEvents="box-none">
          <TouchableOpacity onPress={() => handleSeek(-SEEK_SECONDS)} hitSlop={HIT} style={styles.seekWrap}>
            <SvgIcons.UndoAltLight width={34} height={34} color={Colors.white} />
            <Text style={styles.seekLabel}>{SEEK_SECONDS}s</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.playBtn}
            onPress={() => { setIsPlaying(p => !p); showAndReset(); }}
          >
            {isPlaying ? <SvgIcons.Pause width={28} height={28} color={Colors.white} /> : <SvgIcons.Play width={28} height={28} color={Colors.white} />}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleSeek(SEEK_SECONDS)} hitSlop={HIT} style={styles.seekWrap}>
            <Text style={styles.seekIcon}>↻</Text>
            <Text style={styles.seekLabel}>{SEEK_SECONDS}s</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom */}
        <View style={styles.bottomBar}>
          <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={duration > 0 ? duration : 1}
            value={currentTime}
            minimumTrackTintColor={Colors.primary}
            maximumTrackTintColor="rgba(255,255,255,0.25)"
            thumbTintColor={Colors.white}
            onValueChange={val => { setIsSeeking(true); setCurrentTime(val); }}
            onSlidingComplete={val => {
              videoRef.current?.seek(val);
              setIsSeeking(false);
              showAndReset();
            }}
          />
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
          <TouchableOpacity onPress={() => setShowSpeed(s => !s)} style={styles.speedBtn}>
            <Text style={styles.speedText}>{speed}x</Text>
          </TouchableOpacity>
        </View>

        {/* Speed picker */}
        {showSpeed && (
          <View style={styles.speedMenu}>
            {SPEED_OPTIONS.map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.speedItem, s === speed && styles.speedItemActive]}
                onPress={() => { setSpeed(s); setShowSpeed(false); showAndReset(); }}
              >
                <Text style={styles.speedItemText}>{s}x</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </Animated.View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { backgroundColor: Colors.black, overflow: 'hidden' },
  controls: { backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'space-between' },
  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Platform.OS === 'ios' ? 10 : Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  iconText: { color: Colors.white, fontSize: 22 },
  titleWrap: { flex: 1, marginHorizontal: Spacing.sm },
  titleText: { color: Colors.white, fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.bold },
  epText: { color: Colors.textSecondary, fontSize: Typography.fontSize.xs, marginTop: 2 },
  centerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 40 },
  seekWrap: { alignItems: 'center' },
  seekIcon: { color: Colors.white, fontSize: 32 },
  seekLabel: { color: 'rgba(255,255,255,0.85)', fontSize: Typography.fontSize.xs, marginTop: 2 },
  playBtn: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
  },
  playIcon: { color: Colors.white, fontSize: 28 },
  bottomBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? 8 : Spacing.sm,
    gap: 4,
  },
  slider: { flex: 1, height: 40 },
  timeText: { color: Colors.white, fontSize: Typography.fontSize.xs, minWidth: 40, textAlign: 'center' },
  speedBtn: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 4, paddingHorizontal: 7, paddingVertical: 3 },
  speedText: { color: Colors.white, fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.bold },
  speedMenu: {
    position: 'absolute', bottom: 52, right: Spacing.md,
    backgroundColor: 'rgba(18,18,18,0.97)', borderRadius: 8, overflow: 'hidden',
    elevation: 12,
  },
  speedItem: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm },
  speedItemActive: { backgroundColor: Colors.primary },
  speedItemText: { color: Colors.white, fontSize: Typography.fontSize.sm },
  errorOverlay: { backgroundColor: 'rgba(0,0,0,0.85)', alignItems: 'center', justifyContent: 'center' },
  errorText: { color: Colors.white, fontSize: Typography.fontSize.base, marginBottom: Spacing.lg },
  retryBtn: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm, borderRadius: 6 },
  retryText: { color: Colors.white, fontWeight: Typography.fontWeight.bold },
});
