/* eslint-disable react-native/no-inline-styles */
import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList, MainTabParamList } from '@/navigation/types';
import type { KKMovie } from '@/types';
import { Colors, Typography, Spacing, BorderRadius, Screen } from '@/config/theme';
import { SvgIcons } from '@/assets/svg-component';
import { useSearchMovies } from '../hooks/useSearchMovies';
import MovieGrid from '@/components/movie/MovieGrid';
import MovieGridSkeleton from '@/components/movie/MovieGridSkeleton';
import { Icon, PressableIconSvg } from '@/components/common';
import { muiColor } from '@/themes';

type Route = RouteProp<MainTabParamList, 'Search'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function SearchScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const [keyword, setKeyword] = useState(route.params?.keyword ?? '');

  React.useEffect(() => {
    const nextKeyword = route.params?.keyword ?? '';
    setKeyword(prevKeyword => (prevKeyword === nextKeyword ? prevKeyword : nextKeyword));
  }, [route.params?.keyword]);

  useFocusEffect(
    useCallback(() => {
      const focusFrame = requestAnimationFrame(() => {
        inputRef.current?.focus();
      });

      return () => {
        cancelAnimationFrame(focusFrame);
      };
    }, []),
  );

  const {
    data: movies,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetching,
    isFetchingNextPage,
  } = useSearchMovies(keyword);
  const normalizedKeyword = keyword.trim();
  const isSearchReady = normalizedKeyword.length >= 2;
  const searchResults = useMemo(() => (isSearchReady ? (movies ?? []) : []), [isSearchReady, movies]);

  const handleMoviePress = useCallback((movie: KKMovie) => {
    Keyboard.dismiss();
    navigation.navigate('MovieDetail', { slug: movie.slug });
  }, [navigation]);

  const handleBackPress = useCallback(() => {
    Keyboard.dismiss();
    inputRef.current?.blur();

    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate('RootTabs', { screen: 'Home' });
  }, [navigation]);

  const handleGridScrollBegin = useCallback(() => {
    Keyboard.dismiss();
    inputRef.current?.blur();
  }, []);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const isSearching = isSearchReady && isLoading;
  const hasResults = isSearchReady && searchResults.length > 0;
  const noResults = isSearchReady && !isSearching && !hasResults;
  const showPlaceholder = normalizedKeyword.length === 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Search bar */}
      <View style={styles.searchHeader}>
        <PressableIconSvg icon='CaretLeft' sizeButton={16} onPress={handleBackPress} color={muiColor.grey[0]} />
        <View style={styles.searchBar}>
          <Icon icon='SearchLight' color={muiColor.grey[0]} size={14} containerStyle={{ marginRight: 4 }} />
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Tìm phim, series, diễn viên..."
            placeholderTextColor={Colors.textMuted}
            value={keyword}
            onChangeText={setKeyword}
            returnKeyType="search"
            clearButtonMode="while-editing"
            autoCorrect={false}
            autoCapitalize="none"
            autoFocus
          />
          {keyword.length > 0 && (
            <TouchableOpacity onPress={() => setKeyword('')} style={styles.clearBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <SvgIcons.CrossSmallLight width={20} height={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isSearching && (
        <MovieGridSkeleton rows={4} />
      )}

      {noResults && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🎬</Text>
          <Text style={styles.emptyTitle}>Không tìm thấy kết quả</Text>
          <Text style={styles.emptySubtitle}>Thử từ khóa khác nhé</Text>
        </View>
      )}

      {showPlaceholder && (
        <View style={styles.emptyState}>
          <Icon icon='SearchLight' color={muiColor.grey[0]} containerStyle={{marginBottom: 24}} size={30} />
          <Text style={styles.emptyTitle}>Tìm kiếm phim</Text>
          <Text style={styles.emptySubtitle}>Nhập tên phim, diễn viên, thể loại...</Text>
        </View>
      )}

      {hasResults && (
        <MovieGrid
          movies={searchResults}
          onMoviePress={handleMoviePress}
          onScrollBeginDrag={handleGridScrollBegin}
          onEndReached={handleLoadMore}
          isLoadingMore={isFetchingNextPage || (isFetching && searchResults.length > 0)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  searchHeader:{
    flexDirection:'row',
    alignItems:'center',
    gap: 12,
    paddingHorizontal: Spacing.base,
  },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.md,
    width: Screen.width - 56,
    paddingHorizontal: Spacing.md,
  },
  backBtn: {
    paddingRight: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  searchIcon: { fontSize: 16, marginRight: Spacing.sm },
  input: {
    flex: 1, height: 44,
    color: Colors.text, fontSize: Typography.fontSize.base,
  },
  clearBtn: { padding: Spacing.sm },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing['2xl'] },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing.lg },
  emptyTitle: { color: Colors.text, fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, marginBottom: Spacing.sm },
  emptySubtitle: { color: Colors.textMuted, fontSize: Typography.fontSize.sm, textAlign: 'center' },
});
