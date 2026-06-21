import React, { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import {
  BorderRadius,
  Colors,
  Spacing,
  Typography,
} from '@/config/theme';

interface BrandScreenProps {
  redirectUrl?: string;
  isRefreshing?: boolean;
  onRetryPress?: () => void;
}

function isSupportedRedirectUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

export default function BrandScreen({
  redirectUrl,
  isRefreshing = false,
  onRetryPress,
}: BrandScreenProps) {
  const normalizedRedirectUrl = useMemo(() => {
    const trimmedUrl = redirectUrl?.trim();

    if (!trimmedUrl || !isSupportedRedirectUrl(trimmedUrl)) {
      return undefined;
    }

    return trimmedUrl;
  }, [redirectUrl]);

  const handleOpenLink = useCallback(async () => {
    if (!normalizedRedirectUrl) {
      return;
    }

    try {
      await Linking.openURL(normalizedRedirectUrl);
    } catch {
      Alert.alert('Không thể mở liên kết', 'Vui lòng thử lại sau.');
    }
  }, [normalizedRedirectUrl]);

  const handleRetryPress = useCallback(() => {
    if (isRefreshing || !onRetryPress) {
      return;
    }

    onRetryPress();
  }, [isRefreshing, onRetryPress]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={[Colors.background, Colors.backgroundCard, Colors.background]}
        locations={[0, 0.45, 1]}
        style={styles.container}
      >
        <ScrollView
          bounces={false}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.contentInner}>
            <View style={styles.logoWrap}>
              <Text style={styles.logoText}>FLIXTOR</Text>
              <View style={styles.logoUnderline} />
            </View>

            <View style={styles.card}>
              <Text style={styles.eyebrow}>Hệ thống tạm khóa truy cập</Text>
              <Text style={styles.title}>Ứng dụng hiện không khả dụng.</Text>
              <Text style={styles.description}>
                Nhằm hưởng ứng và tuân thủ chính sách của Nhà nước về phòng chống vi phạm bản quyền, hiện tại ứng dụng của chúng tôi đã tạm ngừng hoạt động. Rất mong quý người dùng thông cảm và ủng hộ.
              </Text>

              {normalizedRedirectUrl ? (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleOpenLink}
                  style={styles.primaryButton}
                >
                  <Text style={styles.primaryButtonText}>Mở liên kết</Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                activeOpacity={0.85}
                disabled={isRefreshing || !onRetryPress}
                onPress={handleRetryPress}
                style={[
                  styles.secondaryButton,
                  (isRefreshing || !onRetryPress) && styles.secondaryButtonDisabled,
                ]}
              >
                {isRefreshing ? (
                  <ActivityIndicator color={Colors.text} size="small" />
                ) : (
                  <Text style={styles.secondaryButtonText}>Kiểm tra lại</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing['3xl'],
  },
  contentInner: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoText: {
    color: Colors.primary,
    fontSize: Typography.fontSize['4xl'],
    fontWeight: Typography.fontWeight.extrabold,
    letterSpacing: 6,
  },
  logoUnderline: {
    width: 120,
    height: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    marginTop: Spacing.sm,
  },
  card: {
    width: '100%',
    alignSelf: 'center',
    backgroundColor: Colors.backgroundOverlay,
    borderColor: Colors.border,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing['2xl'],
  },
  eyebrow: {
    color: Colors.primaryLight,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    letterSpacing: 1,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
  },
  title: {
    color: Colors.text,
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.extrabold,
    lineHeight: 34,
    marginBottom: Spacing.base,
  },
  description: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.base,
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.base,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.base,
  },
  primaryButtonText: {
    color: Colors.text,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
  },
  secondaryButton: {
    alignItems: 'center',
    borderColor: Colors.border,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    minHeight: 52,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.base,
  },
  secondaryButtonDisabled: {
    opacity: 0.7,
  },
  secondaryButtonText: {
    color: Colors.text,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
});
