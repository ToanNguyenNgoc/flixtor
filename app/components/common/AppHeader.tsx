import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '@/config/theme';

interface AppHeaderProps {
  title?: string;
  showLogo?: boolean;
  rightAction?: React.ReactNode;
  leftAction?: React.ReactNode;
  transparent?: boolean;
}

const AppHeader = memo(({ title, showLogo = false, rightAction, leftAction, transparent = false }: AppHeaderProps) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top }, transparent && styles.transparent]}>
      <View style={styles.inner}>
        <View style={styles.left}>{leftAction}</View>
        <View style={styles.center}>
          {showLogo ? (
            <Text style={styles.logo}>FLIXTOR</Text>
          ) : title ? (
            <Text style={styles.title}>{title}</Text>
          ) : null}
        </View>
        <View style={styles.right}>{rightAction}</View>
      </View>
    </View>
  );
});

export default AppHeader;

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.sm,
  },
  transparent: { backgroundColor: 'transparent', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 },
  inner: { flexDirection: 'row', alignItems: 'center', minHeight: 44 },
  left: { flex: 1, alignItems: 'flex-start' },
  center: { flex: 2, alignItems: 'center' },
  right: { flex: 1, alignItems: 'flex-end' },
  logo: { fontSize: Typography.fontSize['2xl'], fontWeight: Typography.fontWeight.extrabold, color: Colors.primary, letterSpacing: 2 },
  title: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.text },
});
