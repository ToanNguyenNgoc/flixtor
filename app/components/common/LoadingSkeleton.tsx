import React, { memo } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { Colors, Spacing, BorderRadius, CardSize, Screen } from '@/config/theme';
import { useEffect, useRef } from 'react';

interface SkeletonBoxProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: object;
}

export const SkeletonBox = memo(({ width, height, borderRadius = BorderRadius.md, style }: SkeletonBoxProps) => {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, easing: Easing.ease, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, easing: Easing.ease, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [shimmer]);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.8] });

  return (
    <Animated.View style={[{ width, height, borderRadius, backgroundColor: Colors.skeletonBase, opacity }, style]} />
  );
});

export const HomeScreenSkeleton = memo(() => (
  <View style={styles.container}>
    {/* Hero skeleton */}
    <SkeletonBox width={Screen.width} height={420} borderRadius={0} />
    <View style={styles.section}>
      <SkeletonBox width={140} height={18} style={{ marginBottom: Spacing.md }} />
      <View style={styles.row}>
        {[0, 1, 2, 3].map(i => (
          <SkeletonBox key={i} width={CardSize.backdrop.width} height={CardSize.backdrop.height} style={styles.card} />
        ))}
      </View>
    </View>
    <View style={styles.section}>
      <SkeletonBox width={160} height={18} style={{ marginBottom: Spacing.md }} />
      <View style={styles.row}>
        {[0, 1, 2, 3].map(i => (
          <SkeletonBox key={i} width={CardSize.poster.width} height={CardSize.poster.height} style={styles.card} />
        ))}
      </View>
    </View>
  </View>
));

export const MovieDetailSkeleton = memo(() => (
  <View style={styles.container}>
    <SkeletonBox width={Screen.width} height={320} borderRadius={0} />
    <View style={{ padding: Spacing.base }}>
      <SkeletonBox width={200} height={24} style={{ marginBottom: Spacing.sm }} />
      <SkeletonBox width={120} height={16} style={{ marginBottom: Spacing.lg }} />
      <SkeletonBox width="100%" height={14} style={{ marginBottom: Spacing.xs }} />
      <SkeletonBox width="90%" height={14} style={{ marginBottom: Spacing.xs }} />
      <SkeletonBox width="70%" height={14} style={{ marginBottom: Spacing.xl }} />
    </View>
  </View>
));

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  section: { padding: Spacing.base, marginTop: Spacing.md },
  row: { flexDirection: 'row', gap: Spacing.sm },
  card: { marginRight: Spacing.sm },
});

export default HomeScreenSkeleton;
