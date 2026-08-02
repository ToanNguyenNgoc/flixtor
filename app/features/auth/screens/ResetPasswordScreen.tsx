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
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgIcons } from '@/assets/svg-component';
import {
  BorderRadius,
  Colors,
  Spacing,
  Typography,
} from '@/config/theme';
import { useResetPassword } from '@/features/auth/hooks/useResetPassword';
import type { RootStackParamList } from '@/navigation/types';

const PASSWORD_TOGGLE_HIT_SLOP = {
  bottom: 10,
  left: 10,
  right: 10,
  top: 10,
} as const;

export default function ResetPasswordScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation() as unknown as NativeStackNavigationProp<RootStackParamList>;
  const route = useRoute() as unknown as RouteProp<RootStackParamList, 'ResetPassword'>;
  const {
    confirmPassword,
    errorMessage,
    hasValidToken,
    invalidTokenMessage,
    isPasswordVisible,
    isSubmitting,
    password,
    successMessage,
    setConfirmPassword,
    setPassword,
    submit,
    togglePasswordVisibility,
  } = useResetPassword(route.params?.token);

  const handleSubmit = async () => {
    const isSuccess = await submit();

    if (!isSuccess) {
      return;
    }
  };

  const handleGoToLogin = () => {
    navigation.replace('Login');
  };

  const resolvedMessage = errorMessage ?? invalidTokenMessage;

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
          <Text style={styles.heroTitle}>Đặt lại mật khẩu</Text>
          <Text style={styles.heroSubtitle}>
            Nhập mật khẩu mới cho tài khoản của bạn.
          </Text>
        </View>

        <View style={styles.formCard}>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Mật khẩu mới</Text>
            <View style={styles.passwordField}>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isSubmitting && !successMessage}
                placeholder="Tối thiểu 6 ký tự"
                placeholderTextColor={Colors.textMuted}
                returnKeyType="next"
                secureTextEntry={!isPasswordVisible}
                selectionColor={Colors.primary}
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                activeOpacity={0.8}
                disabled={isSubmitting}
                hitSlop={PASSWORD_TOGGLE_HIT_SLOP}
                onPress={togglePasswordVisibility}
                style={styles.passwordToggle}
              >
                {isPasswordVisible ? (
                  <SvgIcons.EyeScrossed color={Colors.textSecondary} height={20} width={20} />
                ) : (
                  <SvgIcons.Eye color={Colors.textSecondary} height={20} width={20} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Xác nhận mật khẩu mới</Text>
            <View style={styles.passwordField}>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isSubmitting && !successMessage}
                placeholder="Nhập lại mật khẩu mới"
                placeholderTextColor={Colors.textMuted}
                returnKeyType="done"
                secureTextEntry={!isPasswordVisible}
                selectionColor={Colors.primary}
                style={styles.passwordInput}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                onSubmitEditing={handleSubmit}
              />
              <TouchableOpacity
                activeOpacity={0.8}
                disabled={isSubmitting}
                hitSlop={PASSWORD_TOGGLE_HIT_SLOP}
                onPress={togglePasswordVisibility}
                style={styles.passwordToggle}
              >
                {isPasswordVisible ? (
                  <SvgIcons.EyeScrossed color={Colors.textSecondary} height={20} width={20} />
                ) : (
                  <SvgIcons.Eye color={Colors.textSecondary} height={20} width={20} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {resolvedMessage ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{resolvedMessage}</Text>
            </View>
          ) : null}

          {successMessage ? (
            <View style={styles.successBox}>
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          ) : null}

          {!successMessage ? (
            <TouchableOpacity
              activeOpacity={0.9}
              disabled={isSubmitting || !hasValidToken}
              onPress={handleSubmit}
              style={[
                styles.primaryButton,
                (isSubmitting || !hasValidToken) && styles.primaryButtonDisabled,
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.primaryButtonText}>Đặt lại mật khẩu</Text>
              )}
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            activeOpacity={0.8}
            disabled={isSubmitting}
            onPress={handleGoToLogin}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>
              {successMessage ? 'Đăng nhập ngay' : 'Quay lại đăng nhập'}
            </Text>
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
  passwordField: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundElevated,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 52,
    paddingLeft: Spacing.md,
    paddingRight: Spacing.sm,
  },
  passwordInput: {
    color: Colors.text,
    flex: 1,
    fontSize: Typography.fontSize.base,
    height: 52,
  },
  passwordToggle: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36,
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
