import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Carousel from 'react-native-snap-carousel';
import LinearGradient from 'react-native-linear-gradient';
import { CachedImage, Icon } from '@/components/common';
import {
  BorderRadius,
  Colors,
  Screen,
  Spacing,
  Typography,
} from '@/config/theme';
import { getPosterSource, getThumbSource } from '@/utils/image';
import { useFavoriteStore } from '@/features/favorites/store/favoriteStore';
import type { FavoriteMovie, KKMovie } from '@/types';
import { muiColor } from '@/themes';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const HERO_ITEM_WIDTH = Math.min(SCREEN_WIDTH * 0.52, 232);
const HERO_POSTER_HEIGHT = Math.min(SCREEN_HEIGHT * 0.42, HERO_ITEM_WIDTH * 1.46);
const HERO_CAROUSEL_HEIGHT = HERO_POSTER_HEIGHT + Spacing['3xl'];
const HERO_HEIGHT = Math.max(SCREEN_HEIGHT * 0.76, SCREEN_WIDTH * 1.48);

interface HeroBannerProps {
  movies: KKMovie[];
  onMoviePress: (movie: KKMovie) => void;
  onProfilePress: () => void;
  onSearchPress: () => void;
  topInset: number;
}

function createFavoriteMovie(movie: KKMovie): FavoriteMovie {
  return {
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
}

function HeroBanner({
  movies,
  onMoviePress,
  onProfilePress,
  onSearchPress,
  topInset,
}: HeroBannerProps) {
  const carouselRef = useRef<Carousel<KKMovie> | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const favorites = useFavoriteStore(state => state.favorites);
  const toggleFavorite = useFavoriteStore(state => state.toggleFavorite);

  const heroMovies = useMemo(() => movies.slice(0, 5), [movies]);
  const activeMovie = heroMovies[activeIndex] ?? heroMovies[0];
  const isFavorite = !!activeMovie && favorites.some(item => item.slug === activeMovie.slug);

  const backdropSource = useMemo(() => {
    if (!activeMovie) {
      return undefined;
    }

    return getThumbSource(activeMovie.thumb_url ?? activeMovie.poster_url);
  }, [activeMovie]);

  const metaItems = useMemo(() => {
    if (!activeMovie) {
      return [];
    }

    const items = [
      activeMovie.year ? String(activeMovie.year) : undefined,
      activeMovie.lang && activeMovie.lang.length > 8 ? activeMovie.lang?.slice(0, 8) + '...' : activeMovie.lang ,
      // activeMovie.time,
      activeMovie.country?.[0]?.name,
      activeMovie.category?.[0]?.name,
    ].filter(Boolean) as string[];

    return Array.from(new Set(items)).slice(0, 4);
  }, [activeMovie]);

  const handleToggleFavorite = useCallback(() => {
    if (!activeMovie) {
      return;
    }

    toggleFavorite(createFavoriteMovie(activeMovie)).catch(() => {});
  }, [activeMovie, toggleFavorite]);

  const handleSnap = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  const renderCarouselItem = useCallback(({
    item,
    index,
  }: {
    item: KKMovie;
    index: number;
  }) => {
    const isActiveCard = index === activeIndex;

    return (
      <TouchableOpacity
        activeOpacity={0.92}
        style={[
          styles.heroCard,
          isActiveCard ? styles.heroCardActive : styles.heroCardInactive,
        ]}
        onPress={() => onMoviePress(item)}
      >
        <CachedImage
          source={getPosterSource(item.poster_url ?? item.thumb_url)}
          style={styles.heroPoster}
          resizeMode="cover"
          showSkeleton={false}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.18)', 'rgba(0,0,0,0.88)']}
          style={styles.posterOverlay}
        />

        <View style={styles.topBadgeRow}>
          {!!item.year && (
            <View style={styles.darkBadge}>
              <Text style={styles.darkBadgeText}>{item.year}</Text>
            </View>
          )}
          {!!(item.quality || item.lang) && (
            <View style={[styles.darkBadge, styles.trailingBadge]}>
              <Text style={styles.darkBadgeText} numberOfLines={1}>
                {[item.quality].filter(Boolean).join(' • ')}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.posterFooter}>
          {!!(item.episode_current || item.time) && (
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingBadgeText} numberOfLines={1}>
                {item.episode_current ?? item.time}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }, [activeIndex, onMoviePress]);

  if (!activeMovie) {
    return null;
  }

  return (
    <View style={styles.container}>
      <CachedImage
        source={backdropSource}
        style={styles.backdrop}
        resizeMode="cover"
        showSkeleton={false}
      />
      <LinearGradient
        colors={['rgba(8,8,8,0.20)', 'rgba(8,8,8,0.56)', Colors.background]}
        style={styles.backdropOverlay}
      />
      <LinearGradient
        colors={['rgba(122, 36, 17, 0.28)', 'rgba(8,8,8,0)']}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={styles.accentOverlay}
      />

      <View style={[styles.content, { paddingTop: topInset + Spacing.base }]}>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.brand}>FLIXTOR</Text>
          </View>

          <View style={styles.topActions}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onSearchPress}
              style={[styles.iconButton, styles.iconButtonSpacing]}
            >
              <Icon icon="SearchLight" color={Colors.white} size={20} />
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onProfilePress}
              style={styles.iconButton}
            >
              <Icon icon="UserLight" color={Colors.white} size={20} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.carouselWrapper}>
          <Carousel
            ref={carouselRef}
            data={heroMovies}
            renderItem={renderCarouselItem}
            sliderWidth={SCREEN_WIDTH}
            itemWidth={HERO_ITEM_WIDTH}
            activeSlideAlignment="center"
            inactiveSlideOpacity={0.42}
            inactiveSlideScale={0.9}
            enableMomentum
            lockScrollWhileSnapping
            loop={true}
            autoplay={false}
            onSnapToItem={handleSnap}
            containerCustomStyle={styles.carouselContainer}
            contentContainerCustomStyle={styles.carouselContent}
          />
        </View>

        <View style={styles.detailPanel}>
          {!!activeMovie.origin_name && (
            <Text style={styles.subtitle} numberOfLines={1}>
              {activeMovie.origin_name}
            </Text>
          )}
          <Text style={styles.title} numberOfLines={1}>
            {activeMovie.name}
          </Text>

          {metaItems.length > 0 && (
            <View style={styles.metaRow}>
              {metaItems.map(item => (
                <View key={item} style={styles.metaPill}>
                  <Text style={styles.metaPillText}>{item}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.actionRow}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => onMoviePress(activeMovie)}
              style={[styles.actionButton, styles.primaryButton, {backgroundColor: Colors.primary}]}
            >
              <Icon icon='Play'size={18} color={muiColor.grey[0]} />
              <Text style={styles.primaryButtonText}>Xem phim</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleToggleFavorite}
              style={[styles.actionButton, styles.secondaryButton]}
            >
              <Icon
                icon={isFavorite ? 'HeartFilled' : 'Heart'}
                color={isFavorite ? muiColor.red[400] : Colors.white}
                size={18}
              />
              <Text style={styles.primaryButtonText}>
                Yêu thích
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* <Pagination
          dotsLength={heroMovies.length}
          activeDotIndex={activeIndex}
          inactiveDotOpacity={0.35}
          inactiveDotScale={0.84}
          dotStyle={styles.paginationDot}
          inactiveDotStyle={styles.paginationInactiveDot}
          containerStyle={styles.paginationContainer}
        /> */}
      </View>
    </View>
  );
}

export default memo(HeroBanner);

const styles = StyleSheet.create({
  container: {
    height: HERO_HEIGHT,
    backgroundColor: Colors.background,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.44,
  },
  backdropOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  accentOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '62%',
  },
  content: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
  },
  brand: {
    color: Colors.primary,
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.extrabold,
    letterSpacing: 2,
  },
  brandCaption: {
    marginTop: Spacing.xs,
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  iconButtonSpacing: {
    marginRight: Spacing.sm,
  },
  heroEyebrow: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.base,
    color: 'rgba(255,255,255,0.78)',
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  carouselWrapper: {
    height: HERO_CAROUSEL_HEIGHT,
    justifyContent: 'center',
  },
  carouselContainer: {
    overflow: 'visible',
  },
  carouselContent: {
    alignItems: 'center',
  },
  heroCard: {
    width: HERO_ITEM_WIDTH,
    height: HERO_POSTER_HEIGHT,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.backgroundElevated,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  heroCardActive: {
    transform: [{ translateY: 0 }],
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 22 },
    shadowOpacity: 0.42,
    shadowRadius: 30,
    elevation: 18,
  },
  heroCardInactive: {
    transform: [{ translateY: 12 }],
  },
  heroPoster: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BorderRadius.lg,
  },
  posterOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '54%',
  },
  topBadgeRow: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  darkBadge: {
    maxWidth: '50%',
    backgroundColor: 'rgba(0,0,0,0.62)',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  trailingBadge: {
    marginLeft: 'auto',
  },
  darkBadgeText: {
    color: Colors.white,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.regular,
  },
  posterFooter: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    bottom: Spacing.md,
  },
  posterTitle: {
    color: Colors.white,
    fontSize: Screen.isSmall ? Typography.fontSize.xl : Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.extrabold,
    lineHeight: Screen.isSmall ? 24 : 28,
  },
  ratingBadge: {
    alignSelf: 'flex-end',
    marginTop: Spacing.sm,
    backgroundColor: Colors.warning,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  ratingBadgeText: {
    color: Colors.white,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
  },
  detailPanel: {
    flexDirection:'column',
    alignItems:'center',
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
    marginBottom: Spacing.xs,
    textAlign:'center',
  },
  title: {
    color: Colors.white,
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.extrabold,
    textAlign:'center',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent:'center',
    marginTop: Spacing.base,
  },
  metaPill: {
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  metaPillText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: 400,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:'center',
    gap: Spacing.sm,
    marginTop: Spacing.base,
    width: 300,
  },
  actionButton: {
    height: 48,
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex:1,
  },
  primaryButton: {
    backgroundColor: Colors.white,
  },
  secondaryButton: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  primaryButtonText: {
    marginLeft: Spacing.sm,
    color: muiColor.grey[0],
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
  },
  paginationContainer: {
    paddingTop: Spacing.base,
    paddingBottom: Spacing.sm,
  },
  paginationDot: {
    width: 18,
    height: 6,
    borderRadius: BorderRadius.full,
    marginHorizontal: -4,
    backgroundColor: Colors.white,
  },
  paginationInactiveDot: {
    backgroundColor: 'rgba(255,255,255,0.30)',
  },
});
