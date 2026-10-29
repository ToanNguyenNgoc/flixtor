import React, { memo, useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { CachedImage } from '@/components/common';
import { BorderRadius, Colors, Spacing, Typography } from '@/config/theme';
import { formatTime } from '@/utils/formatTime';
import { getPosterSource } from '@/utils/image';
import type { FaphouseMovie } from '../types';

interface FaphouseMovieCardProps {
  movie: FaphouseMovie;
  width: number;
  height: number;
  onPress: (movie: FaphouseMovie) => void;
}

function FaphouseMovieCard({ movie, width, height, onPress }: FaphouseMovieCardProps) {
  const handlePress = useCallback(() => onPress(movie), [movie, onPress]);

  return (
    <TouchableOpacity
      style={[styles.card, { width, height }]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <CachedImage
        source={getPosterSource(movie.posterUrl ?? movie.backdropUrl)}
        style={styles.image}
        resizeMode="cover"
        showSkeleton={false}
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.85)']}
        style={styles.gradient}
      />

      {!!movie.duration && (
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>{formatTime(movie.duration)}</Text>
        </View>
      )}

      <View style={styles.titleContainer}>
        <Text style={styles.title} numberOfLines={2}>{movie.title}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default memo(FaphouseMovieCard);

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
    backgroundColor: Colors.backgroundElevated,
  },
  image: { ...StyleSheet.absoluteFill },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '55%',
  },
  durationBadge: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    backgroundColor: Colors.overlay,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 1,
  },
  durationText: {
    color: Colors.white,
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  titleContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.xs,
  },
  title: {
    color: Colors.text,
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
  },
});
