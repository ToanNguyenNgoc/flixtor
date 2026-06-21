/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography } from '@/config/theme';
import type { MainTabParamList } from './types';
import HomeScreen from '@/features/home/screens/HomeScreen';
import SearchScreen from '@/features/search/screens/SearchScreen';
import FilterScreen from '@/features/filter/screens/FilterScreen';
import FavoritesScreen from '@/features/favorites/screens/FavoritesScreen';
import HistoryScreen from '@/features/history/screens/HistoryScreen';
import ProfileScreen from '@/features/profile/screens/ProfileScreen';
import { Icon } from '@/components/common';

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainNavigator() {
  const insets = useSafeAreaInsets();
  const paddingBottom = Math.max(insets.bottom, Platform.OS === 'android' ? 12 : 20);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.tabBackground,
          borderTopColor: Colors.border,
          borderTopWidth: 0.5,
          height: 60 + paddingBottom,
          paddingBottom: paddingBottom,
          paddingTop: 10,
          elevation: 0,
        },
        tabBarShowLabel: true,
        tabBarActiveTintColor: Colors.white,
        tabBarInactiveTintColor: Colors.tabInactive,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: Typography.fontWeight.medium,
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ 
          tabBarLabel: 'Trang chủ',
          tabBarIcon: ({ color }) => <Icon icon='HomeLight' color={color} size={24} /> 
        }} 
      />
      <Tab.Screen 
        name="Search" 
        component={SearchScreen} 
        options={{ 
          tabBarLabel: 'Tìm kiếm',
          tabBarIcon: ({ color }) => <Icon icon='SearchLight' color={color} size={24} /> 
        }} 
      />
      <Tab.Screen name="Filter" component={FilterScreen} options={{ tabBarLabel: 'Khám phá', tabBarIcon: ({ color }) => <Icon icon='RocketLight' color={color} size={24} /> }} />
      {/* <Tab.Screen name="Favorites" component={FavoritesScreen} options={{ tabBarLabel: 'Yêu thích', tabBarIcon: ({ color }) => <Icon icon='Heart' color={color} size={24} /> }} /> */}
      {/* <Tab.Screen name="History" component={HistoryScreen} options={{ tabBarLabel: 'Lịch sử', tabBarIcon: ({ color }) => <Icon icon='ClockLight' color={color} size={24} /> }} /> */}
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ 
          tabBarLabel: 'Tài khoản',
          tabBarIcon: ({ color }) => <Icon icon='UserLight' color={color} size={24} /> 
        }} 
      />
    </Tab.Navigator>
  );
}
