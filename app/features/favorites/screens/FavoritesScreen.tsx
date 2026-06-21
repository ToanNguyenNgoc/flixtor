import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
} from 'react-native';
import { CachedImage } from '@/components/common';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import type { FavoriteMovie } from '@/types';
import { Colors, Typography, Spacing, BorderRadius } from '@/config/theme';
import { useFavoriteStore } from '../store/favoriteStore';
import { SvgIcons } from '@/assets/svg-component';
import { getPosterSource } from '@/utils/image';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const Separator = () => <View style={sepStyle} />;
const sepStyle = { height: Spacing.sm };

export default function FavoritesScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { favorites, loadFavorites, removeFavorite } = useFavoriteStore();

  useEffect(() => { loadFavorites(); }, [loadFavorites]);

  const renderItem = ({ item }: { item: FavoriteMovie }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => navigation.navigate('MovieDetail', { slug: item.slug })}
      activeOpacity={0.8}
    >
      <CachedImage
        source={getPosterSource(item.poster_url)}
        style={styles.poster}
        resizeMode="cover"
      />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
        {!!item.origin_name && (
          <Text style={styles.origin} numberOfLines={1}>{item.origin_name}</Text>
        )}
        <View style={styles.metaRow}>
          {!!item.year && <Text style={styles.meta}>{item.year}</Text>}
          {!!item.quality && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.quality}</Text>
            </View>
          )}
          {!!item.episode_current && <Text style={styles.meta}>{item.episode_current}</Text>}
        </View>
      </View>
      <TouchableOpacity style={styles.removeBtn} onPress={() => removeFavorite(item.slug)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <SvgIcons.CrossSmallLight width={18} height={18} color={Colors.textSecondary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.title}>❤️ Yêu thích</Text>
      {favorites.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🤍</Text>
          <Text style={styles.emptyTitle}>Chưa có phim yêu thích</Text>
          <Text style={styles.emptySub}>Bấm ❤️ trên trang phim để lưu vào đây</Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={item => item.slug}
          renderItem={renderItem}
          ItemSeparatorComponent={Separator}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={5}
          removeClippedSubviews={true}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  title: {
    fontSize: Typography.fontSize['2xl'], fontWeight: Typography.fontWeight.bold,
    color: Colors.text, paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
  },
  list: { paddingHorizontal: Spacing.base, paddingBottom: 100 },
  item: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.sm, padding: Spacing.sm,
  },
  poster: { width: 60, height: 90, borderRadius: BorderRadius.xs, backgroundColor: Colors.background },
  info: { flex: 1, marginHorizontal: Spacing.md },
  name: { color: Colors.text, fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.bold, marginBottom: 2 },
  origin: { color: Colors.textSecondary, fontSize: Typography.fontSize.xs, marginBottom: 4 },
  metaRow: { flexDirection: 'row', gap: Spacing.xs, flexWrap: 'wrap', alignItems: 'center' },
  meta: { color: Colors.textMuted, fontSize: Typography.fontSize.xs },
  badge: {
    backgroundColor: Colors.primary, borderRadius: 2,
    paddingHorizontal: 4, paddingVertical: 1,
  },
  badgeText: { color: Colors.white, fontSize: 9, fontWeight: Typography.fontWeight.bold },
  removeBtn: { padding: Spacing.sm },
  removeText: { color: Colors.textMuted, fontSize: 18 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing['2xl'] },
  emptyEmoji: { fontSize: 56, marginBottom: Spacing.lg },
  emptyTitle: { color: Colors.text, fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, marginBottom: Spacing.sm },
  emptySub: { color: Colors.textMuted, fontSize: Typography.fontSize.sm, textAlign: 'center' },
});
