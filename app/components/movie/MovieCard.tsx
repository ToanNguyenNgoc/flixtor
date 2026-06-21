import React, { memo, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions,
} from 'react-native';
import { CachedImage } from '@/components/common';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import type { KKMovie } from '@/types';
import { getPosterSource } from '@/utils/image';
import { Colors, Typography, Spacing, BorderRadius } from '@/config/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - Spacing.base * 2 - Spacing.sm * 2) / 3;
const CARD_HEIGHT = CARD_WIDTH * 1.5;

interface MovieCardProps {
  movie: KKMovie;
  onPress?: (movie: KKMovie) => void;
  width?: number;
  height?: number;
}

function MovieCard({ movie, onPress, width = CARD_WIDTH, height = CARD_HEIGHT }: MovieCardProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handlePress = useCallback(() => {
    if (onPress) {
      onPress(movie);
    } else {
      navigation.navigate('MovieDetail', { slug: movie.slug });
    }
  }, [movie, onPress, navigation]);

  return (
    <TouchableOpacity
      style={[styles.card, { width, height }]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <CachedImage
        source={getPosterSource(movie.poster_url ?? movie.thumb_url)}
        style={styles.image}
        resizeMode="cover"
        showSkeleton={false}
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.85)']}
        style={styles.gradient}
      />

      {/* Quality Badge */}
      {!!movie.quality && (
        <View style={styles.qualityBadge}>
          <Text style={styles.qualityText}>{movie.quality.toUpperCase()}</Text>
        </View>
      )}

      {/* Episode badge */}
      {!!movie.episode_current && (
        <View style={styles.epBadge}>
          <Text style={styles.epText} numberOfLines={1}>{movie.episode_current}</Text>
        </View>
      )}

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title} numberOfLines={2}>{movie.name}</Text>
      </View>
    </TouchableOpacity>
  );
}

function areEqualMovieCardProps(prevProps: MovieCardProps, nextProps: MovieCardProps) {
  return (
    prevProps.movie.slug === nextProps.movie.slug
    && prevProps.movie.poster_url === nextProps.movie.poster_url
    && prevProps.movie.thumb_url === nextProps.movie.thumb_url
    && prevProps.movie.episode_current === nextProps.movie.episode_current
    && prevProps.movie.quality === nextProps.movie.quality
    && prevProps.movie.name === nextProps.movie.name
    && prevProps.width === nextProps.width
    && prevProps.height === nextProps.height
    && prevProps.onPress === nextProps.onPress
  );
}

export default memo(MovieCard, areEqualMovieCardProps);

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
    backgroundColor: Colors.backgroundElevated,
  },
  image: { ...StyleSheet.absoluteFillObject },
  gradient: {
    position: 'absolute', left: 0, right: 0, bottom: 0, height: '55%',
  },
  qualityBadge: {
    position: 'absolute', top: 4, left: 4,
    backgroundColor: Colors.primary,
    borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1,
  },
  qualityText: {
    color: Colors.white, fontSize: 8, fontWeight: Typography.fontWeight.bold,
  },
  epBadge: {
    position: 'absolute', top: 4, right: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1, maxWidth: '55%',
  },
  epText: {
    color: Colors.white, fontSize: 8, fontWeight: Typography.fontWeight.medium,
  },
  titleContainer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: Spacing.xs,
  },
  title: {
    color: Colors.text, fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
  },
});
