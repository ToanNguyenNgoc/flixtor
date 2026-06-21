/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { isLiquidGlassSupported } from '@callstack/liquid-glass';
import type { SFSymbol } from 'sf-symbols-typescript';
import { Colors, Spacing, Typography } from '@/config/theme';
import type { MainTabParamList } from './types';
import HomeScreen from '@/features/home/screens/HomeScreen';
import SearchScreen from '@/features/search/screens/SearchScreen';
import FilterScreen from '@/features/filter/screens/FilterScreen';
import FavoritesScreen from '@/features/favorites/screens/FavoritesScreen';
import HistoryScreen from '@/features/history/screens/HistoryScreen';
import ProfileScreen from '@/features/profile/screens/ProfileScreen';
import { Icon } from '@/components/common';

const Tab = createBottomTabNavigator<MainTabParamList>();

function getTabIconColor(color: unknown) {
  return typeof color === 'string' ? color : Colors.white;
}

function getTabOptions(
  useNativeLiquidGlassTabs: boolean,
  label: string,
  sfSymbol: SFSymbol,
  icon: 'HomeLight' | 'SearchLight' | 'RocketLight' | 'UserLight'
) {
  if (useNativeLiquidGlassTabs) {
    return {
      tabBarLabel: label,
      tabBarIcon: {
        type: 'sfSymbol' as const,
        name: sfSymbol,
      },
    };
  }

  return {
    tabBarLabel: label,
    tabBarIcon: ({ color }: { color: unknown }) => (
      <Icon icon={icon} color={getTabIconColor(color)} size={24} />
    ),
  };
}

export default function MainNavigator() {
  const insets = useSafeAreaInsets();
  const paddingBottom = Math.max(insets.bottom, Platform.OS === 'android' ? 12 : 20);
  const useNativeLiquidGlassTabs =
    Platform.OS === 'ios' && isLiquidGlassSupported;

  return (
    <Tab.Navigator
      // ─── Liquid Glass (iOS 26+) ────────────────────────────────
      // Khi thiết bị hỗ trợ Liquid Glass, bỏ custom tabBar để
      // React Navigation dùng native UITabBarController appearance.
      implementation={useNativeLiquidGlassTabs ? 'native' : 'custom'}
      screenOptions={{
        headerShown: false,
        inactiveBehavior: 'none',
        ...(useNativeLiquidGlassTabs
          ? {
              tabBarControllerMode: 'tabBar' as const,
              tabBarMinimizeBehavior: 'none' as const,
              tabBarStyle: {
                backgroundColor: Colors.transparent,
                display: 'flex' as const,
                shadowColor: Colors.transparent,
              },
            }
          : {
              tabBarStyle: {
                backgroundColor: Colors.tabBackground,
                borderTopColor: Colors.border,
                borderTopWidth: 0.5,
                height: 60 + paddingBottom,
                paddingBottom,
                paddingTop: Spacing.sm,
                elevation: 0,
              },
            }),
        tabBarLabelVisibilityMode: 'labeled',
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.tabInactive,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: Typography.fontWeight.medium,
        },
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={getTabOptions(
          useNativeLiquidGlassTabs,
          'Trang chủ',
          'house.fill',
          'HomeLight'
        )}
      />
      <Tab.Screen 
        name="Search" 
        component={SearchScreen} 
        options={getTabOptions(
          useNativeLiquidGlassTabs,
          'Tìm kiếm',
          'magnifyingglass',
          'SearchLight'
        )}
      />
      <Tab.Screen
        name="Filter"
        component={FilterScreen}
        options={getTabOptions(
          useNativeLiquidGlassTabs,
          'Khám phá',
          'sparkles',
          'RocketLight'
        )}
      />
      {/* <Tab.Screen name="Favorites" component={FavoritesScreen} options={{ tabBarLabel: 'Yêu thích', tabBarIcon: ({ color }) => <Icon icon='Heart' color={color} size={24} /> }} /> */}
      {/* <Tab.Screen name="History" component={HistoryScreen} options={{ tabBarLabel: 'Lịch sử', tabBarIcon: ({ color }) => <Icon icon='ClockLight' color={color} size={24} /> }} /> */}
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={getTabOptions(
          useNativeLiquidGlassTabs,
          'Tài khoản',
          'person.fill',
          'UserLight'
        )}
      />
    </Tab.Navigator>
  );
}
