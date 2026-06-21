import React, { memo } from 'react';
import Slider from '@react-native-community/slider';

import { Colors } from '@/config/theme';

import type { VideoSeekBarProps } from './VideoSeekBar.types';

function clampTime(value: number, duration: number): number {
  if (!Number.isFinite(duration) || duration <= 0) {
    return 0;
  }

  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(value, duration));
}

function IOSVideoSeekBar({
  duration,
  currentTime,
  disabled = false,
  style,
  onSeekStart,
  onSeekChange,
  onSeekComplete,
}: VideoSeekBarProps) {
  const maximumValue = duration > 0 ? duration : 1;
  const safeValue = clampTime(currentTime, maximumValue);

  return (
    <Slider
      style={style}
      minimumValue={0}
      maximumValue={maximumValue}
      value={safeValue}
      disabled={disabled || duration <= 0}
      minimumTrackTintColor={Colors.primary}
      maximumTrackTintColor="rgba(255,255,255,0.25)"
      thumbTintColor={Colors.white}
      onSlidingStart={onSeekStart}
      onValueChange={onSeekChange}
      onSlidingComplete={onSeekComplete}
    />
  );
}

export default memo(IOSVideoSeekBar);
