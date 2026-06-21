import React, { memo } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { KKMovie } from '@/types';
import { SvgIcons } from '@/assets/svg-component';
import { BorderRadius, Colors, Spacing, Typography } from '@/config/theme';
import { formatTime } from '@/utils/formatTime';
import MovieCard from './MovieCard';

export interface ResumeMovieCardItem {
  episodeLabel?: string;
  footerLabel?: string;
  movie: KKMovie;
  progressPercent?: number;
  progressSeconds: number;
  subtitle?: string;
}

interface ResumeMovieCardProps {
  actionDisabled?: boolean;
  actionIcon?: keyof typeof SvgIcons;
  actionLoading?: boolean;
  actionLabel?: string;
  height?: number;
  item: ResumeMovieCardItem;
  onActionPress?: () => void;
  onPress: (movie: KKMovie) => void;
  width: number;
}

function ResumeMovieCard({
  actionDisabled = false,
  actionIcon,
  actionLoading = false,
  actionLabel,
  height,
  item,
  onActionPress,
  onPress,
  width,
}: ResumeMovieCardProps) {
  const ActionIcon = actionIcon ? SvgIcons[actionIcon] : null;

  return (
    <View style={[styles.container, { width }]}>
      {!!ActionIcon && onActionPress && (
        <TouchableOpacity
          accessibilityLabel={actionLabel}
          activeOpacity={0.85}
          disabled={actionDisabled || actionLoading}
          onPress={onActionPress}
          style={[
            styles.actionButton,
            (actionDisabled || actionLoading) && styles.actionButtonDisabled,
          ]}
        >
          {actionLoading ? (
            <ActivityIndicator color={Colors.white} size="small" />
          ) : (
            <ActionIcon color={Colors.white} height={16} width={16} />
          )}
        </TouchableOpacity>
      )}

      <MovieCard
        movie={item.movie}
        width={width}
        height={height}
        onPress={onPress}
      />

      <View style={styles.metaCard}>
        {!!item.episodeLabel && (
          <Text numberOfLines={1} style={styles.episodeLabel}>{item.episodeLabel}</Text>
        )}

        <Text numberOfLines={2} style={styles.subtitle}>
          {item.subtitle || 'Tiếp tục xem'}
        </Text>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.min(100, Math.max(10, item.progressPercent ?? 40))}%` },
            ]}
          />
        </View>

        <Text style={styles.metaText}>Đã xem {formatTime(item.progressSeconds)}</Text>

        {!!item.footerLabel && (
          <Text numberOfLines={1} style={styles.footerLabel}>{item.footerLabel}</Text>
        )}
      </View>
    </View>
  );
}

function areEqualResumeMovieCardProps(
  prevProps: ResumeMovieCardProps,
  nextProps: ResumeMovieCardProps,
) {
  return (
    prevProps.actionDisabled === nextProps.actionDisabled
    && prevProps.actionIcon === nextProps.actionIcon
    && prevProps.actionLoading === nextProps.actionLoading
    && prevProps.actionLabel === nextProps.actionLabel
    &&
    prevProps.item.movie.slug === nextProps.item.movie.slug
    && prevProps.item.movie.poster_url === nextProps.item.movie.poster_url
    && prevProps.item.movie.thumb_url === nextProps.item.movie.thumb_url
    && prevProps.item.movie.name === nextProps.item.movie.name
    && prevProps.item.episodeLabel === nextProps.item.episodeLabel
    && prevProps.item.subtitle === nextProps.item.subtitle
    && prevProps.item.footerLabel === nextProps.item.footerLabel
    && prevProps.item.progressPercent === nextProps.item.progressPercent
    && prevProps.item.progressSeconds === nextProps.item.progressSeconds
    && prevProps.width === nextProps.width
    && prevProps.height === nextProps.height
    && prevProps.onActionPress === nextProps.onActionPress
    && prevProps.onPress === nextProps.onPress
  );
}

export default memo(ResumeMovieCard, areEqualResumeMovieCardProps);

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.72)',
    borderRadius: BorderRadius.full,
    height: 32,
    justifyContent: 'center',
    position: 'absolute',
    right: Spacing.sm,
    top: Spacing.sm,
    width: 32,
    zIndex: 3,
  },
  actionButtonDisabled: {
    opacity: 0.7,
  },
  metaCard: {
    marginTop: Spacing.sm,
  },
  episodeLabel: {
    color: Colors.primary,
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.xs,
    lineHeight: 16,
  },
  progressTrack: {
    backgroundColor: Colors.border,
    borderRadius: BorderRadius.full,
    height: 4,
    marginTop: Spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: Colors.primary,
    height: 4,
  },
  metaText: {
    color: Colors.textMuted,
    fontSize: Typography.fontSize.xs,
    marginTop: Spacing.xs,
  },
  footerLabel: {
    color: Colors.textMuted,
    fontSize: Typography.fontSize.xs,
    marginTop: 2,
  },
});
