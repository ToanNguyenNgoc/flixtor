import React from 'react';
import {
  ActivityIndicator,
  Image,
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
import { CommonActions, useNavigation } from '@react-navigation/native';
import { SvgIcons } from '@/assets/svg-component';
import { image } from '@/assets/image';
import {
  BorderRadius,
  Colors,
  Spacing,
  Typography,
} from '@/config/theme';
import { useAuthGoogle } from '@/features/auth/hooks/useAuthGoogle';
import { useLogin } from '@/features/auth/hooks/useLogin';
import type { RootStackParamList } from '@/navigation/types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

const PASSWORD_TOGGLE_HIT_SLOP = {
  bottom: 10,
  left: 10,
  right: 10,
  top: 10,
} as const;

const AUTH_ROUTE_NAMES = new Set<keyof RootStackParamList>([
  'Login',
  'Register',
  'ForgotPassword',
  'ResetPassword',
]);

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    email,
    password,
    errorMessage,
    isLoggingIn,
    isPasswordVisible,
    setEmail,
    setPassword,
    submit,
    togglePasswordVisibility,
  } = useLogin();
  const {
    signInWithGoogle,
    isGoogleLoading,
    isGoogleBackendLoading,
    googleLoadingMessage,
    googleError,
    clearGoogleError,
  } = useAuthGoogle();

  const handleSubmit = async () => {
    clearGoogleError();
    const isSuccess = await submit();

    if (!isSuccess) {
      return;
    }

    const state = navigation.getState();
    let nearestNonAuthRouteIndex = -1;

    for (let index = state.index - 1; index >= 0; index -= 1) {
      const routeName = state.routes[index]?.name as keyof RootStackParamList | undefined;

      if (routeName && !AUTH_ROUTE_NAMES.has(routeName)) {
        nearestNonAuthRouteIndex = index;
        break;
      }
    }

    if (nearestNonAuthRouteIndex >= 0) {
      navigation.dispatch(
        CommonActions.reset({
          ...state,
          index: nearestNonAuthRouteIndex,
          routes: state.routes.slice(0, nearestNonAuthRouteIndex + 1),
        }),
      );
      return;
    }

    navigation.reset({
      index: 0,
      routes: [{ name: 'RootTabs', params: { screen: 'Home' } }],
    });
  };

  const handleOpenRegister = () => {
    navigation.replace('Register');
  };

  const handleOpenForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  const handleGoogleLogin = async () => {
    await signInWithGoogle();
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
          <Text style={styles.heroTitle}>Đăng nhập để tiếp tục xem</Text>
          <Text style={styles.heroSubtitle}>
            Truy cập hồ sơ của bạn, đồng bộ phiên đăng nhập và xem tiếp nội dung yêu thích.
          </Text>
        </View>

        <View style={styles.formCard}>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Email</Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoggingIn && !isGoogleLoading}
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
            <Text style={styles.fieldLabel}>Mật khẩu</Text>
            <View style={styles.passwordField}>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoggingIn && !isGoogleLoading}
                placeholder="Nhập mật khẩu"
                placeholderTextColor={Colors.textMuted}
                returnKeyType="done"
                secureTextEntry={!isPasswordVisible}
                selectionColor={Colors.primary}
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
                onSubmitEditing={handleSubmit}
              />
              <TouchableOpacity
                activeOpacity={0.8}
                disabled={isLoggingIn || isGoogleLoading}
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

          <TouchableOpacity
            activeOpacity={0.8}
            disabled={isLoggingIn || isGoogleLoading}
            onPress={handleOpenForgotPassword}
            style={styles.forgotPasswordButton}
          >
            <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
          </TouchableOpacity>

          {errorMessage ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            activeOpacity={0.9}
            disabled={isLoggingIn || isGoogleLoading}
            onPress={handleSubmit}
            style={[styles.loginButton, (isLoggingIn || isGoogleLoading) && styles.loginButtonDisabled]}
          >
            {isLoggingIn ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.loginButtonText}>Đăng nhập</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.9}
            disabled={isLoggingIn || isGoogleLoading}
            onPress={handleGoogleLogin}
            style={[styles.googleButton, (isLoggingIn || isGoogleLoading) && styles.googleButtonDisabled]}
          >
            {isGoogleLoading ? (
              <View style={styles.googleButtonLoadingContent}>
                <ActivityIndicator color={Colors.text} />
                <Text style={styles.googleButtonLoadingText}>
                  {isGoogleBackendLoading ? 'Đang đăng nhập Flixtor...' : 'Đang mở Google...'}
                </Text>
              </View>
            ) : (
              <View style={styles.googleButtonContent}>
                <Image source={image.Google} style={styles.googleIcon} />
                <Text style={styles.googleButtonText}>Đăng nhập với Google</Text>
              </View>
            )}
          </TouchableOpacity>

          {isGoogleLoading && googleLoadingMessage ? (
            <View style={styles.googleLoadingBox}>
              <ActivityIndicator color={Colors.primary} size="small" />
              <Text style={styles.googleLoadingText}>{googleLoadingMessage}</Text>
            </View>
          ) : null}

          {googleError ? (
            <View style={styles.googleErrorBox}>
              <Text style={styles.googleErrorText}>{googleError}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            activeOpacity={0.8}
            disabled={isLoggingIn || isGoogleLoading}
            onPress={handleOpenRegister}
            style={styles.switchAuthButton}
          >
            <Text style={styles.switchAuthText}>
              Chưa có tài khoản? <Text style={styles.switchAuthAccent}>Đăng ký tài khoản</Text>
            </Text>
          </TouchableOpacity>

          <Text style={styles.helperText}>
            App chỉ lưu token lấy từ API đăng nhập và sẽ tự kiểm tra lại phiên bằng hồ sơ người dùng khi mở lại.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: Colors.background,
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
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.base,
    marginTop: -Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  forgotPasswordText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
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
  loginButton: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: Spacing.base,
  },
  loginButtonDisabled: {
    backgroundColor: Colors.primaryDark,
  },
  loginButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
  },
  googleButton: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    marginTop: Spacing.base,
    minHeight: 52,
    paddingHorizontal: Spacing.base,
  },
  googleButtonDisabled: {
    opacity: 0.75,
  },
  googleButtonContent: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  googleButtonLoadingContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'center',
  },
  googleIcon: {
    height: 20,
    marginRight: Spacing.sm,
    width: 20,
  },
  googleButtonText: {
    color: Colors.black,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
  },
  googleButtonLoadingText: {
    color: Colors.black,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
  },
  googleLoadingBox: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundElevated,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'center',
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  googleLoadingText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    lineHeight: 20,
    textAlign: 'center',
  },
  googleErrorBox: {
    backgroundColor: Colors.overlayDark,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: Spacing.base,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  googleErrorText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
    lineHeight: 20,
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
