import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList, MainTabParamList } from '@/navigation/types';
import type { KKMovie, MovieFilterParams } from '@/types';
import { Colors, Typography, Spacing } from '@/config/theme';
import { useInfiniteMovieList, flattenInfiniteMovies } from '@/features/home/hooks/useMovieLists';
import { useCategories } from '../hooks/useCategories';
import { useCountries } from '../hooks/useCountries';
import MovieGrid from '@/components/movie/MovieGrid';
import MovieGridSkeleton from '@/components/movie/MovieGridSkeleton';
import FilterBottomSheet from '../components/FilterBottomSheet';
import { MOVIE_TYPE_LIST } from '@/services/api/endpoints';
import { Icon } from '@/components/common';
import { muiColor } from '@/themes';
import FastImage from 'react-native-fast-image';

type Route = RouteProp<MainTabParamList, 'Filter'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

type FilterState = {
  typeList?: string;
  category?: string;
  country?: string;
  year?: string;
  lang?: string;
  sortField?: string;
  sortType?: string;
  [key: string]: string | undefined;
};

const TYPE_LIST_OPTIONS = [
  { label: 'Phim bộ', value: MOVIE_TYPE_LIST.PHIM_BO },
  { label: 'Phim lẻ', value: MOVIE_TYPE_LIST.PHIM_LE },
  { label: 'TV Shows', value: MOVIE_TYPE_LIST.TV_SHOWS },
  { label: 'Hoạt hình', value: MOVIE_TYPE_LIST.HOAT_HINH },
  { label: 'Vietsub', value: MOVIE_TYPE_LIST.PHIM_VIETSUB },
  { label: 'Thuyết minh', value: MOVIE_TYPE_LIST.PHIM_THUYET_MINH },
  { label: 'Lồng tiếng', value: MOVIE_TYPE_LIST.PHIM_LONG_TIENG },
];

function createFilterState(params?: MainTabParamList['Filter']): FilterState {
  const hasRouteFilters = Boolean(
    params?.type
    || params?.category
    || params?.country
    || params?.year
    || params?.lang
    || params?.sort
  );

  return {
    typeList: hasRouteFilters ? (params?.type ?? '') : MOVIE_TYPE_LIST.PHIM_BO,
    category: params?.category ?? '',
    country: params?.country ?? '',
    year: params?.year ?? '',
    lang: params?.lang ?? '',
    sortField: params?.sort ?? 'modified.time',
    sortType: 'desc',
  };
}

export default function FilterScreen() {
  const navigation = useNavigation() as unknown as Nav;
  const route = useRoute() as unknown as Route;
  const insets = useSafeAreaInsets();
  const routeCategory = route.params?.category;
  const routeCountry = route.params?.country;
  const routeLang = route.params?.lang;
  const routeRequestId = route.params?.requestId;
  const routeSort = route.params?.sort;
  const routeType = route.params?.type;
  const routeYear = route.params?.year;
  const routeFilterState = useMemo(() => createFilterState({
    type: routeType,
    category: routeCategory,
    country: routeCountry,
    year: routeYear,
    lang: routeLang,
    sort: routeSort,
    requestId: routeRequestId,
  }), [routeCategory, routeCountry, routeLang, routeRequestId, routeSort, routeType, routeYear]);
  const hasRouteParams = route.params != null;
  const [filter, setFilter] = useState<FilterState>(routeFilterState);
  const [showSheet, setShowSheet] = useState(false);

  useEffect(() => {
    if (!hasRouteParams) {
      return;
    }

    setFilter(routeFilterState);
  }, [hasRouteParams, routeFilterState]);

  const { data: categories } = useCategories();
  const { data: countries } = useCountries();

  const queryParams = useMemo<Partial<MovieFilterParams>>(() => {
    const params: Partial<MovieFilterParams> = {};

    if (filter.typeList) params.typeList = filter.typeList;
    if (filter.category) params.category = filter.category;
    if (filter.country) params.country = filter.country;
    if (filter.year) params.year = filter.year;
    if (filter.lang) params.lang = filter.lang;
    if (filter.sortField) {
      params.sortField = filter.sortField;
      if (filter.sortType) {
        params.sortType = filter.sortType as 'asc' | 'desc';
      }
    }

    return params;
  }, [filter.category, filter.country, filter.lang, filter.sortField, filter.sortType, filter.typeList, filter.year]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useInfiniteMovieList(queryParams);

  const movies = useMemo<KKMovie[]>(
    () => flattenInfiniteMovies(data as Parameters<typeof flattenInfiniteMovies>[0]),
    [data],
  );

  const handleMoviePress = useCallback((movie: KKMovie) => {
    navigation.navigate('MovieDetail', { slug: movie.slug });
  }, [navigation]);

  const handleOpenSheet = useCallback(() => {
    setShowSheet(true);
  }, []);

  const handleTypeSelect = useCallback((typeList: string) => {
    setFilter((currentFilter) => ({
      ...currentFilter,
      typeList,
      category: '',
      country: '',
      year: '',
    }));
  }, []);

  const handleApplyFilter = useCallback((newFilter: FilterState) => {
    setFilter(prev => ({ ...prev, ...newFilter }));
    setShowSheet(false);
  }, []);

  const currentLabel = TYPE_LIST_OPTIONS.find(t => t.value === filter.typeList)?.label ?? 'Phim';
  const categoryLabel = filter.category
    ? (categories?.find(c => c.slug === filter.category)?.name ?? filter.category)
    : '';
  const countryLabel = filter.country
    ? (countries?.find(c => c.slug === filter.country)?.name ?? filter.country)
    : '';

  const activeFilters = useMemo(
    () => [currentLabel, categoryLabel, countryLabel, filter.year].filter(Boolean).join(' · '),
    [categoryLabel, countryLabel, currentLabel, filter.year],
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const ListHeader = useMemo(() => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Text style={styles.screenTitle}>Khám phá phim</Text>
        <TouchableOpacity style={styles.filterBtn} onPress={handleOpenSheet}>
          <Icon icon='AppsLight' size={14} color={muiColor.grey[0]} />
          <Text style={styles.filterBtnText}>Bộ lọc</Text>
        </TouchableOpacity>
      </View>
      {!!activeFilters && (
        <Text style={styles.activeFilters}>{activeFilters}</Text>
      )}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
        {TYPE_LIST_OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.chip, filter.typeList === opt.value && styles.chipActive]}
            onPress={() => handleTypeSelect(opt.value)}
          >
            <Text style={[styles.chipText, filter.typeList === opt.value && styles.chipTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  ), [activeFilters, filter.typeList, handleOpenSheet, handleTypeSelect]);

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {ListHeader}
        <MovieGridSkeleton rows={4} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }, styles.center]}>
        {ListHeader}
        <Text style={styles.errorText}>⚠️ Lỗi tải dữ liệu</Text>
        <TouchableOpacity onPress={() => refetch()} style={styles.retryBtn}>
          <Text style={styles.retryText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <MovieGrid
        movies={movies}
        onMoviePress={handleMoviePress}
        onEndReached={handleEndReached}
        isLoadingMore={isFetchingNextPage}
        ListHeaderComponent={ListHeader}
      />

      <FilterBottomSheet
        visible={showSheet}
        onClose={() => setShowSheet(false)}
        onApply={handleApplyFilter}
        currentFilter={filter}
        categories={categories ?? []}
        countries={countries ?? []}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: {},
  errorText: { color: Colors.textSecondary, marginBottom: Spacing.md, marginTop: 60 },
  retryBtn: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm, borderRadius: 6 },
  retryText: { color: Colors.white, fontWeight: Typography.fontWeight.bold },
  header: { paddingBottom: Spacing.sm },
  headerTop: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.base, paddingTop: Spacing.md, paddingBottom: Spacing.sm,
  },
  screenTitle: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.text },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.backgroundElevated,
    borderRadius: 8, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  filterBtnText: { color: Colors.text, fontSize: Typography.fontSize.sm },
  activeFilters: { color: Colors.primary, fontSize: Typography.fontSize.xs, paddingHorizontal: Spacing.base, marginBottom: Spacing.sm },
  chips: { paddingHorizontal: Spacing.base },
  chip: {
    backgroundColor: Colors.backgroundElevated,
    borderRadius: 20, paddingHorizontal: Spacing.md, paddingVertical: 6,
    marginRight: Spacing.sm,
  },
  chipActive: { backgroundColor: Colors.primary },
  chipText: { color: Colors.textSecondary, fontSize: Typography.fontSize.sm },
  chipTextActive: { color: Colors.white, fontWeight: Typography.fontWeight.bold },
});
