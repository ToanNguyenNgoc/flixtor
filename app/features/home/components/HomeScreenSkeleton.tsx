import React, { memo, useMemo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import { BorderRadius, Colors, Spacing } from '@/config/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const HERO_HEIGHT = Math.max(SCREEN_HEIGHT * 0.76, SCREEN_WIDTH * 1.48);
const HERO_POSTER_WIDTH = Math.min(SCREEN_WIDTH * 0.52, 232);
const HERO_POSTER_HEIGHT = Math.min(SCREEN_HEIGHT * 0.42, HERO_POSTER_WIDTH * 1.46);
const HORIZONTAL_CARD_WIDTH = 120;
const HORIZONTAL_CARD_HEIGHT = 180;
const QUICK_ACTION_WIDTH = 164;
const QUICK_ACTION_HEIGHT = 120;

interface HomeScreenSkeletonProps {
  topInset: number;
  sectionCount?: number;
}

function HomeScreenSkeleton({
  topInset,
  sectionCount = 4,
}: HomeScreenSkeletonProps) {
  const sections = useMemo(
    () => Array.from({ length: sectionCount }, (_, index) => index),
    [sectionCount],
  );
  const cards = useMemo(
    () => Array.from({ length: 4 }, (_, index) => index),
    [],
  );

  return (
    <View style={styles.container}>
      <SkeletonPlaceholder
        backgroundColor={Colors.skeletonBase}
        highlightColor={Colors.skeletonHighlight}
        speed={900}
        borderRadius={BorderRadius.sm}
      >
        <SkeletonPlaceholder.Item>
          <SkeletonPlaceholder.Item width={SCREEN_WIDTH} height={HERO_HEIGHT}>
            <SkeletonPlaceholder.Item
              width={HERO_POSTER_WIDTH}
              height={HERO_POSTER_HEIGHT}
              borderRadius={BorderRadius.md}
              alignSelf="center"
              marginTop={topInset + Spacing.base}
            />
            <SkeletonPlaceholder.Item
              width={180}
              height={14}
              borderRadius={BorderRadius.full}
              alignSelf="center"
              marginTop={Spacing.lg}
            />
            <SkeletonPlaceholder.Item
              width={240}
              height={12}
              borderRadius={BorderRadius.full}
              alignSelf="center"
              marginTop={Spacing.md}
            />
            <SkeletonPlaceholder.Item
              flexDirection="row"
              justifyContent="space-between"
              alignSelf="center"
              width={SCREEN_WIDTH - Spacing.base * 4}
              marginTop={Spacing.xl}
            >
              <SkeletonPlaceholder.Item
                width={72}
                height={44}
                borderRadius={BorderRadius.sm}
              />
              <SkeletonPlaceholder.Item
                width={148}
                height={48}
                borderRadius={BorderRadius.sm}
              />
              <SkeletonPlaceholder.Item
                width={72}
                height={44}
                borderRadius={BorderRadius.sm}
              />
            </SkeletonPlaceholder.Item>
          </SkeletonPlaceholder.Item>

          <SkeletonPlaceholder.Item
            paddingHorizontal={Spacing.base}
            marginTop={Spacing.xl}
          >
            <SkeletonPlaceholder.Item
              width={120}
              height={12}
              borderRadius={BorderRadius.full}
            />
            <SkeletonPlaceholder.Item
              width={210}
              height={18}
              borderRadius={BorderRadius.full}
              marginTop={Spacing.sm}
              marginBottom={Spacing.base}
            />
            <SkeletonPlaceholder.Item flexDirection="row">
              {cards.slice(0, 3).map((cardIndex) => (
                <SkeletonPlaceholder.Item
                  key={`quick-action-${cardIndex}`}
                  width={QUICK_ACTION_WIDTH}
                  height={QUICK_ACTION_HEIGHT}
                  borderRadius={BorderRadius.xl}
                  marginRight={cardIndex === 2 ? 0 : Spacing.sm}
                />
              ))}
            </SkeletonPlaceholder.Item>
          </SkeletonPlaceholder.Item>

          {sections.map((sectionIndex) => (
            <SkeletonPlaceholder.Item
              key={`section-${sectionIndex}`}
              paddingHorizontal={Spacing.base}
              marginTop={Spacing.xl}
            >
              <SkeletonPlaceholder.Item
                width={160}
                height={18}
                borderRadius={BorderRadius.full}
                marginBottom={Spacing.md}
              />
              <SkeletonPlaceholder.Item flexDirection="row">
                {cards.map((cardIndex) => (
                  <SkeletonPlaceholder.Item
                    key={`card-${sectionIndex}-${cardIndex}`}
                    width={HORIZONTAL_CARD_WIDTH}
                    height={HORIZONTAL_CARD_HEIGHT}
                    borderRadius={BorderRadius.sm}
                    marginRight={cardIndex === cards.length - 1 ? 0 : Spacing.sm}
                  />
                ))}
              </SkeletonPlaceholder.Item>
            </SkeletonPlaceholder.Item>
          ))}
        </SkeletonPlaceholder.Item>
      </SkeletonPlaceholder>
    </View>
  );
}

export default memo(HomeScreenSkeleton);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingBottom: 120,
  },
});
