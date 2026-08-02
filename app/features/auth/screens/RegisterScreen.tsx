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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SvgIcons } from '@/assets/svg-component';
import {
  BorderRadius,
  Colors,
  Spacing,
  Typography,
} from '@/config/theme';
import { useRegister } from '@/features/auth/hooks/useRegister';
import type { RootStackParamList } from '@/navigation/types';

const PASSWORD_TOGGLE_HIT_SLOP = {
  bottom: 10,
  left: 10,
  right: 10,
  top: 10,
} as const;

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation() as unknown as NativeStackNavigationProp<RootStackParamList>;
  const {
    confirmPassword,
    displayName,
    email,
    errorMessage,
    isPasswordVisible,
    isRegistering,
    password,
    setConfirmPassword,
    setDisplayName,
    setEmail,
    setPassword,
    submit,
    togglePasswordVisibility,
  } = useRegister();

  const handleSubmit = async () => {
    const isSuccess = await submit();

    if (!isSuccess) {
      return;
    }

    if (navigation.canGoBack()) {
      navigation.popToTop();
    }

    navigation.navigate('RootTabs', { screen: 'Profile' });
  };

  const handleOpenLogin = () => {
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
          <Text style={styles.heroTitle}>Tạo tài khoản để đồng bộ dữ liệu</Text>
          <Text style={styles.heroSubtitle}>
            Đăng ký là tùy chọn. Khi có tài khoản, bạn có thể lưu lịch sử xem và tiếp tục phát trên nhiều thiết bị.
          </Text>
        </View>

        <View style={styles.formCard}>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Email</Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isRegistering}
              keyboardType="email-address"
              placeholder="Nhập email"
              placeholderTextColor={Colors.textMuted}
              returnKeyType="next"
              selectionColor={Colors.primary}
              style={styles.input}
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Tên hiển thị</Text>
            <TextInput
              autoCapitalize="words"
              editable={!isRegistering}
              placeholder="Nhập tên hiển thị"
              placeholderTextColor={Colors.textMuted}
              returnKeyType="next"
              selectionColor={Colors.primary}
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Mật khẩu</Text>
            <View style={styles.passwordField}>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isRegistering}
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
                disabled={isRegistering}
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
            <Text style={styles.fieldLabel}>Xác nhận mật khẩu</Text>
            <View style={styles.passwordField}>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isRegistering}
                placeholder="Nhập lại mật khẩu"
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
                disabled={isRegistering}
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

          {errorMessage ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            activeOpacity={0.9}
            disabled={isRegistering}
            onPress={handleSubmit}
            style={[styles.registerButton, isRegistering && styles.registerButtonDisabled]}
          >
            {isRegistering ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.registerButtonText}>Đăng ký</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            disabled={isRegistering}
            onPress={handleOpenLogin}
            style={styles.switchAuthButton}
          >
            <Text style={styles.switchAuthText}>
              Đã có tài khoản? <Text style={styles.switchAuthAccent}>Đăng nhập</Text>
            </Text>
          </TouchableOpacity>

          <Text style={styles.helperText}>
            Sau khi đăng ký thành công, app sẽ tự đăng nhập và dùng token mới cho các API cá nhân hóa.
          </Text>
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
  registerButton: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: Spacing.base,
  },
  registerButtonDisabled: {
    backgroundColor: Colors.primaryDark,
  },
  registerButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
  },
  switchAuthButton: {
    alignItems: 'center',
    marginTop: Spacing.base,
    paddingVertical: Spacing.xs,
  },
  switchAuthText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
  },
  switchAuthAccent: {
    color: Colors.primary,
    fontWeight: Typography.fontWeight.bold,
  },
  helperText: {
    color: Colors.textMuted,
    fontSize: Typography.fontSize.xs,
    lineHeight: 18,
    marginTop: Spacing.base,
    textAlign: 'center',
  },
});
