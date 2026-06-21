import React, { memo, useCallback } from 'react';
import {
  View, FlatList, StyleSheet, Text,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import type { KKMovie } from '@/types';
import MovieCard from './MovieCard';
import MovieGridSkeleton from './MovieGridSkeleton';
import { Colors, Typography, Spacing } from '@/config/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const NUM_COLUMNS = 3;
const PADDING = Spacing.base;
const GAP = Spacing.sm;
const CARD_WIDTH = (SCREEN_WIDTH - PADDING * 2 - GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;
const CARD_HEIGHT = CARD_WIDTH * 1.5;

interface MovieGridProps {
  movies: KKMovie[];
  onEndReached?: () => void;
  isLoadingMore?: boolean;
  ListHeaderComponent?: React.ReactElement | null;
  onMoviePress?: (movie: KKMovie) => void;
  onScroll?:(e?: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onScrollBeginDrag?: () => void;
}

const Separator = () => <View style={separatorStyle} />;
const separatorStyle = { height: GAP };

function MovieGrid({
  movies,
  onEndReached,
  isLoadingMore,
  ListHeaderComponent,
  onMoviePress,
  onScroll,
  onScrollBeginDrag,
}: MovieGridProps) {
  const renderItem = useCallback(({ item, index }: { item: KKMovie; index: number }) => (
    <View style={[styles.item, index % NUM_COLUMNS !== 0 && styles.itemMargin]}>
      <MovieCard
        movie={item}
        width={CARD_WIDTH}
        height={CARD_HEIGHT}
        onPress={onMoviePress}
      />
    </View>
  ), [onMoviePress]);

  const Footer = isLoadingMore ? <MovieGridSkeleton rows={1} compact /> : null;
  const Empty = (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>Không có phim nào</Text>
    </View>
  );

  return (
    <FlatList
      data={movies}
      keyExtractor={item => item._id ?? item.slug}
      renderItem={renderItem}
      numColumns={NUM_COLUMNS}
      contentContainerStyle={[styles.list, !movies.length && styles.listEmpty]}
      columnWrapperStyle={styles.row}
      ItemSeparatorComponent={Separator}
      onEndReached={onEndReached}
      onScroll={onScroll}
      onScrollBeginDrag={onScrollBeginDrag}
      onEndReachedThreshold={0.4}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={Footer}
      ListEmptyComponent={Empty}
      showsVerticalScrollIndicator={false}
      initialNumToRender={9}
      removeClippedSubviews
      maxToRenderPerBatch={9}
      updateCellsBatchingPeriod={50}
      windowSize={5}
      keyboardShouldPersistTaps="handled"
    />
  );
}

export default memo(MovieGrid);

const styles = StyleSheet.create({
  list: { padding: PADDING, paddingBottom: 100 },
  listEmpty: { flexGrow: 1 },
  row: { gap: GAP },
  item: { flex: 1 / NUM_COLUMNS },
  itemMargin: {},
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyText: { color: Colors.textMuted, fontSize: Typography.fontSize.base },
});
