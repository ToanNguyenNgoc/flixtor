import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing } from '@/config/theme';

interface SectionHeaderProps {
  title: string;
  onSeeAll?: () => void;
}

const SectionHeader = memo(({ title, onSeeAll }: SectionHeaderProps) => (
  <View style={styles.container}>
    <Text style={styles.title}>{title}</Text>
    {onSeeAll && (
      <TouchableOpacity onPress={onSeeAll} activeOpacity={0.7}>
        <Text style={styles.seeAll}>See All</Text>
      </TouchableOpacity>
    )}
  </View>
));

export default SectionHeader;

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, marginBottom: Spacing.sm },
  title: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.text },
  seeAll: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary, fontWeight: Typography.fontWeight.medium },
});
