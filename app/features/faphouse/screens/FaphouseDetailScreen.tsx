import React, { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgIcons } from '@/assets/svg-component';
import { CachedImage } from '@/components/common';
import { BorderRadius, Colors, Spacing, Typography } from '@/config/theme';
import type { RootStackParamList } from '@/navigation/types';
import { formatTime } from '@/utils/formatTime';
import { getPosterSource, getThumbSource } from '@/utils/image';
import { useFaphouseMovieDetail } from '../hooks/useFaphouse';

type Route = RouteProp<RootStackParamList, 'FaphouseDetail'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function FaphouseDetailScreen() {
  const navigation = useNavigation() as unknown as Nav;
  const route = useRoute() as unknown as Route;
  const insets = useSafeAreaInsets();
  const slug = route.params?.slug ?? '';

  const { data: movie, isLoading, isError, refetch } = useFaphouseMovieDetail(slug);

  const handleBack = useCallback(() => navigation.goBack(), [navigation]);

  const handleWatch = useCallback(() => {
    navigation.navigate('Watch', { slug, source: 'faphouse' });
  }, [navigation, slug]);

  const mediaUrl = movie?.media?.url;

  const handleOpenMediaUrl = useCallback(() => {
    if (!mediaUrl) {
      return;
    }
    Linking.openURL(mediaUrl).catch(() => {
      Alert.alert('Không thể mở liên kết', 'Vui lòng thử lại sau.');
    });
  }, [mediaUrl]);

  const metaItems = useMemo(() => {
    if (!movie) {
      return [];
    }
    return [
      movie.releaseYear ? String(movie.releaseYear) : null,
      movie.duration ? formatTime(movie.duration) : null,
      movie.country?.name ?? null,
    ].filter((item): item is string => Boolean(item));
  }, [movie]);

  const backButton = (
    <TouchableOpacity
      style={[styles.backButton, { top: insets.top + Spacing.sm }]}
      onPress={handleBack}
    >
      <SvgIcons.CaretLeft width={28} height={28} color={Colors.white} />
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
        {backButton}
      </View>
    );
  }

  if (isError || !movie) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Không tải được thông tin phim</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryText}>Thử lại</Text>
        </TouchableOpacity>
        {backButton}
      </View>
    );
  }

  const canWatch = Boolean(movie.media?.url);

  return (
    <View style={styles.container}>
      {backButton}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.backdrop}>
          <CachedImage
            source={getThumbSource(movie.backdropUrl ?? movie.posterUrl)}
            style={styles.backdropImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', Colors.background]}
            style={styles.backdropGradient}
          />
        </View>

        <View style={styles.infoRow}>
          <CachedImage
            source={getPosterSource(movie.posterUrl ?? movie.backdropUrl)}
            style={styles.poster}
            resizeMode="cover"
          />
          <View style={styles.infoColumn}>
            <Text style={styles.title} numberOfLines={4}>{movie.title}</Text>
            {metaItems.length > 0 && (
              <Text style={styles.meta}>{metaItems.join(' • ')}</Text>
            )}
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.watchButton, !canWatch && styles.watchButtonDisabled]}
            onPress={handleWatch}
            disabled={!canWatch}
            activeOpacity={0.85}
          >
            <SvgIcons.Play width={18} height={18} color={Colors.white} />
            <Text style={styles.watchButtonText}>{canWatch ? 'Xem phim' : 'Chưa có nguồn phát'}</Text>
          </TouchableOpacity>
        </View>

        {!!mediaUrl && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Đường dẫn phim</Text>
            <TouchableOpacity onPress={handleOpenMediaUrl} activeOpacity={0.7}>
              <Text style={styles.link} selectable>{mediaUrl}</Text>
            </TouchableOpacity>
          </View>
        )}

        {movie.genres.length > 0 && (
          <View style={styles.tagRow}>
            {movie.genres.map(genre => (
              <View key={genre.id} style={styles.tag}>
                <Text style={styles.tagText}>{genre.name}</Text>
              </View>
            ))}
          </View>
        )}

        {movie.actors.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Diễn viên</Text>
            <View style={styles.tagRow}>
              {movie.actors.map(actor => (
                <View key={actor.id} style={styles.tag}>
                  <Text style={styles.tagText}>{actor.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {!!movie.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nội dung phim</Text>
            <Text style={styles.description}>{movie.description}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 60 },
  center: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: { color: Colors.textSecondary, fontSize: Typography.fontSize.base },
  retryButton: {
    marginTop: Spacing.md,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  retryText: { color: Colors.white, fontWeight: Typography.fontWeight.bold },
  backButton: {
    position: 'absolute',
    left: Spacing.base,
    zIndex: 100,
    padding: Spacing.sm,
  },
  backdrop: { height: 240 },
  backdropImage: { ...StyleSheet.absoluteFill },
  backdropGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 120,
  },
  infoRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    marginTop: -Spacing['3xl'],
  },
  poster: {
    width: 100,
    height: 150,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.backgroundElevated,
  },
  infoColumn: {
    flex: 1,
    marginLeft: Spacing.md,
    justifyContent: 'flex-end',
  },
  title: {
    color: Colors.text,
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
  },
  meta: {
    marginTop: Spacing.sm,
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
  },
  actionRow: {
    paddingHorizontal: Spacing.base,
    marginTop: Spacing.lg,
  },
  watchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
  },
  watchButtonDisabled: { backgroundColor: Colors.textDisabled },
  watchButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
    marginTop: Spacing.base,
  },
  tag: {
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
  },
  tagText: { color: Colors.textSecondary, fontSize: Typography.fontSize.sm },
  section: { marginTop: Spacing.lg },
  sectionTitle: {
    paddingHorizontal: Spacing.base,
    color: Colors.text,
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
  },
  link: {
    paddingHorizontal: Spacing.base,
    marginTop: Spacing.sm,
    color: Colors.info,
    fontSize: Typography.fontSize.sm,
    lineHeight: 18,
    textDecorationLine: 'underline',
  },
  description: {
    paddingHorizontal: Spacing.base,
    marginTop: Spacing.sm,
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.md,
    lineHeight: 22,
  },
});
