import React, { memo, useCallback, useEffect, useMemo } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/common';
import HeroBanner from '@/components/movie/HeroBanner';
import MovieCard from '@/components/movie/MovieCard';
import ResumeMovieCard, { type ResumeMovieCardItem } from '@/components/movie/ResumeMovieCard';
import {
  BorderRadius,
  Colors,
  Spacing,
  Typography,
} from '@/config/theme';
import { SvgIcons } from '@/assets/svg-component';
import type { MainTabParamList, RootStackParamList } from '@/navigation/types';
import { MOVIE_TYPE_LIST } from '@/services/api/endpoints';
import type {
  KKMovie,
  LocalWatchHistoryItem,
  WatchHistoryItem,
} from '@/types';
import { IMAGE_PREFETCH_LIMITS, prefetchImages } from '@/utils/imageCache';
import HomeScreenSkeleton from '../components/HomeScreenSkeleton';
import {
  useCountryMovieList,
  useLatestMovies,
  useMovieList,
} from '../hooks/useMovieLists';
import {
  useDeleteUserHistory,
  useUserHistory,
} from '@/features/history/hooks/useUserHistory';
import { useAuthStore } from '@/features/auth/store/authStore';
import { getUserHistoryErrorMessage } from '@/features/history/services/userHistoryService';
import { useWatchHistoryStore } from '@/features/history/store/watchHistoryStore';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type FilterParams = NonNullable<MainTabParamList['Filter']>;

const HORIZONTAL_CARD_WIDTH = 128;
const HORIZONTAL_CARD_HEIGHT = 192;
const CONTINUE_CARD_WIDTH = 144;
const CONTINUE_CARD_HEIGHT = 216;
const HERO_CAROUSEL_COUNT = 5;
const SECTION_PREFETCH_COUNT = 2;
const VIETNAM_COUNTRY_SLUG = 'viet-nam';

interface HomeSection {
  key: string;
  title: string;
  subtitle: string;
  movies: KKMovie[];
  filterParams?: FilterParams;
}

interface QuickActionItem {
  key: string;
  title: string;
  caption: string;
  icon: keyof typeof SvgIcons;
  filterParams?: FilterParams;
  target?: 'Search';
}

interface SectionRowProps {
  item: HomeSection;
  onMoviePress: (movie: KKMovie) => void;
  onSeeAll: (params: FilterParams) => void;
}

interface QuickActionCardProps {
  item: QuickActionItem;
  onPress: (item: QuickActionItem) => void;
}

interface ContinueWatchingEntry extends ResumeMovieCardItem {
  episodeSlug?: string;
  isRemote: boolean;
  key: string;
  slug: string;
}

const SECTION_SEPARATOR = () => <View style={styles.sectionSeparator} />;
const HORIZONTAL_SEPARATOR = () => <View style={styles.horizontalSeparator} />;

const ContinueWatchingCard = memo(function ContinueWatchingCard({
  isDeleting,
  item,
  onDelete,
  onPress,
}: {
  isDeleting: boolean;
  item: ContinueWatchingEntry;
  onDelete: (item: ContinueWatchingEntry) => void;
  onPress: (item: ContinueWatchingEntry) => void;
}) {
  return (
    <ResumeMovieCard
      actionDisabled={isDeleting}
      actionIcon={item.isRemote ? 'TrashLight' : undefined}
      actionLabel={item.isRemote ? 'Xóa phim này khỏi lịch sử xem' : undefined}
      actionLoading={isDeleting}
      item={item}
      width={CONTINUE_CARD_WIDTH}
      height={CONTINUE_CARD_HEIGHT}
      onActionPress={item.isRemote ? () => onDelete(item) : undefined}
      onPress={() => onPress(item)}
    />
  );
});

const QuickActionCard = memo(function QuickActionCard({
  item,
  onPress,
}: QuickActionCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onPress(item)}
      style={styles.quickActionCard}
    >
      <View style={styles.quickActionIconWrap}>
        <Icon icon={item.icon} color={Colors.white} size={18} />
      </View>
      <Text style={styles.quickActionTitle}>{item.title}</Text>
      <Text style={styles.quickActionCaption} numberOfLines={2}>
        {item.caption}
      </Text>
    </TouchableOpacity>
  );
});

const SectionRow = memo(function SectionRow({
  item,
  onMoviePress,
  onSeeAll,
}: SectionRowProps) {
  const renderMovie = useCallback(({ item: movie }: { item: KKMovie }) => (
    <MovieCard
      movie={movie}
      width={HORIZONTAL_CARD_WIDTH}
      height={HORIZONTAL_CARD_HEIGHT}
      onPress={onMoviePress}
    />
  ), [onMoviePress]);
  if (!item.movies.length) {
    return null;
  }

  return (
    <View style={styles.sectionBlock}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderContent}>
          <Text style={styles.sectionEyebrow}>{item.subtitle}</Text>
          <Text style={styles.sectionTitle}>{item.title}</Text>
        </View>

        <View style={styles.sectionActions}>
          {item.filterParams && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onSeeAll(item.filterParams as any)}
              style={styles.seeAllButton}
            >
              <Text style={styles.seeAllText}>Khám phá</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={item.movies}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={movie => movie._id ?? movie.slug}
        renderItem={renderMovie}
        ItemSeparatorComponent={HORIZONTAL_SEPARATOR}
        contentContainerStyle={styles.horizontalListContent}
        removeClippedSubviews
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        windowSize={5}
        getItemLayout={(_, index) => ({
          length: HORIZONTAL_CARD_WIDTH + Spacing.sm,
          offset: (HORIZONTAL_CARD_WIDTH + Spacing.sm) * index,
          index,
        })}
      />
    </View>
  );
});

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const localHistoryItems = useWatchHistoryStore(state => state.items);
  const deleteHistory = useDeleteUserHistory();
  const { data: remoteHistoryData, isError: isRemoteHistoryError } = useUserHistory(1, 10);

  const { data: latestData, isLoading: latestLoading, refetch, isFetching } = useLatestMovies(1);
  const { data: phimBo, isLoading: phimBoLoading } = useMovieList(MOVIE_TYPE_LIST.PHIM_BO, 1);
  const { data: phimLe, isLoading: phimLeLoading } = useMovieList(MOVIE_TYPE_LIST.PHIM_LE, 1);
  const { data: hoatHinh, isLoading: hoatHinhLoading } = useMovieList(MOVIE_TYPE_LIST.HOAT_HINH, 1);
  const { data: tvShows, isLoading: tvShowsLoading } = useMovieList(MOVIE_TYPE_LIST.TV_SHOWS, 1);
  const { data: phimVietNam, isLoading: phimVietNamLoading } = useCountryMovieList(VIETNAM_COUNTRY_SLUG, 1);

  const latestMovies = useMemo<KKMovie[]>(
    () => latestData?.items ?? latestData?.data?.items ?? [],
    [latestData],
  );

  const heroMovies = useMemo(
    () => latestMovies.slice(0, HERO_CAROUSEL_COUNT),
    [latestMovies],
  );

  const heroMovieSlugs = useMemo(
    () => new Set(heroMovies.map(movie => movie.slug)),
    [heroMovies],
  );

  const latestSectionMovies = useMemo(
    () => latestMovies.filter(movie => !heroMovieSlugs.has(movie.slug)).slice(0, 12),
    [heroMovieSlugs, latestMovies],
  );

  const isInitialLoading = latestLoading
    || phimBoLoading
    || phimLeLoading
    || hoatHinhLoading
    || tvShowsLoading
    || phimVietNamLoading;

  const continueWatchingItems = useMemo<ContinueWatchingEntry[]>(() => {
    const remoteItems = remoteHistoryData?.items ?? [];

    if (isAuthenticated && remoteItems.length > 0) {
      return remoteItems.map((item: WatchHistoryItem) => ({
        key: `${item.movieSlug}:${item.episodeSlug ?? 'default'}`,
        movie: {
          name: item.movie.name,
          slug: item.movieSlug,
          poster_url: item.movie.posterUrl,
          thumb_url: item.movie.thumbUrl,
          year: item.movie.year,
          type: item.movie.type,
        },
        slug: item.movieSlug,
        episodeSlug: item.episodeSlug ?? undefined,
        isRemote: true,
        progressPercent: 40,
        progressSeconds: item.progressSeconds,
        subtitle: [
          item.movie.year ? String(item.movie.year) : null,
          item.movie.type ?? null,
        ].filter((part): part is string => Boolean(part)).join(' • '),
        episodeLabel: item.episodeSlug ? `Đang xem ${item.episodeSlug}` : 'Bản đầy đủ',
      }));
    }

    if (isAuthenticated) {
      if (isRemoteHistoryError) {
        return localHistoryItems.slice(0, 10).map((item: LocalWatchHistoryItem) => ({
          key: `${item.slug}:${item.episodeSlug ?? 'default'}`,
          movie: {
            name: item.name ?? item.slug,
            slug: item.slug,
            poster_url: item.poster_url,
            thumb_url: item.thumb_url,
          },
          slug: item.slug,
          episodeSlug: item.episodeSlug,
          isRemote: false,
          progressPercent: item.percent,
          progressSeconds: item.progress,
          subtitle: item.origin_name ?? 'Tiếp tục xem',
          episodeLabel: item.episodeName ?? item.episodeSlug,
        }));
      }

      return [];
    }

    if (!isAuthenticated) {
      return localHistoryItems.slice(0, 10).map((item: LocalWatchHistoryItem) => ({
        key: `${item.slug}:${item.episodeSlug ?? 'default'}`,
        movie: {
          name: item.name ?? item.slug,
          slug: item.slug,
          poster_url: item.poster_url,
          thumb_url: item.thumb_url,
        },
        slug: item.slug,
        episodeSlug: item.episodeSlug,
        isRemote: false,
        progressPercent: item.percent,
        progressSeconds: item.progress,
        subtitle: item.origin_name ?? 'Tiếp tục xem',
        episodeLabel: item.episodeName ?? item.episodeSlug,
      }));
    }

    return [];
  }, [isAuthenticated, isRemoteHistoryError, localHistoryItems, remoteHistoryData?.items]);

  const sections = useMemo<HomeSection[]>(() => [
    {
      key: 'latest',
      title: 'Mới cập nhật',
      subtitle: 'Vừa lên sóng gần đây',
      movies: latestSectionMovies,
    },
    {
      key: 'vietnam',
      title: 'Phim Việt Nam',
      subtitle: 'Nội dung gần gũi và đang được quan tâm',
      movies: phimVietNam ?? [],
      filterParams: { country: VIETNAM_COUNTRY_SLUG },
    },
    {
      key: 'series',
      title: 'Phim bộ',
      subtitle: 'Binge-watch nhiều tập liên tục',
      movies: phimBo ?? [],
      filterParams: { type: MOVIE_TYPE_LIST.PHIM_BO },
    },
    {
      key: 'single',
      title: 'Phim lẻ',
      subtitle: 'Chọn nhanh cho một buổi tối gọn',
      movies: phimLe ?? [],
      filterParams: { type: MOVIE_TYPE_LIST.PHIM_LE },
    },
    {
      key: 'anime',
      title: 'Hoạt hình',
      subtitle: 'Anime, family và thế giới tưởng tượng',
      movies: hoatHinh ?? [],
      filterParams: { type: MOVIE_TYPE_LIST.HOAT_HINH },
    },
    {
      key: 'tvshows',
      title: 'TV Shows',
      subtitle: 'Gameshow và series giải trí',
      movies: tvShows ?? [],
      filterParams: { type: MOVIE_TYPE_LIST.TV_SHOWS },
    },
  ].filter(section => section.movies.length > 0), [
    hoatHinh,
    latestSectionMovies,
    phimBo,
    phimLe,
    phimVietNam,
    tvShows,
  ]);

  const quickActions = useMemo<QuickActionItem[]>(() => [
    {
      key: 'search',
      title: 'Tìm kiếm',
      caption: 'Gõ tên phim, diễn viên hoặc từ khóa',
      icon: 'SearchLight',
      target: 'Search',
    },
    {
      key: 'series',
      title: 'Phim bộ',
      caption: 'Lướt danh sách nhiều tập để cày liền mạch',
      icon: 'AppsLight',
      filterParams: { type: MOVIE_TYPE_LIST.PHIM_BO },
    },
    {
      key: 'single',
      title: 'Phim lẻ',
      caption: 'Phù hợp khi muốn chọn nhanh một bộ để xem',
      icon: 'RocketLight',
      filterParams: { type: MOVIE_TYPE_LIST.PHIM_LE },
    },
    {
      key: 'vietnam',
      title: 'Việt Nam',
      caption: 'Tập trung các tựa nội địa đang có trên app',
      icon: 'GlobeLight',
      filterParams: { country: VIETNAM_COUNTRY_SLUG },
    },
  ], []);

  const prefetchUrls = useMemo(() => {
    const urls: (string | null | undefined)[] = [];

    heroMovies.forEach(movie => {
      urls.push(movie.thumb_url ?? movie.poster_url);
      urls.push(movie.poster_url ?? movie.thumb_url);
    });

    sections.forEach(section => {
      section.movies.slice(0, SECTION_PREFETCH_COUNT).forEach(movie => {
        urls.push(movie.poster_url ?? movie.thumb_url);
      });
    });

    return urls;
  }, [heroMovies, sections]);

  useEffect(() => {
    if (prefetchUrls.length > 0) {
      prefetchImages(prefetchUrls, IMAGE_PREFETCH_LIMITS.homeHero);
    }
  }, [prefetchUrls]);

  const handleMoviePress = useCallback((movie: KKMovie) => {
    navigation.navigate('MovieDetail', { slug: movie.slug });
  }, [navigation]);

  const handleSearchPress = useCallback(() => {
    navigation.navigate('RootTabs', { screen: 'Search' });
  }, [navigation]);

  const handleProfilePress = useCallback(() => {
    navigation.navigate('RootTabs', { screen: 'Profile' });
  }, [navigation]);

  const handleSeeAll = useCallback((params: FilterParams) => {
    navigation.navigate('RootTabs', {
      screen: 'Filter',
      params: {
        ...params,
        requestId: Date.now(),
      },
    });
  }, [navigation]);

  const handleQuickActionPress = useCallback((item: QuickActionItem) => {
    if (item.target === 'Search') {
      handleSearchPress();
      return;
    }

    if (item.filterParams) {
      handleSeeAll(item.filterParams);
    }
  }, [handleSearchPress, handleSeeAll]);

  const renderQuickAction = useCallback(({ item }: { item: QuickActionItem }) => (
    <QuickActionCard item={item} onPress={handleQuickActionPress} />
  ), [handleQuickActionPress]);

  const handleContinueWatchingPress = useCallback((item: ContinueWatchingEntry) => {
    navigation.navigate('Watch', {
      slug: item.slug,
      episodeSlug: item.episodeSlug,
      initialProgressSeconds: item.progressSeconds > 0 ? item.progressSeconds : 0,
    });
  }, [navigation]);

  const handleDeleteContinueWatching = useCallback((item: ContinueWatchingEntry) => {
    if (!item.isRemote) {
      return;
    }

    Alert.alert(
      'Xóa khỏi lịch sử xem',
      'Bạn có chắc muốn xóa phim này khỏi lịch sử xem?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            deleteHistory.mutate(item.slug, {
              onError: error => {
                Alert.alert(
                  'Không thể xóa lịch sử xem',
                  getUserHistoryErrorMessage(error) || 'Vui lòng thử lại.',
                );
              },
            });
          },
        },
      ],
    );
  }, [deleteHistory]);

  const renderContinueWatching = useCallback(({ item }: { item: ContinueWatchingEntry }) => (
    <ContinueWatchingCard
      isDeleting={deleteHistory.isLoading && deleteHistory.variables === item.slug}
      item={item}
      onDelete={handleDeleteContinueWatching}
      onPress={handleContinueWatchingPress}
    />
  ), [deleteHistory.isLoading, deleteHistory.variables, handleContinueWatchingPress, handleDeleteContinueWatching]);

  const renderSection = useCallback(({ item }: { item: HomeSection }) => (
    <SectionRow
      item={item}
      onMoviePress={handleMoviePress}
      onSeeAll={handleSeeAll}
    />
  ), [handleMoviePress, handleSeeAll]);

  const listHeader = useMemo(() => (
    <View>
      <HeroBanner
        movies={heroMovies}
        onMoviePress={handleMoviePress}
        onProfilePress={handleProfilePress}
        onSearchPress={handleSearchPress}
        topInset={insets.top}
      />

      <View style={styles.discoveryBlock}>
        <View style={styles.discoveryHeader}>
          <Text style={styles.discoveryEyebrow}>Lối tắt khám phá</Text>
          <Text style={styles.discoveryTitle}>Đi vào nội dung bạn muốn nhanh hơn</Text>
        </View>

        <FlatList
          data={quickActions}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={item => item.key}
          renderItem={renderQuickAction}
          ItemSeparatorComponent={HORIZONTAL_SEPARATOR}
          contentContainerStyle={styles.quickActionList}
        />
      </View>

      {continueWatchingItems.length > 0 && (
        <View style={styles.continueBlock}>
          <View style={styles.discoveryHeader}>
            <Text style={styles.discoveryEyebrow}>Tiếp tục xem</Text>
          </View>

          <FlatList
            data={continueWatchingItems}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={item => item.key}
            renderItem={renderContinueWatching}
            ItemSeparatorComponent={HORIZONTAL_SEPARATOR}
            contentContainerStyle={styles.quickActionList}
          />
        </View>
      )}
    </View>
  ), [
    continueWatchingItems,
    handleMoviePress,
    handleProfilePress,
    handleSearchPress,
    heroMovies,
    insets.top,
    quickActions,
    renderContinueWatching,
    renderQuickAction,
  ]);

  if (isInitialLoading) {
    return (
      <View style={styles.container}>
        <HomeScreenSkeleton topInset={140} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={sections}
        keyExtractor={item => item.key}
        renderItem={renderSection}
        ListHeaderComponent={listHeader}
        ItemSeparatorComponent={SECTION_SEPARATOR}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={(
          <RefreshControl
            refreshing={isFetching && !latestLoading}
            onRefresh={refetch}
            tintColor={Colors.primary}
          />
        )}
        removeClippedSubviews
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        windowSize={5}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    paddingBottom: 120,
  },
  discoveryBlock: {
    marginTop: -Spacing.sm,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.sm,
  },
  continueBlock: {
    paddingBottom: Spacing.sm,
  },
  discoveryHeader: {
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.base,
  },
  discoveryEyebrow: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  discoveryTitle: {
    marginTop: Spacing.xs,
    color: Colors.white,
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
  },
  quickActionList: {
    paddingHorizontal: Spacing.base,
  },
  quickActionCard: {
    width: 164,
    minHeight: 120,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.backgroundElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.base,
  },
  quickActionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.base,
  },
  quickActionTitle: {
    color: Colors.white,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
  },
  quickActionCaption: {
    marginTop: Spacing.xs,
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
    lineHeight: 18,
  },
  sectionBlock: {
    paddingTop: Spacing.sm,
  },
  sectionHeader: {
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.base,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  sectionHeaderContent: {
    flex: 1,
    paddingRight: Spacing.base,
  },
  sectionEyebrow: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: Spacing.xs,
  },
  sectionTitle: {
    color: Colors.white,
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.extrabold,
  },
  sectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countBadge: {
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.backgroundElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
  },
  countBadgeText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  seeAllButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingRight: 0,
  },
  seeAllText: {
    color: Colors.primary,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
  },
  horizontalListContent: {
    paddingHorizontal: Spacing.base,
  },
  horizontalSeparator: {
    width: Spacing.sm,
  },
  sectionSeparator: {
    height: Spacing.lg,
  },
});
