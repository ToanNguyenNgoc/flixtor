import React, { memo, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

import { BorderRadius, Colors } from '@/config/theme';

import type { VideoSeekBarProps } from './VideoSeekBar.types';

const TRACK_HEIGHT = 4;
const TOUCH_HEIGHT = 40;
const THUMB_SIZE = 18;

function clamp(value: number, min: number, max: number): number {
  'worklet';
  return Math.max(min, Math.min(value, max));
}

function normalizeTime(value: number, duration: number): number {
  if (!Number.isFinite(duration) || duration <= 0) {
    return 0;
  }

  if (!Number.isFinite(value)) {
    return 0;
  }

  return clamp(value, 0, duration);
}

function timeToProgress(time: number, duration: number): number {
  'worklet';

  if (!Number.isFinite(duration) || duration <= 0) {
    return 0;
  }

  const safeTime = clamp(time, 0, duration);
  return safeTime / duration;
}

function AndroidVideoSeekBar({
  duration,
  currentTime,
  bufferedTime = 0,
  disabled = false,
  style,
  onSeekStart,
  onSeekChange,
  onSeekComplete,
}: VideoSeekBarProps) {
  const trackWidth = useSharedValue(0);
  const progress = useSharedValue(0);
  const bufferProgress = useSharedValue(0);
  const activeSeekTime = useSharedValue(0);
  const isPanActive = useSharedValue(false);

  useEffect(() => {
    progress.value = timeToProgress(currentTime, duration);
  }, [currentTime, duration, progress]);

  useEffect(() => {
    const currentProgress = timeToProgress(currentTime, duration);
    const bufferedProgress = timeToProgress(bufferedTime, duration);
    bufferProgress.value = Math.max(currentProgress, bufferedProgress);
  }, [bufferedTime, currentTime, duration, bufferProgress]);

  const emitSeekChange = (time: number) => {
    onSeekChange(normalizeTime(time, duration));
  };

  const emitSeekStart = (time: number) => {
    onSeekStart(normalizeTime(time, duration));
  };

  const emitSeekComplete = (time: number) => {
    onSeekComplete(normalizeTime(time, duration));
  };

  const panGesture = Gesture.Pan()
    .enabled(!disabled && duration > 0)
    .minDistance(0)
    .shouldCancelWhenOutside(false)
    .onStart(event => {
      const width = trackWidth.value;
      if (width <= 0) {
        return;
      }

      const clampedX = clamp(event.x - (THUMB_SIZE / 2), 0, width);
      const nextProgress = clampedX / width;
      const nextTime = nextProgress * duration;

      progress.value = nextProgress;
      activeSeekTime.value = nextTime;
      isPanActive.value = true;
      runOnJS(emitSeekStart)(nextTime);
      runOnJS(emitSeekChange)(nextTime);
    })
    .onUpdate(event => {
      const width = trackWidth.value;
      if (width <= 0) {
        return;
      }

      const clampedX = clamp(event.x - (THUMB_SIZE / 2), 0, width);
      const nextProgress = clampedX / width;
      const nextTime = nextProgress * duration;

      progress.value = nextProgress;
      activeSeekTime.value = nextTime;
      runOnJS(emitSeekChange)(nextTime);
    })
    .onEnd(event => {
      const width = trackWidth.value;
      if (width <= 0) {
        return;
      }

      const clampedX = clamp(event.x - (THUMB_SIZE / 2), 0, width);
      const nextProgress = clampedX / width;
      const nextTime = nextProgress * duration;

      progress.value = nextProgress;
      activeSeekTime.value = nextTime;
      isPanActive.value = false;
      runOnJS(emitSeekComplete)(nextTime);
    })
    .onFinalize(() => {
      if (!isPanActive.value) {
        return;
      }

      isPanActive.value = false;
      runOnJS(emitSeekComplete)(activeSeekTime.value);
    });

  const bufferedStyle = useAnimatedStyle(() => ({
    width: trackWidth.value * bufferProgress.value,
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: trackWidth.value * progress.value,
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: trackWidth.value * progress.value }],
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <View
        style={[styles.touchArea, style, disabled && styles.touchAreaDisabled]}
        onLayout={event => {
          trackWidth.value = Math.max(event.nativeEvent.layout.width - THUMB_SIZE, 0);
        }}
      >
        <View style={styles.track}>
          <Animated.View style={[styles.bufferTrack, bufferedStyle]} />
          <Animated.View style={[styles.progressTrack, progressStyle]} />
        </View>
        <Animated.View style={[styles.thumb, thumbStyle]} />
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  touchArea: {
    height: TOUCH_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: THUMB_SIZE / 2,
    overflow: 'visible',
  },
  touchAreaDisabled: {
    opacity: 0.5,
  },
  track: {
    height: TRACK_HEIGHT,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
  },
  bufferTrack: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.42)',
  },
  progressTrack: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
  },
  thumb: {
    position: 'absolute',
    left: 0,
    top: (TOUCH_HEIGHT - THUMB_SIZE) / 2,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.16)',
  },
});

export default memo(AndroidVideoSeekBar);
