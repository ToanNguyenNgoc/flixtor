// DownloadsScreen.tsx — DEPRECATED (tab removed)
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography } from '@/config/theme';

export default function DownloadsScreen() {
  return (
    <View style={styles.center}>
      <Text style={styles.text}>Downloads</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  text: { color: Colors.textSecondary, fontSize: Typography.fontSize.base },
});
