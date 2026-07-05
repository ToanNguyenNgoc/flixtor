/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform } from 'react-native';
import { isLiquidGlassSupported } from '@callstack/liquid-glass';
import type { SFSymbol } from 'sf-symbols-typescript';
import { Colors } from '@/config/theme';
import type { MainTabParamList } from './types';
import HomeScreen from '@/features/home/screens/HomeScreen';
import SearchScreen from '@/features/search/screens/SearchScreen';
import FilterScreen from '@/features/filter/screens/FilterScreen';
import ProfileScreen from '@/features/profile/screens/ProfileScreen';
import { Icon } from '@/components/common';
import { SvgIcons } from '@/assets/svg-component';

const BottomTab = createBottomTabNavigator<MainTabParamList>();

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

const useNativeLiquidGlassTabs =
  Platform.OS === 'ios' && isLiquidGlassSupported;

interface TabBarIconOptions {
  focused: boolean;
  sfSymbolIcon: SFSymbol;
  sfSymbolIconActive: SFSymbol;
  icon: keyof typeof SvgIcons;
  iconActive: keyof typeof SvgIcons;
}

const getTabBarIcon = ({
  focused,
  sfSymbolIcon,
  sfSymbolIconActive,
  icon,
  iconActive,
}: TabBarIconOptions) => {
  if (useNativeLiquidGlassTabs) {
    return {
      type: 'sfSymbol' as const,
      name: focused ? sfSymbolIconActive : sfSymbolIcon,
    };
  }

  return (
    <Icon
      icon={focused ? iconActive : icon}
      color={focused ? Colors.primary : Colors.icon}
    />
  )
}

export default function MainNavigator() {
  // const insets = useSafeAreaInsets();
  // const paddingBottom = Math.max(insets.bottom, Platform.OS === 'android' ? 12 : 20);
  // const useNativeLiquidGlassTabs =
  //   Platform.OS === 'ios' && isLiquidGlassSupported;

  return (
    <BottomTab.Navigator
      initialRouteName="Home"
      implementation={useNativeLiquidGlassTabs ? 'native' : 'custom'}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.icon,
      }}
    >
      <BottomTab.Screen
        name='Home'
        component={HomeScreen}
        options={{
          tabBarLabel: 'Trang chủ',
          tabBarIcon: ({ focused }) => getTabBarIcon({
            focused,
            sfSymbolIcon: 'house',
            sfSymbolIconActive: 'house',
            icon: 'HomeLight',
            iconActive: 'HomeLight',
          }),
        }}
      />
      <BottomTab.Screen
        name='Search'
        component={SearchScreen}
        options={{
          tabBarLabel: 'Tìm kiếm',
          tabBarIcon: ({ focused }) => getTabBarIcon({
            focused,
            sfSymbolIcon: 'magnifyingglass',
            sfSymbolIconActive: 'magnifyingglass',
            icon: 'SearchLight',
            iconActive: 'SearchLight',
          }),
        }}
      />
      <BottomTab.Screen
        name='Filter'
        component={FilterScreen}
        options={{
          tabBarLabel: 'Khám phá',
          tabBarIcon: ({ focused }) => getTabBarIcon({
            focused,
            sfSymbolIcon: 'sparkles',
            sfSymbolIconActive: 'sparkles',
            icon: 'RocketLight',
            iconActive: 'RocketLight',
          }),
        }}
      />
      <BottomTab.Screen
        name='Profile'
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Tài khoản',
          tabBarIcon: ({ focused }) => getTabBarIcon({
            focused,
            sfSymbolIcon: 'person',
            sfSymbolIconActive: 'person',
            icon: 'UserLight',
            iconActive: 'UserLight',
          }),
        }}
      />
    </BottomTab.Navigator>
  );
}
