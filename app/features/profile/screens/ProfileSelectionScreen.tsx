// ProfileSelectionScreen.tsx — DEPRECATED (bypassed in guest mode)
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography } from '@/config/theme';

export default function ProfileSelectionScreen() {
  return (
    <View style={styles.center}>
      <Text style={styles.text}>Profile Selection</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  text: { color: Colors.textSecondary, fontSize: Typography.fontSize.base },
});
