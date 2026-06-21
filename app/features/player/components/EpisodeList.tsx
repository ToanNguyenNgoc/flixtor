import React, { memo, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
} from 'react-native';
import type { KKEpisode } from '@/types';
import { Colors, Typography, Spacing, BorderRadius } from '@/config/theme';

interface EpisodeListProps {
  episodes: KKEpisode[];
  currentSlug?: string;
  currentServerName?: string;
  onSelect: (episode: KKEpisode) => void;
}

const Separator = () => <View style={sepStyle} />;
const sepStyle = { width: Spacing.sm };

function EpisodeList({ episodes, currentSlug, currentServerName, onSelect }: EpisodeListProps) {
  const renderItem = useCallback(({ item }: { item: KKEpisode }) => {
    const isActive = item.slug === currentSlug && item.server_name === currentServerName;
    return (
      <TouchableOpacity
        style={[styles.item, isActive && styles.itemActive]}
        onPress={() => onSelect(item)}
        activeOpacity={0.75}
      >
        <Text style={[styles.text, isActive && styles.textActive]} numberOfLines={2}>
          {item.name ?? item.slug ?? '?'}
        </Text>
        {!!item.server_name && (
          <Text style={styles.server} numberOfLines={1}>{item.server_name}</Text>
        )}
      </TouchableOpacity>
    );
  }, [currentServerName, currentSlug, onSelect]);

  return (
    <FlatList
      data={episodes}
      keyExtractor={ep => `${ep.server_name ?? ''}-${ep.slug ?? ep.name ?? Math.random()}`}
      renderItem={renderItem}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.list}
      ItemSeparatorComponent={Separator}
    />
  );
}

export default memo(EpisodeList);

const styles = StyleSheet.create({
  list: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm },
  item: {
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minWidth: 64, maxWidth: 100,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  itemActive: { borderColor: Colors.primary, backgroundColor: 'rgba(229,9,20,0.15)' },
  text: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    textAlign: 'center',
  },
  textActive: { color: Colors.primary, fontWeight: Typography.fontWeight.bold },
  server: { color: Colors.textMuted, fontSize: 9, marginTop: 2, textAlign: 'center' },
});
