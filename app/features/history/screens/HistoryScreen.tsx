import dayjs from 'dayjs';
import React, { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgIcons } from '@/assets/svg-component';
import ResumeMovieCard, { type ResumeMovieCardItem } from '@/components/movie/ResumeMovieCard';
import {
  BorderRadius,
  Colors,
  Spacing,
  Typography,
} from '@/config/theme';
import { useAuthStore } from '@/features/auth/store/authStore';
import {
  useDeleteUserHistory,
  useUserHistory,
} from '@/features/history/hooks/useUserHistory';
import { getUserHistoryErrorMessage } from '@/features/history/services/userHistoryService';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const PAGE = 1;
const LIMIT = 20;
const NUM_COLUMNS = 2;
const GRID_GAP = Spacing.sm;
const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_CARD_WIDTH = (SCREEN_WIDTH - Spacing.base * 2 - GRID_GAP) / NUM_COLUMNS;
const GRID_CARD_HEIGHT = GRID_CARD_WIDTH * 1.5;
const GRID_SEPARATOR = () => <View style={styles.separator} />;

interface HistoryGridItem extends ResumeMovieCardItem {
  episodeSlug?: string | null;
  key: string;
  movieSlug: string;
}

export default function HistoryScreen() {
  const navigation = useNavigation() as unknown as Nav;
  const insets = useSafeAreaInsets();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const deleteHistory = useDeleteUserHistory();
  const {
    data,
    isFetching,
    isLoading,
    isError,
    refetch,
  } = useUserHistory(PAGE, LIMIT);

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        refetch();
      }
    }, [isAuthenticated, refetch]),
  );

  const items = useMemo(() => data?.items ?? [], [data?.items]);
  const historyGridItems = useMemo<HistoryGridItem[]>(() => items.map(item => ({
    key: `${item.movieSlug}:${item.episodeSlug ?? 'default'}`,
    movieSlug: item.movieSlug,
    episodeSlug: item.episodeSlug,
    movie: {
      name: item.movie.name,
      slug: item.movieSlug,
      poster_url: item.movie.posterUrl,
      thumb_url: item.movie.thumbUrl,
      year: item.movie.year,
      type: item.movie.type,
    },
    subtitle: [
      item.movie.year ? String(item.movie.year) : null,
      item.movie.type ?? null,
    ].filter((part): part is string => Boolean(part)).join(' • '),
    episodeLabel: item.episodeSlug ? `Đang xem ${item.episodeSlug}` : 'Bản đầy đủ',
    progressPercent: 40,
    progressSeconds: item.progressSeconds,
    footerLabel: item.watchedAt
      ? dayjs(item.watchedAt).format('DD/MM/YYYY HH:mm')
      : 'Không rõ thời gian',
  })), [items]);

  const handleOpenLogin = useCallback(() => {
    navigation.navigate('Login');
  }, [navigation]);

  const handleGoBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate('RootTabs', { screen: 'Profile' });
  }, [navigation]);

  const handlePressItem = useCallback((item: HistoryGridItem) => {
    navigation.navigate('Watch', {
      slug: item.movieSlug,
      episodeSlug: item.episodeSlug ?? undefined,
      initialProgressSeconds: item.progressSeconds > 0 ? item.progressSeconds : 0,
    });
  }, [navigation]);

  const handleDeleteItem = useCallback((item: HistoryGridItem) => {
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
            deleteHistory.mutate(item.movieSlug, {
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

  const renderItem = useCallback(({ item, index }: { item: HistoryGridItem; index: number }) => {
    const isDeleting = deleteHistory.isPending && deleteHistory.variables === item.movieSlug;

    return (
      <View style={[styles.gridItem, index % NUM_COLUMNS !== 0 && styles.gridItemOffset]}>
        <ResumeMovieCard
          actionDisabled={isDeleting}
          actionIcon="TrashLight"
          actionLabel="Xóa phim này khỏi lịch sử xem"
          actionLoading={isDeleting}
          item={item}
          width={GRID_CARD_WIDTH}
          height={GRID_CARD_HEIGHT}
          onActionPress={() => handleDeleteItem(item)}
          onPress={() => handlePressItem(item)}
        />
      </View>
    );
  }, [deleteHistory.isPending, deleteHistory.variables, handleDeleteItem, handlePressItem]);

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity activeOpacity={0.8} onPress={handleGoBack} style={styles.backButton}>
            <SvgIcons.CaretLeft color={Colors.white} height={22} width={22} />
          </TouchableOpacity>
          <Text style={styles.title}>Lịch sử xem</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🕘</Text>
          <Text style={styles.emptyTitle}>Đăng nhập để đồng bộ lịch sử xem</Text>
          <Text style={styles.emptySubtitle}>
            Khi có tài khoản, tiến độ xem sẽ được lưu lên server và mở lại trên thiết bị khác.
          </Text>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleOpenLogin}
            style={styles.loginButton}
          >
            <Text style={styles.loginButtonText}>Đăng nhập</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (isLoading && !data) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator color={Colors.primary} size="large" />
        <Text style={styles.loadingText}>Đang tải lịch sử xem...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity activeOpacity={0.8} onPress={handleGoBack} style={styles.backButton}>
            <SvgIcons.CaretLeft color={Colors.white} height={22} width={22} />
          </TouchableOpacity>
          <Text style={styles.title}>Lịch sử xem</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>⚠️</Text>
          <Text style={styles.emptyTitle}>Không tải được lịch sử xem</Text>
          <Text style={styles.emptySubtitle}>
            Kết nối mạng hoặc phiên đăng nhập có thể đang gặp vấn đề.
          </Text>
          <TouchableOpacity activeOpacity={0.9} onPress={() => refetch()} style={styles.loginButton}>
            <Text style={styles.loginButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.8} onPress={handleGoBack} style={styles.backButton}>
          <SvgIcons.CaretLeft color={Colors.white} height={22} width={22} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.title}>Lịch sử xem</Text>
        </View>
        <Text style={styles.countText}>{items.length} mục</Text>
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📺</Text>
          <Text style={styles.emptyTitle}>Chưa có lịch sử xem</Text>
          <Text style={styles.emptySubtitle}>
            Khi bạn xem phim bằng tài khoản hiện tại, lịch sử sẽ xuất hiện ở đây.
          </Text>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.listContent}
          data={historyGridItems}
          keyExtractor={item => item.key}
          numColumns={NUM_COLUMNS}
          columnWrapperStyle={styles.gridRow}
          renderItem={renderItem}
          refreshControl={(
            <RefreshControl
              refreshing={isFetching}
              onRefresh={() => refetch()}
              tintColor={Colors.primary}
            />
          )}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={GRID_SEPARATOR}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    flex: 1,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  backButton: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  headerTitleWrap: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  headerSpacer: {
    width: 36,
    height: 36,
  },
  title: {
    color: Colors.text,
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
  },
  countText: {
    color: Colors.textMuted,
    fontSize: Typography.fontSize.sm,
  },
  listContent: {
    paddingBottom: 120,
    paddingHorizontal: Spacing.base,
  },
  gridRow: {
    gap: GRID_GAP,
  },
  gridItem: {
    flex: 1 / NUM_COLUMNS,
  },
  gridItemOffset: {
    marginLeft: GRID_GAP,
  },
  separator: {
    height: GRID_GAP,
  },
  emptyState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
  },
  emptyEmoji: {
    fontSize: 52,
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: Colors.textMuted,
    fontSize: Typography.fontSize.sm,
    lineHeight: 22,
    textAlign: 'center',
  },
  loginButton: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    marginTop: Spacing.lg,
    minHeight: 48,
    paddingHorizontal: Spacing.xl,
  },
  loginButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
    marginTop: Spacing.md,
  },
});
