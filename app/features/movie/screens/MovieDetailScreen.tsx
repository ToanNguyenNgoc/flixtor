/* eslint-disable react-native/no-inline-styles */
import React, { useCallback, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, LayoutAnimation, Linking, Platform, UIManager
} from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}
import { CachedImage } from '@/components/common';
import { IMAGE_PREFETCH_LIMITS, prefetchImages } from '@/utils/imageCache';
import LinearGradient from 'react-native-linear-gradient';
import RenderHtml from 'react-native-render-html';
import YoutubePlayer, { PLAYER_STATES } from 'react-native-youtube-iframe';
import { useWindowDimensions } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import type { KKEpisode, FavoriteMovie } from '@/types';
import { Colors, Typography, Spacing, BorderRadius } from '@/config/theme';
import { useMovieDetail } from '../hooks/useMovieDetail';
import { useFavoriteStore } from '@/features/favorites/store/favoriteStore';
import { SvgIcons } from '@/assets/svg-component';
import { getAllEpisodes } from '@/utils/episode';
import { getPosterSource, getThumbSource } from '@/utils/image';
import { Icon } from '@/components/common';
import { muiColor } from '@/themes';

type Route = RouteProp<RootStackParamList, 'MovieDetail'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

function extractYoutubeVideoId(url?: string): string | null {
  if (!url) {
    return null;
  }

  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.replace('www.', '');

    if (hostname === 'youtu.be') {
      return parsedUrl.pathname.slice(1) || null;
    }

    if (hostname === 'youtube.com' || hostname === 'm.youtube.com') {
      if (parsedUrl.pathname === '/watch') {
        return parsedUrl.searchParams.get('v');
      }

      if (parsedUrl.pathname.startsWith('/embed/')) {
        return parsedUrl.pathname.split('/embed/')[1] || null;
      }

      if (parsedUrl.pathname.startsWith('/shorts/')) {
        return parsedUrl.pathname.split('/shorts/')[1] || null;
      }
    }
  } catch {
    const match = url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
    return match?.[1] ?? null;
  }

  return null;
}

function hasPlayableSource(episode?: KKEpisode): boolean {
  return Boolean(
    episode?.link_m3u8?.trim()
    || episode?.link_embed?.trim(),
  );
}

function getNextPlayableEpisode(
  allEpisodes: KKEpisode[],
  initialEpisode?: KKEpisode,
): KKEpisode | undefined {
  if (hasPlayableSource(initialEpisode)) {
    return initialEpisode;
  }

  const initialIndex = initialEpisode
    ? allEpisodes.indexOf(initialEpisode)
    : -1;
  const remainingEpisodes = allEpisodes.slice(initialIndex + 1);

  if (initialEpisode?.slug) {
    const sameEpisodeFromAnotherServer = remainingEpisodes.find(episode => (
      episode.slug === initialEpisode.slug && hasPlayableSource(episode)
    ));

    if (sameEpisodeFromAnotherServer) {
      return sameEpisodeFromAnotherServer;
    }
  }

  return remainingEpisodes.find(hasPlayableSource);
}

export default function MovieDetailScreen() {
  const navigation = useNavigation() as unknown as Nav;
  const route = useRoute() as unknown as Route;
  const { slug } = route.params;
  const { width } = useWindowDimensions();

  const { data, isLoading, isError, refetch } = useMovieDetail(slug);
  const { isFavorite, toggleFavorite } = useFavoriteStore();

  const movie = data?.movie;
  const allEpisodes = useMemo<KKEpisode[]>(
    () => getAllEpisodes(Array.isArray(data?.episodes) ? data.episodes : []),
    [data?.episodes],
  );
  const isFav = isFavorite(slug);
  const trailerVideoId = useMemo(
    () => extractYoutubeVideoId(movie?.trailer_url),
    [movie?.trailer_url]
  );
  const backdropSource = useMemo(
    () => getThumbSource(movie?.thumb_url ?? movie?.poster_url),
    [movie?.poster_url, movie?.thumb_url]
  );
  const posterSource = useMemo(
    () => getPosterSource(movie?.poster_url),
    [movie?.poster_url]
  );
  const actorNames = useMemo(
    () => (movie?.actor ?? [])
      .map(actor => actor.trim())
      .filter((actor): actor is string => actor.length > 0),
    [movie?.actor]
  );
  const trailerWidth = width - Spacing.base * 2;
  const trailerHeight = Math.floor(trailerWidth * 9 / 16);

  const episodeChunks = chunkArray(allEpisodes, 50);
  const [expandedChunk, setExpandedChunk] = useState<number>(0);
  const [isTrailerPlaying, setIsTrailerPlaying] = useState(false);

  const toggleChunk = useCallback((index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedChunk(prev => (prev === index ? -1 : index));
  }, []);

  const NUM_COLUMNS = 4;
  const accordionItemWidth = Math.floor((width - Spacing.base * 2 - Spacing.md * 2 - Spacing.sm * (NUM_COLUMNS - 1)) / NUM_COLUMNS);
  const gridItemWidth = Math.floor((width - Spacing.base * 2 - Spacing.sm * (NUM_COLUMNS - 1)) / NUM_COLUMNS);

  React.useEffect(() => {
    if (movie) {
      prefetchImages([movie.poster_url, movie.thumb_url], IMAGE_PREFETCH_LIMITS.movieDetail);
    }
  }, [movie]);

  React.useEffect(() => {
    setIsTrailerPlaying(false);
  }, [slug, movie?.trailer_url]);

  const handleFavorite = useCallback(() => {
    if (!movie) return;
    const favMovie: FavoriteMovie = {
      slug: movie.slug,
      name: movie.name,
      origin_name: movie.origin_name,
      poster_url: movie.poster_url,
      thumb_url: movie.thumb_url,
      year: movie.year,
      episode_current: movie.episode_current,
      quality: movie.quality,
      lang: movie.lang,
      updatedAt: Date.now(),
    };
    toggleFavorite(favMovie);
  }, [movie, toggleFavorite]);

  const handleWatch = useCallback((ep?: KKEpisode) => {
    const isInitialEpisode = ep === undefined || ep === allEpisodes[0];
    const episodeToWatch = isInitialEpisode
      ? getNextPlayableEpisode(allEpisodes, ep)
      : ep;

    if (!episodeToWatch || !hasPlayableSource(episodeToWatch)) {
      Alert.alert(
        'Chưa có nguồn phát',
        'Tập phim này chưa có nguồn video. Vui lòng thử tập khác.',
      );
      return;
    }

    navigation.navigate('Watch', {
      slug,
      episodeSlug: episodeToWatch.slug,
      serverName: episodeToWatch.server_name,
    });
  }, [allEpisodes, navigation, slug]);

  const handleOpenTrailerExternal = useCallback(() => {
    if (movie?.trailer_url) {
      Linking.openURL(movie.trailer_url).catch(() => {});
    }
  }, [movie?.trailer_url]);

  const handleActorPress = useCallback((actorName: string) => {
    const keyword = actorName.trim();

    if (!keyword) {
      return;
    }

    navigation.navigate('RootTabs', {
      screen: 'Search',
      params: { keyword },
    });
  }, [navigation]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  if (isError || !movie) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>⚠️ Không tải được thông tin phim</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
          <Text style={styles.retryText}>Thử lại</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backBtn2} onPress={() => navigation.goBack()}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <SvgIcons.CaretLeft width={20} height={20} color={Colors.primary} />
            <Text style={styles.backText2}>Quay lại</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  const contentSource = { html: movie.content ?? '' };
  const tagsStyles = {
    body: { color: Colors.textSecondary, fontSize: 14, lineHeight: 22 } as const,
    p: { marginBottom: 8 } as const,
  };

  return (
    <View style={styles.container}>
      {/* Back button */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <SvgIcons.CaretLeft width={28} height={28} color={Colors.white} />
      </TouchableOpacity>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Backdrop */}
        <View style={styles.backdrop}>
          <CachedImage
            source={backdropSource}
            style={styles.backdropImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', Colors.background]}
            style={styles.backdropGradient}
          />
        </View>

        {/* Poster + Info */}
        <View style={styles.infoRow}>
          <CachedImage
            source={posterSource}
            style={styles.poster}
            resizeMode="cover"
          />
          <View style={styles.infoCol}>
            <Text style={styles.title}>{movie.name}</Text>
            {!!movie.origin_name && (
              <Text style={styles.originName}>{movie.origin_name}</Text>
            )}
            <View style={styles.metaRow}>
              {!!movie.year && <Text style={styles.meta}>{movie.year}</Text>}
              {!!movie.quality && (
                <View style={styles.qualityBadge}>
                  <Text style={styles.qualityText}>{movie.quality.toUpperCase()}</Text>
                </View>
              )}
              {!!movie.lang && <Text style={styles.meta}>{movie.lang}</Text>}
            </View>
            <View style={styles.metaCnt}>
              {!!movie.time && <Text style={styles.meta}>⏱ {movie.time}</Text>}
              {!!movie.episode_current && (
                <Text style={styles.meta}>📺 {movie.episode_current}</Text>
              )}
              {!!movie.status && <Text style={styles.meta}>📌 {movie.status}</Text>}
            </View>
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.watchBtn} onPress={() => handleWatch(allEpisodes[0])}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <SvgIcons.Play width={20} height={20} color={Colors.white} />
              <Text style={styles.watchBtnText}>Xem phim</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.favBtn, isFav && styles.favBtnActive]} onPress={handleFavorite}>
              <Icon icon='HeartBold' color={!isFav ? muiColor.grey[0] : Colors.primary} size={20} />
          </TouchableOpacity>
        </View>

        {/* Categories */}
        {(movie.category?.length ?? 0) > 0 && (
          <View style={styles.tagRow}>
            {movie.category!.map(cat => (
              <View key={cat.slug} style={styles.tag}>
                <Text style={styles.tagText}>{cat.name}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Country */}
        <View style={styles.metaLineCnt}>
          {(movie.country?.length ?? 0) > 0 && (
            <Text style={styles.metaLine}>
              🌏 {movie.country!.map(c => c.name).join(', ')}
            </Text>
          )}

          {/* Director */}
          {(movie.director?.length ?? 0) > 0 && (
            <Text style={styles.metaLine}>
              🎬 Đạo diễn: {movie.director!.join(', ')}
            </Text>
          )}

          {/* Actors */}
          {actorNames.length > 0 && (
            <View style={styles.actorSection}>
              <Text style={styles.metaLine}>🎭 Diễn viên:</Text>
              <View style={styles.actorList}>
                {actorNames.map((actor, index) => (
                  <TouchableOpacity
                    key={`${actor}-${index}`}
                    style={styles.actorChip}
                    activeOpacity={0.75}
                    onPress={() => handleActorPress(actor)}
                  >
                    <Text style={styles.actorChipText}>{actor}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Content HTML */}
        {!!movie.trailer_url && (
          <View style={styles.trailerBlock}>
            <View style={styles.trailerHeader}>
              <Text style={styles.sectionTitle}>Trailer</Text>
            </View>

            {trailerVideoId ? (
              <View style={styles.trailerPlayerWrap}>
                <YoutubePlayer
                  height={trailerHeight}
                  width={trailerWidth}
                  play={isTrailerPlaying}
                  videoId={trailerVideoId}
                  onChangeState={(state: string) => {
                    if (state === PLAYER_STATES.ENDED || state === PLAYER_STATES.PAUSED) {
                      setIsTrailerPlaying(false);
                    }
                    if (state === PLAYER_STATES.PLAYING) {
                      setIsTrailerPlaying(true);
                    }
                  }}
                />
              </View>
            ) : (
              <TouchableOpacity
                style={styles.trailerCard}
                activeOpacity={0.82}
                onPress={handleOpenTrailerExternal}
              >
                <View style={styles.trailerPlayIcon}>
                  <SvgIcons.Play width={18} height={18} color={Colors.white} />
                </View>
                <View style={styles.trailerTextWrap}>
                  <Text style={styles.trailerTitle}>Xem trailer chính thức</Text>
                  <Text style={styles.trailerSubtitle} numberOfLines={1}>
                    {trailerVideoId ? 'Phát ngay trong ứng dụng' : 'Mở liên kết trailer'}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        )}

        {!!movie.content && (
          <View style={styles.contentBlock}>
            <Text style={styles.sectionTitle}>Nội dung phim</Text>
            <RenderHtml
              contentWidth={width - Spacing.base * 2}
              source={contentSource}
              tagsStyles={tagsStyles}
              baseStyle={{ color: Colors.textSecondary }}
            />
          </View>
        )}

        {/* Episode list */}
        {allEpisodes.length > 0 && (
          <View style={styles.episodesBlock}>
            <Text style={[styles.sectionTitle, { paddingHorizontal: Spacing.base }]}>
              Danh sách tập ({allEpisodes.length})
            </Text>
            
            {episodeChunks.length > 1 ? (
              <View style={styles.accordionList}>
                {episodeChunks.map((chunk, chunkIndex) => {
                  const isExpanded = expandedChunk === chunkIndex;
                  const startEp = chunkIndex * 50 + 1;
                  const endEp = Math.min((chunkIndex + 1) * 50, allEpisodes.length);
                  return (
                    <View key={`chunk-${chunkIndex}`} style={styles.accordionContainer}>
                      <TouchableOpacity 
                        style={styles.accordionHeader} 
                        onPress={() => toggleChunk(chunkIndex)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.accordionTitle}>Tập {startEp} - {endEp}</Text>
                        <Text style={styles.accordionIcon}>{isExpanded ? '▲' : '▼'}</Text>
                      </TouchableOpacity>
                      {isExpanded && (
                        <View style={[styles.epGrid, { padding: Spacing.md }]}>
                          {chunk.map((item, index) => {
                            const globalIndex = chunkIndex * 50 + index;
                            return (
                              <TouchableOpacity
                                key={`ep-${globalIndex}-${item.slug ?? ''}`}
                                style={[
                                  styles.epItem,
                                  { width: accordionItemWidth },
                                  !(item.link_m3u8 || item.link_embed) && styles.epItemDisabled,
                                ]}
                                onPress={() => handleWatch(item)}
                                activeOpacity={0.75}
                              >
                                <Text style={styles.epText} numberOfLines={1}>
                                  {item.name || `Tập ${globalIndex + 1}`}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={[styles.epGrid, { paddingHorizontal: Spacing.base }]}>
                {allEpisodes.map((item, index) => (
                  <TouchableOpacity
                    key={`ep-${index}-${item.slug ?? ''}`}
                    style={[
                      styles.epItem,
                      { width: gridItemWidth },
                      !(item.link_m3u8 || item.link_embed) && styles.epItemDisabled,
                    ]}
                    onPress={() => handleWatch(item)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.epText} numberOfLines={1}>
                      {item.name || `Tập ${index + 1}`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { paddingBottom: 100 },
  center: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: Colors.text, fontSize: Typography.fontSize.base, marginBottom: Spacing.lg },
  retryBtn: {
    backgroundColor: Colors.primary, paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm, borderRadius: BorderRadius.sm, marginBottom: Spacing.md,
  },
  retryText: { color: Colors.white, fontWeight: Typography.fontWeight.bold },
  backBtn: { position: 'absolute', top: 48, left: Spacing.base, zIndex: 100, padding: Spacing.sm },
  backBtn2: { marginTop: Spacing.md },
  backText2: { color: Colors.primary },
  backIcon: { color: Colors.white, fontSize: 24 },

  // Backdrop
  backdrop: { height: 240, position: 'relative' },
  backdropImage: { ...StyleSheet.absoluteFill },
  backdropGradient: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 120 },

  // Info
  infoRow: {
    flexDirection: 'row', padding: Spacing.base,
    marginTop: -60,
  },
  poster: { width: 100, height: 150, borderRadius: BorderRadius.sm, backgroundColor: Colors.backgroundElevated },
  infoCol: { flex: 1, marginLeft: Spacing.md, justifyContent: 'flex-end' },
  title: {
    fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold,
    color: Colors.text, marginBottom: 4,
  },
  originName: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary, marginBottom: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap', marginBottom: 4 },
  metaCnt:{display:'flex', flexDirection:'column', gap: 2, marginTop: 2},
  meta: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary, marginBottom: 2 },
  metaLineCnt:{display:'flex', flexDirection:'column', gap: 4, marginTop: 10},
  metaLine: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary, paddingHorizontal: Spacing.base, marginBottom: 4 },
  actorSection: { gap: Spacing.xs },
  actorList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
  },
  actorChip: {
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  actorChipText: {
    color: Colors.text,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  qualityBadge: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.xs,
    paddingHorizontal: 5, paddingVertical: 2,
  },
  qualityText: { color: Colors.white, fontSize: 9, fontWeight: Typography.fontWeight.bold },

  // Actions
  actionRow: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.base, marginTop: Spacing.sm },
  watchBtn: {
    flex: 1, backgroundColor: Colors.primary,
    paddingVertical: Spacing.md, borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  watchBtnText: { color: Colors.white, fontWeight: Typography.fontWeight.bold, fontSize: Typography.fontSize.base },
  favBtn: {
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: Colors.border,
  },
  favBtnActive: { borderColor: Colors.primary },
  favBtnText: { color: Colors.text, fontSize: Typography.fontSize.sm },

  // Tags
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, paddingHorizontal: Spacing.base, marginTop: Spacing.sm },
  tag: {
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.xs, paddingHorizontal: 8, paddingVertical: 3,
  },
  tagText: { color: Colors.textSecondary, fontSize: Typography.fontSize.xs },

  // Sections
  sectionTitle: {
    fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold,
    color: Colors.text, marginBottom: Spacing.sm,
  },
  contentBlock: { padding: Spacing.base, marginTop: Spacing.md },
  trailerBlock: { paddingHorizontal: Spacing.base, marginTop: Spacing.sm, marginBottom: Spacing.sm },
  trailerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trailerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  trailerPlayIcon: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trailerTextWrap: { flex: 1 },
  trailerTitle: {
    color: Colors.text,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: 2,
  },
  trailerSubtitle: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
  },
  trailerPlayerWrap: {
    overflow: 'hidden',
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.black,
  },
  episodesBlock: { paddingTop: Spacing.md, marginBottom: Spacing.md },
  epGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  epItem: {
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.sm, paddingVertical: Spacing.sm, 
    alignItems: 'center', justifyContent: 'center',
  },
  epItemDisabled: { opacity: 0.4 },
  epText: { color: Colors.text, fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium },
  accordionList: { paddingHorizontal: Spacing.base },
  accordionContainer: { marginBottom: Spacing.sm, backgroundColor: Colors.backgroundElevated, borderRadius: BorderRadius.sm, overflow: 'hidden' },
  accordionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md, backgroundColor: Colors.border },
  accordionTitle: { color: Colors.text, fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.bold },
  accordionIcon: { color: Colors.textSecondary, fontSize: Typography.fontSize.xs },
});
