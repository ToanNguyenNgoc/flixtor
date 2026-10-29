import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgIcons } from '@/assets/svg-component';
import { Icon } from '@/components/common';
import MovieGridSkeleton from '@/components/movie/MovieGridSkeleton';
import { BorderRadius, Colors, Spacing, Typography } from '@/config/theme';
import { muiColor } from '@/themes';
import type { RootStackParamList } from '@/navigation/types';
import FaphouseFilterSheet, {
  DEFAULT_FAPHOUSE_FILTER,
  type FaphouseFilterSheetHandle,
} from '../components/FaphouseFilterSheet';
import FaphouseMovieCard from '../components/FaphouseMovieCard';
import {
  useFaphouseActors,
  useFaphouseCountries,
  useFaphouseGenres,
  useFaphouseInfiniteMovies,
} from '../hooks/useFaphouse';
import type { FaphouseFilterState, FaphouseMovie } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const NUM_COLUMNS = 3;
const GAP = Spacing.sm;
const CARD_WIDTH = (SCREEN_WIDTH - Spacing.base * 2 - GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;
const CARD_HEIGHT = CARD_WIDTH * 1.5;
// API list chưa hỗ trợ lọc theo diễn viên nên lọc phía client; giới hạn số trang tự tải thêm.
const ACTOR_FILTER_MIN_RESULTS = 6;
const ACTOR_FILTER_MAX_PAGES = 10;

const keyExtractor = (movie: FaphouseMovie) => movie.id;
const ItemSeparator = () => <View style={styles.rowSeparator} />;

export default function FaphouseScreen() {
  const navigation = useNavigation() as unknown as Nav;
  const insets = useSafeAreaInsets();

  const filterSheetRef = useRef<FaphouseFilterSheetHandle>(null);
  const [filter, setFilter] = useState<FaphouseFilterState>(DEFAULT_FAPHOUSE_FILTER);
  const { genre, country, actor, sort } = filter;

  const { data: genres } = useFaphouseGenres();
  const { data: countries } = useFaphouseCountries();
  const { data: actors } = useFaphouseActors();

  const queryParams = useMemo(() => ({
    sort,
    genre: genre || undefined,
    country: country || undefined,
  }), [country, genre, sort]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useFaphouseInfiniteMovies(queryParams);

  const loadedPages = data?.pages.length ?? 0;

  const movies = useMemo<FaphouseMovie[]>(() => {
    const all = data?.pages.flatMap(page => page.items) ?? [];
    if (!actor) {
      return all;
    }
    return all.filter(movie => movie.actors.some(item => item.slug === actor));
  }, [actor, data]);

  useEffect(() => {
    if (
      actor
      && hasNextPage
      && !isFetchingNextPage
      && movies.length < ACTOR_FILTER_MIN_RESULTS
      && loadedPages < ACTOR_FILTER_MAX_PAGES
    ) {
      fetchNextPage();
    }
  }, [actor, fetchNextPage, hasNextPage, isFetchingNextPage, loadedPages, movies.length]);

  const handleOpenSheet = useCallback(() => {
    filterSheetRef.current?.open();
  }, []);

  const activeFilters = useMemo(() => {
    const genreLabel = genres?.find(item => item.slug === genre)?.name;
    const countryLabel = countries?.find(item => item.slug === country)?.name;
    const actorLabel = actors?.find(item => item.slug === actor)?.name;
    return [genreLabel, countryLabel, actorLabel].filter(Boolean).join(' · ');
  }, [actor, actors, countries, country, genre, genres]);

  const handleMoviePress = useCallback((movie: FaphouseMovie) => {
    navigation.navigate('FaphouseDetail', { slug: movie.slug });
  }, [navigation]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const renderMovie = useCallback(({ item }: { item: FaphouseMovie }) => (
    <FaphouseMovieCard
      movie={item}
      width={CARD_WIDTH}
      height={CARD_HEIGHT}
      onPress={handleMoviePress}
    />
  ), [handleMoviePress]);

  const listEmpty = useMemo(() => {
    if (isLoading) {
      return <MovieGridSkeleton rows={4} />;
    }

    if (isError) {
      return (
        <View style={styles.center}>
          <Text style={styles.message}>Lỗi tải dữ liệu</Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (isFetchingNextPage) {
      return <MovieGridSkeleton rows={2} compact />;
    }

    return (
      <View style={styles.center}>
        <Text style={styles.message}>Không có phim nào</Text>
      </View>
    );
  }, [isError, isFetchingNextPage, isLoading, refetch]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={styles.hitSlop}
        >
          <SvgIcons.CaretLeft width={28} height={28} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Faphouse</Text>
        <TouchableOpacity style={styles.filterButton} onPress={handleOpenSheet}>
          <Icon icon="AppsLight" size={14} color={muiColor.grey[0]} />
          <Text style={styles.filterButtonText}>Bộ lọc</Text>
        </TouchableOpacity>
      </View>
      {!!activeFilters && <Text style={styles.activeFilters}>{activeFilters}</Text>}

      <FlatList
        data={isLoading || isError ? [] : movies}
        keyExtractor={keyExtractor}
        renderItem={renderMovie}
        numColumns={NUM_COLUMNS}
        columnWrapperStyle={styles.columnWrapper}
        ItemSeparatorComponent={ItemSeparator}
        ListEmptyComponent={listEmpty}
        ListFooterComponent={isFetchingNextPage && movies.length > 0
          ? <MovieGridSkeleton rows={1} compact />
          : null}
        contentContainerStyle={styles.listContent}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.4}
        showsVerticalScrollIndicator={false}
        initialNumToRender={9}
        maxToRenderPerBatch={9}
        windowSize={5}
        removeClippedSubviews
      />

      <FaphouseFilterSheet
        ref={filterSheetRef}
        currentFilter={filter}
        genres={genres ?? []}
        countries={countries ?? []}
        actors={actors ?? []}
        onApply={setFilter}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  backButton: { padding: Spacing.xs },
  hitSlop: { top: 8, bottom: 8, left: 8, right: 8 },
  screenTitle: {
    flex: 1,
    marginLeft: Spacing.xs,
    color: Colors.text,
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
  },
  filterButtonText: { color: Colors.text, fontSize: Typography.fontSize.sm },
  activeFilters: {
    color: Colors.primary,
    fontSize: Typography.fontSize.xs,
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
  },
  listContent: { paddingTop: Spacing.sm, paddingBottom: 100 },
  columnWrapper: { paddingHorizontal: Spacing.base, gap: GAP },
  rowSeparator: { height: GAP },
  center: { alignItems: 'center', paddingTop: 60 },
  message: { color: Colors.textSecondary, fontSize: Typography.fontSize.base },
  retryButton: {
    marginTop: Spacing.md,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  retryText: { color: Colors.white, fontWeight: Typography.fontWeight.bold },
});
