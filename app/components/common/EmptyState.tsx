import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '@/config/theme';

interface EmptyStateProps {
  emoji?: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

const EmptyState = memo(({ emoji = '🎬', title, subtitle, actionLabel, onAction }: EmptyStateProps) => (
  <View style={styles.container}>
    <Text style={styles.emoji}>{emoji}</Text>
    <Text style={styles.title}>{title}</Text>
    {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    {actionLabel && onAction && (
      <TouchableOpacity style={styles.button} onPress={onAction} activeOpacity={0.8}>
        <Text style={styles.buttonText}>{actionLabel}</Text>
      </TouchableOpacity>
    )}
  </View>
));

export default EmptyState;

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing['3xl'] },
  emoji: { fontSize: 56, marginBottom: Spacing.lg },
  title: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.text, textAlign: 'center', marginBottom: Spacing.sm },
  subtitle: { fontSize: Typography.fontSize.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  button: { marginTop: Spacing.xl, backgroundColor: Colors.primary, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: BorderRadius.sm },
  buttonText: { color: Colors.white, fontWeight: Typography.fontWeight.bold, fontSize: Typography.fontSize.base },
});
