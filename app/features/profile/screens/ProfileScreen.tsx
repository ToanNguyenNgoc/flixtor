import dayjs from 'dayjs';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CachedImage, Icon } from '@/components/common';
import {
  BorderRadius,
  Colors,
  Spacing,
  Typography,
} from '@/config/theme';
import { useAuthStore } from '@/features/auth/store/authStore';
import type { RootStackParamList } from '@/navigation/types';
import { SvgIcons } from '@/assets/svg-component';
import { muiColor } from '@/themes';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface InfoRowProps {
  label: string;
  value: string;
}

interface ActionRowProps {
  danger?: boolean;
  icon: keyof typeof SvgIcons;
  isLoading?: boolean;
  label: string;
  onPress: () => void;
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function ActionRow({
  danger = false,
  icon,
  isLoading = false,
  label,
  onPress,
}: ActionRowProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={isLoading}
      onPress={onPress}
      style={[styles.actionRow, danger && styles.actionRowDanger]}
    >
      <Icon color={danger ? Colors.primary : muiColor.grey[0]} icon={icon} size={20} />
      <Text style={[styles.actionLabel, danger && styles.actionLabelDanger]}>{label}</Text>
      {isLoading ? (
        <ActivityIndicator color={danger ? Colors.primary : Colors.textSecondary} size="small" />
      ) : (
        <Text style={styles.chevron}>›</Text>
      )}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation() as unknown as Nav;
  const user = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const isStoreLoading = useAuthStore(state => state.isLoading);
  const getProfile = useAuthStore(state => state.getProfile);
  const logout = useAuthStore(state => state.logout);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleOpenSettings = () => {
    navigation.navigate('Setting');
  };

  const handleOpenLogin = () => {
    navigation.navigate('Login');
  };

  const handleOpenRegister = () => {
    navigation.navigate('Register');
  };

  const handleOpenHistory = () => {
    navigation.navigate('History');
  };

  const handleRefreshProfile = async () => {
    setIsRefreshing(true);

    try {
      await getProfile();
      Alert.alert('Đã cập nhật', 'Thông tin tài khoản đã được làm mới.');
    } catch (error) {
      Alert.alert(
        'Không thể tải hồ sơ',
        error instanceof Error ? error.message : 'Vui lòng thử lại sau.',
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  const isGuest = !isAuthenticated || !user;
  const isBusy = isRefreshing || isLoggingOut || isStoreLoading;

  if (isGuest) {
    return (
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.lg,
            paddingBottom: insets.bottom + Spacing['2xl'],
          },
        ]}
        showsVerticalScrollIndicator={false}
        style={styles.container}
      >
        <View style={styles.heroCard}>
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarFallbackText}>K</Text>
          </View>
          <Text style={styles.displayName}>Khách</Text>
          <Text style={styles.email}>Bạn có thể xem phim bình thường mà không cần đăng nhập.</Text>

          <View style={styles.signCnt}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleOpenLogin}
              style={styles.loginButton}
            >
              <Text style={styles.loginButtonText}>Đăng nhập</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleOpenRegister}
              style={styles.registerButton}
            >
              <Text style={styles.registerButtonText}>Đăng ký</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tùy chọn</Text>
          <View style={styles.actionsCard}>
            <ActionRow
              icon="SignIn"
              label="Đăng nhập để đồng bộ hồ sơ"
              onPress={handleOpenLogin}
            />
            <ActionRow
              icon="UserLight"
              label="Tạo tài khoản mới"
              onPress={handleOpenRegister}
            />
            <ActionRow
              icon="ClockLight"
              label="Lịch sử xem"
              onPress={handleOpenHistory}
            />
            <ActionRow
              icon="SettingsLight"
              label="Cài đặt ứng dụng"
              onPress={handleOpenSettings}
            />
          </View>
        </View>

        <Text style={styles.footerNote}>
          Khi đăng nhập, app sẽ lưu phiên để dùng lại ở lần mở sau nếu token còn hợp lệ.
        </Text>
      </ScrollView>
    );
  }

  const displayName = user.displayName;
  const email = user.email;
  const emailVerified = user.emailVerified ? 'Đã xác minh' : 'Chưa xác minh';
  const createdAt = dayjs(user.createdAt).format('DD/MM/YYYY HH:mm');
  const shouldShowAvatar = Boolean(user.avatarUrl);

  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + Spacing.lg,
          paddingBottom: insets.bottom + Spacing['2xl'],
        },
      ]}
      showsVerticalScrollIndicator={false}
      style={styles.container}
    >
      <View style={styles.heroCard}>
        <View style={styles.avatarWrap}>
          {shouldShowAvatar ? (
            <CachedImage
              source={{ uri: user.avatarUrl }}
              style={styles.avatarImage}
            />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarFallbackText}>
                {displayName.slice(0, 1).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.displayName}>{displayName}</Text>
        <Text style={styles.email}>{email}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thông tin tài khoản</Text>
        <View style={styles.infoCard}>
          <InfoRow label="Email" value={email} />
          <InfoRow label="Xác minh email" value={emailVerified} />
          <InfoRow label="Ngày tạo" value={createdAt} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thao tác</Text>
        <View style={styles.actionsCard}>
          <ActionRow
            icon="ClockLight"
            label="Lịch sử xem"
            onPress={handleOpenHistory}
          />
          <ActionRow
            icon="RefreshLight"
            isLoading={isRefreshing}
            label="Làm mới hồ sơ"
            onPress={handleRefreshProfile}
          />
          <ActionRow
            icon="SettingsLight"
            label="Cài đặt ứng dụng"
            onPress={handleOpenSettings}
          />
          <ActionRow
            danger
            icon="SignOut"
            isLoading={isLoggingOut}
            label="Đăng xuất"
            onPress={handleLogout}
          />
        </View>
      </View>

      {isBusy ? (
        <Text style={styles.footerNote}>Đang xử lý tài khoản...</Text>
      ) : (
        <Text style={styles.footerNote}>Token sẽ tự bị xoá nếu phiên đăng nhập hết hạn.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: Spacing.base,
  },
  heroCard: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundCard,
    borderColor: Colors.border,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing['2xl'],
  },
  avatarWrap: {
    marginBottom: Spacing.base,
  },
  avatarImage: {
    borderRadius: BorderRadius.full,
    height: 96,
    width: 96,
  },
  avatarFallback: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    height: 96,
    justifyContent: 'center',
    marginBottom: Spacing.base,
    width: 96,
  },
  avatarFallbackText: {
    color: Colors.white,
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
  },
  displayName: {
    color: Colors.text,
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  email: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
    textAlign: 'center',
  },
  signCnt:{
    display:'flex',
    flexDirection: 'column',
    justifyContent:'center',
    alignItems:'center',
    gap: Spacing.md,
    marginTop: Spacing.base,
  },
  loginButton: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    width: 240,
    paddingVertical: Spacing.md,
  },
  loginButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
  },
  registerButton: {
    alignItems: 'center',
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    width: 240,
    paddingVertical: Spacing.md,
  },
  registerButtonText: {
    color: Colors.text,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
  section: {
    marginTop: Spacing.xl,
  },
  sectionTitle: {
    color: Colors.textMuted,
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    letterSpacing: 1,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
  },
  infoCard: {
    backgroundColor: Colors.backgroundCard,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  infoRow: {
    borderBottomColor: Colors.divider,
    borderBottomWidth: 1,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  infoLabel: {
    color: Colors.textMuted,
    fontSize: Typography.fontSize.xs,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
  },
  infoValue: {
    color: Colors.text,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
  },
  actionsCard: {
    backgroundColor: Colors.backgroundCard,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  actionRow: {
    alignItems: 'center',
    borderBottomColor: Colors.divider,
    borderBottomWidth: 1,
    flexDirection: 'row',
    minHeight: 56,
    paddingHorizontal: Spacing.base,
  },
  actionRowDanger: {
    backgroundColor: Colors.backgroundCard,
  },
  actionLabel: {
    color: Colors.text,
    flex: 1,
    fontSize: Typography.fontSize.base,
    marginLeft: Spacing.md,
  },
  actionLabelDanger: {
    color: Colors.primary,
  },
  chevron: {
    color: Colors.textMuted,
    fontSize: Typography.fontSize.lg,
  },
  footerNote: {
    color: Colors.textMuted,
    fontSize: Typography.fontSize.xs,
    marginTop: Spacing.xl,
    textAlign: 'center',
  },
});
