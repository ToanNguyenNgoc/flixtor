import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '@/config/theme';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

const ErrorState = memo(({ title = 'Something went wrong', message = 'Please check your connection and try again.', onRetry }: ErrorStateProps) => (
  <View style={styles.container}>
    <Text style={styles.emoji}>⚠️</Text>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.message}>{message}</Text>
    {onRetry && (
      <TouchableOpacity style={styles.button} onPress={onRetry} activeOpacity={0.8}>
        <Text style={styles.buttonText}>Try Again</Text>
      </TouchableOpacity>
    )}
  </View>
));

export default ErrorState;

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing['3xl'], backgroundColor: Colors.background },
  emoji: { fontSize: 48, marginBottom: Spacing.lg },
  title: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.text, textAlign: 'center', marginBottom: Spacing.sm },
  message: { fontSize: Typography.fontSize.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: Spacing.xl },
  button: { backgroundColor: Colors.primary, paddingHorizontal: Spacing['2xl'], paddingVertical: Spacing.md, borderRadius: BorderRadius.sm },
  buttonText: { color: Colors.white, fontWeight: Typography.fontWeight.bold },
});
