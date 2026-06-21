import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, BorderRadius } from '@/config/theme';

interface ProgressBarProps {
  progress: number; // 0-1
  height?: number;
  color?: string;
  backgroundColor?: string;
  borderRadius?: number;
}

const ProgressBar = memo(({ progress, height = 3, color = Colors.primary, backgroundColor = Colors.border, borderRadius = BorderRadius.full }: ProgressBarProps) => {
  const clampedProgress = Math.min(1, Math.max(0, progress));
  return (
    <View style={[styles.track, { height, backgroundColor, borderRadius }]}>
      <View style={[styles.fill, { width: `${clampedProgress * 100}%`, backgroundColor: color, borderRadius }]} />
    </View>
  );
});

export default ProgressBar;

const styles = StyleSheet.create({
  track: { width: '100%', overflow: 'hidden' },
  fill: { height: '100%' },
});
