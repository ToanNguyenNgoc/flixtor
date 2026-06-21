// SplashScreen.tsx — Simplified (BootSplash now handled in App.tsx)
import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors, Typography } from '@/config/theme';

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>FLIXTOR</Text>
      <ActivityIndicator color={Colors.primary} size="large" style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  logo: { fontSize: 48, fontWeight: Typography.fontWeight.extrabold, color: Colors.primary, letterSpacing: 4 },
  loader: { marginTop: 40 },
});
