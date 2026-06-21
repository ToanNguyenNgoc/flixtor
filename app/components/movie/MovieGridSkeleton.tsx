import React, { memo, useMemo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import { BorderRadius, Colors, Spacing } from '@/config/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const NUM_COLUMNS = 3;
const PADDING = Spacing.base;
const GAP = Spacing.sm;
const CARD_WIDTH = (SCREEN_WIDTH - PADDING * 2 - GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;
const CARD_HEIGHT = CARD_WIDTH * 1.5;

interface MovieGridSkeletonProps {
  rows?: number;
  compact?: boolean;
}

function MovieGridSkeleton({
  rows = 4,
  compact = false,
}: MovieGridSkeletonProps) {
  const rowIndexes = useMemo(
    () => Array.from({ length: rows }, (_, index) => index),
    [rows],
  );

  return (
    <View style={compact ? styles.compactContainer : styles.container}>
      <SkeletonPlaceholder
        backgroundColor={Colors.skeletonBase}
        highlightColor={Colors.skeletonHighlight}
        speed={900}
        borderRadius={BorderRadius.sm}
      >
        <SkeletonPlaceholder.Item
          paddingHorizontal={compact ? 0 : PADDING}
          paddingTop={compact ? 0 : Spacing.sm}
        >
          {rowIndexes.map((rowIndex) => (
            <SkeletonPlaceholder.Item
              key={`row-${rowIndex}`}
              flexDirection="row"
              justifyContent="space-between"
              marginBottom={rowIndex === rowIndexes.length - 1 ? 0 : GAP}
            >
              <SkeletonPlaceholder.Item
                width={CARD_WIDTH}
                height={CARD_HEIGHT}
                borderRadius={BorderRadius.sm}
              />
              <SkeletonPlaceholder.Item
                width={CARD_WIDTH}
                height={CARD_HEIGHT}
                borderRadius={BorderRadius.sm}
              />
              <SkeletonPlaceholder.Item
                width={CARD_WIDTH}
                height={CARD_HEIGHT}
                borderRadius={BorderRadius.sm}
              />
            </SkeletonPlaceholder.Item>
          ))}
        </SkeletonPlaceholder.Item>
      </SkeletonPlaceholder>
    </View>
  );
}

export default memo(MovieGridSkeleton);

const styles = StyleSheet.create({
  container: {
    paddingBottom: Spacing.xl,
  },
  compactContainer: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
});
