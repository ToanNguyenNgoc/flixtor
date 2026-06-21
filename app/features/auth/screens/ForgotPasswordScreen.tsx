import React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BorderRadius,
  Colors,
  Spacing,
  Typography,
} from '@/config/theme';
import { useForgotPassword } from '@/features/auth/hooks/useForgotPassword';
import type { RootStackParamList } from '@/navigation/types';

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    email,
    errorMessage,
    isSubmitting,
    successMessage,
    setEmail,
    submit,
  } = useForgotPassword();

  const handleSubmit = async () => {
    await submit();
  };

  const handleBackToLogin = () => {
    navigation.replace('Login');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardContainer}
    >
      <ScrollView
        bounces={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + Spacing['2xl'],
            paddingBottom: insets.bottom + Spacing['2xl'],
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroBlock}>
          <Text style={styles.brand}>FLIXTOR</Text>
          <Text style={styles.heroTitle}>Quên mật khẩu?</Text>
          <Text style={styles.heroSubtitle}>
            Nhập email tài khoản của bạn, chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu.
          </Text>
        </View>

        <View style={styles.formCard}>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Email</Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isSubmitting}
              keyboardType="email-address"
              placeholder="Nhập email tài khoản"
              placeholderTextColor={Colors.textMuted}
              returnKeyType="done"
              selectionColor={Colors.primary}
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              onSubmitEditing={handleSubmit}
            />
          </View>

          {errorMessage ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {successMessage ? (
            <View style={styles.successBox}>
              <Text style={styles.successText}>{successMessage}</Text>
              <Text style={styles.successHint}>
                Vui lòng kiểm tra email để đặt lại mật khẩu.
              </Text>
            </View>
          ) : null}

          <TouchableOpacity
            activeOpacity={0.9}
            disabled={isSubmitting}
            onPress={handleSubmit}
            style={[styles.primaryButton, isSubmitting && styles.primaryButtonDisabled]}
          >
            {isSubmitting ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.primaryButtonText}>Gửi email đặt lại mật khẩu</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            disabled={isSubmitting}
            onPress={handleBackToLogin}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>Quay lại đăng nhập</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    backgroundColor: Colors.background,
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.base,
  },
  heroBlock: {
    marginBottom: Spacing['2xl'],
  },
  brand: {
    color: Colors.primary,
    fontSize: Typography.fontSize['4xl'],
    fontWeight: Typography.fontWeight.extrabold,
    letterSpacing: 3,
    marginBottom: Spacing.base,
  },
  heroTitle: {
    color: Colors.text,
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.sm,
  },
  heroSubtitle: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.base,
    lineHeight: 24,
  },
  formCard: {
    backgroundColor: Colors.backgroundCard,
    borderColor: Colors.border,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.lg,
  },
  fieldGroup: {
    marginBottom: Spacing.base,
  },
  fieldLabel: {
    color: Colors.text,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.backgroundElevated,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    color: Colors.text,
    fontSize: Typography.fontSize.base,
    height: 52,
    paddingHorizontal: Spacing.md,
  },
  errorBox: {
    backgroundColor: Colors.overlayDark,
    borderColor: Colors.primaryDark,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.base,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  errorText: {
    color: Colors.text,
    fontSize: Typography.fontSize.sm,
    lineHeight: 20,
  },
  successBox: {
    backgroundColor: Colors.backgroundElevated,
    borderColor: Colors.success,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.base,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  successText: {
    color: Colors.text,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    lineHeight: 20,
  },
  successHint: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
    lineHeight: 20,
    marginTop: Spacing.xs,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: Spacing.base,
  },
  primaryButtonDisabled: {
    backgroundColor: Colors.primaryDark,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
  },
  secondaryButton: {
    alignItems: 'center',
    marginTop: Spacing.base,
    paddingVertical: Spacing.xs,
  },
  secondaryButtonText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
});
