import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Typography, Spacing, BorderRadius } from '@/config/theme';
import { PressableIconSvg } from '@/components/common';
import type { RootStackParamList } from '@/navigation/types';
import {
  API_SERVER_OPTIONS,
  DEFAULT_API_SERVER_KEY,
  getStoredApiServer,
  setApiServer,
} from '@/services/api/axiosClient';
import type { ApiServerKey } from '@/services/api/axiosClient';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type ApiServerOption = (typeof API_SERVER_OPTIONS)[number];

interface ApiServerOptionRowProps {
  disabled: boolean;
  isSelected: boolean;
  onPress: (serverKey: ApiServerKey) => void;
  option: ApiServerOption;
}

const ApiServerOptionRow = memo(function ApiServerOptionRow({
  disabled,
  isSelected,
  onPress,
  option,
}: ApiServerOptionRowProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled}
      onPress={() => onPress(option.key)}
      style={[
        styles.optionCard,
        isSelected && styles.optionCardActive,
        disabled && styles.optionCardDisabled,
      ]}
    >
      <View style={styles.optionHeader}>
        <View style={styles.optionCopy}>
          <Text style={styles.optionTitle}>{option.label}</Text>
          <Text style={styles.optionDescription}>{option.description}</Text>
        </View>
        <View style={[styles.radioOuter, isSelected && styles.radioOuterActive]}>
          {isSelected && <View style={styles.radioInner} />}
        </View>
      </View>
    </TouchableOpacity>
  );
});

export default function SettingScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation() as unknown as Nav;
  const queryClient = useQueryClient();
  const [selectedServer, setSelectedServer] = useState<ApiServerKey>(DEFAULT_API_SERVER_KEY);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    let isMounted = true;

    getStoredApiServer()
      .then(serverKey => {
        if (isMounted) {
          setSelectedServer(serverKey);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const activeServerOption = useMemo(() => {
    return API_SERVER_OPTIONS.find(option => option.key === selectedServer) ?? API_SERVER_OPTIONS[0];
  }, [selectedServer]);

  const handleBackPress = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleSelectServer = useCallback(async (serverKey: ApiServerKey) => {
    if (serverKey === selectedServer || isUpdating) {
      return;
    }

    setIsUpdating(true);

    try {
      await setApiServer(serverKey);
      setSelectedServer(serverKey);
      await queryClient.resetQueries();

      const selectedOption = API_SERVER_OPTIONS.find(option => option.key === serverKey);
      Alert.alert(
        'Đã chuyển API server',
        `Ứng dụng đang dùng ${selectedOption?.label ?? 'server mới'}. Dữ liệu sẽ tự tải lại theo server mới.`,
      );
    } catch {
      Alert.alert('Không thể đổi server', 'Vui lòng thử lại sau.');
    } finally {
      setIsUpdating(false);
    }
  }, [isUpdating, queryClient, selectedServer]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <PressableIconSvg
          color={Colors.text}
          icon="CaretLeft"
          onPress={handleBackPress}
          size={18}
          sizeButton={36}
        />
        <Text style={styles.headerTitle}>Cài đặt ứng dụng</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing['2xl'] }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>API server</Text>
          <Text style={styles.sectionDescription}>
            Chọn server dữ liệu cho toàn bộ app. Mặc định là Flix API.
          </Text>

          <View style={styles.currentServerBox}>
            <Text style={styles.currentServerLabel}>Server hiện tại</Text>
            <Text style={styles.currentServerValue}>{activeServerOption.label}</Text>
            <Text style={styles.currentServerDescription}>{activeServerOption.description}</Text>
          </View>

          {isLoading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator color={Colors.primary} />
              <Text style={styles.loadingText}>Đang tải cấu hình...</Text>
            </View>
          ) : (
            <View style={styles.optionList}>
              {API_SERVER_OPTIONS.map(option => (
                <ApiServerOptionRow
                  key={option.key}
                  disabled={isUpdating}
                  isSelected={selectedServer === option.key}
                  onPress={handleSelectServer}
                  option={option}
                />
              ))}
            </View>
          )}

          <Text style={styles.helperText}>
            Khi đổi server, các request tiếp theo sẽ dùng server mới ngay lập tức.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.base,
  },
  headerTitle: {
    color: Colors.text,
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
  },
  headerSpacer: {
    width: 36,
    height: 36,
  },
  content: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.base,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.xs,
  },
  sectionDescription: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
    lineHeight: 20,
    marginBottom: Spacing.base,
  },
  currentServerBox: {
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.base,
  },
  currentServerLabel: {
    color: Colors.textMuted,
    fontSize: Typography.fontSize.xs,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
  },
  currentServerValue: {
    color: Colors.text,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  currentServerDescription: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.xs,
    marginTop: Spacing.xs,
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
  },
  optionList: {
    gap: Spacing.md,
  },
  optionCard: {
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  optionCardActive: {
    borderColor: Colors.primary,
  },
  optionCardDisabled: {
    opacity: 0.7,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  optionCopy: {
    flex: 1,
    gap: Spacing.xs,
  },
  optionTitle: {
    color: Colors.text,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
  },
  optionDescription: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
  },
  optionUrl: {
    color: Colors.textMuted,
    fontSize: Typography.fontSize.sm,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    borderColor: Colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: {
    borderColor: Colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
  },
  helperText: {
    color: Colors.textMuted,
    fontSize: Typography.fontSize.xs,
    lineHeight: 18,
    marginTop: Spacing.base,
  },
});
