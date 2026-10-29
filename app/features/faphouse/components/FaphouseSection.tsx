import React, { useCallback } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Spacing, Typography } from '@/config/theme';
import type { RootStackParamList } from '@/navigation/types';
import { useFaphouseLatest } from '../hooks/useFaphouse';
import { useFaphouseStore } from '../store/faphouseStore';
import type { FaphouseMovie } from '../types';
import FaphouseMovieCard from './FaphouseMovieCard';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const CARD_WIDTH = 128;
const CARD_HEIGHT = 192;

const keyExtractor = (movie: FaphouseMovie) => movie.id;
const ItemSeparator = () => <View style={styles.separator} />;

export default function FaphouseSection() {
  const navigation = useNavigation() as unknown as Nav;
  const isEnabled = useFaphouseStore(state => state.isEnabled);
  const { data: movies } = useFaphouseLatest(isEnabled);

  const handleMoviePress = useCallback((movie: FaphouseMovie) => {
    navigation.navigate('FaphouseDetail', { slug: movie.slug });
  }, [navigation]);

  const handleSeeMore = useCallback(() => {
    navigation.navigate('Faphouse');
  }, [navigation]);

  const renderMovie = useCallback(({ item }: { item: FaphouseMovie }) => (
    <FaphouseMovieCard
      movie={item}
      width={CARD_WIDTH}
      height={CARD_HEIGHT}
      onPress={handleMoviePress}
    />
  ), [handleMoviePress]);

  if (!isEnabled || !movies?.length) {
    return null;
  }

  return (
    <View style={styles.block}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.eyebrow}>Nội dung 18+</Text>
          <Text style={styles.title}>Faphouse</Text>
        </View>

        <TouchableOpacity activeOpacity={0.8} onPress={handleSeeMore} style={styles.seeMoreButton}>
          <Text style={styles.seeMoreText}>Xem thêm</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={movies}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={keyExtractor}
        renderItem={renderMovie}
        ItemSeparatorComponent={ItemSeparator}
        contentContainerStyle={styles.listContent}
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        windowSize={5}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    paddingTop: Spacing.lg,
  },
  header: {
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.base,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  headerContent: {
    flex: 1,
    paddingRight: Spacing.base,
  },
  eyebrow: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: Spacing.xs,
  },
  title: {
    color: Colors.white,
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.extrabold,
  },
  seeMoreButton: {
    paddingVertical: Spacing.sm,
  },
  seeMoreText: {
    color: Colors.primary,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
  },
  listContent: {
    paddingHorizontal: Spacing.base,
  },
  separator: {
    width: Spacing.sm,
  },
});
