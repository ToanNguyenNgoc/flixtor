// MyListScreen.tsx — DEPRECATED
// Functionality replaced by FavoritesScreen + favoriteStore.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography } from '@/config/theme';

export default function MyListScreen() {
  return (
    <View style={styles.center}>
      <Text style={styles.text}>
        Chức năng này đã chuyển sang tab Yêu thích ❤️
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', padding: 32 },
  text: { color: Colors.textSecondary, fontSize: Typography.fontSize.base, textAlign: 'center' },
});
