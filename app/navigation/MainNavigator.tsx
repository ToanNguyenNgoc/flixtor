import React, { memo } from 'react';
import {
  createBottomTabNavigator,
  type BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import { CommonActions } from '@react-navigation/native';
import { isLiquidGlassSupported } from '@callstack/liquid-glass';
import type { SFSymbol } from 'sf-symbols-typescript';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BorderRadius,
  Colors,
  Spacing,
  Typography,
} from '@/config/theme';
import type { MainTabParamList } from './types';
import HomeScreen from '@/features/home/screens/HomeScreen';
import SearchScreen from '@/features/search/screens/SearchScreen';
import FilterScreen from '@/features/filter/screens/FilterScreen';
import ProfileScreen from '@/features/profile/screens/ProfileScreen';
import { Icon } from '@/components/common';
import { SvgIcons } from '@/assets/svg-component';

const BottomTab = createBottomTabNavigator<MainTabParamList>();

type VisibleTabRouteName = 'Home' | 'Search' | 'Filter' | 'Profile';

interface TabConfig {
  label: string;
  sfSymbol: SFSymbol;
  icon: keyof typeof SvgIcons;
  iconActive: keyof typeof SvgIcons;
}

const TAB_CONFIG: Record<VisibleTabRouteName, TabConfig> = {
  Home: {
    label: 'Trang chủ',
    sfSymbol: 'house',
    icon: 'HomeLight',
    iconActive: 'HomeLight',
  },
  Search: {
    label: 'Tìm kiếm',
    sfSymbol: 'magnifyingglass',
    icon: 'SearchLight',
    iconActive: 'SearchLight',
  },
  Filter: {
    label: 'Khám phá',
    sfSymbol: 'sparkles',
    icon: 'RocketLight',
    iconActive: 'RocketLight',
  },
  Profile: {
    label: 'Tài khoản',
    sfSymbol: 'person',
    icon: 'UserLight',
    iconActive: 'UserLight',
  },
};

const useNativeLiquidGlassTabs =
  Platform.OS === 'ios' && isLiquidGlassSupported;

function getTabLabel(routeName: VisibleTabRouteName) {
  return TAB_CONFIG[routeName].label;
}

function getTabBarIcon(routeName: VisibleTabRouteName, focused: boolean) {
  const config = TAB_CONFIG[routeName];

  if (useNativeLiquidGlassTabs) {
    return {
      type: 'sfSymbol' as const,
      name: config.sfSymbol,
    };
  }

  return (
    <Icon
      icon={focused ? config.iconActive : config.icon}
      color={focused ? Colors.primary : Colors.icon}
      size={24}
    />
  );
}

function getAndroidTabBarIcon(routeName: VisibleTabRouteName, focused: boolean) {
  const config = TAB_CONFIG[routeName];

  return (
    <Icon
      icon={focused ? config.iconActive : config.icon}
      color={focused ? Colors.primary : Colors.icon}
      size={24}
    />
  );
}

const AndroidTabBar = memo(function AndroidBottomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.androidTabBar,
        { paddingBottom: Math.max(insets.bottom, Spacing.sm) },
      ]}
    >
      {state.routes.map((route, index) => {
        const routeName = route.name as VisibleTabRouteName;
        const isFocused = state.index === index;
        const options = descriptors[route.key]?.options;
        const label =
          typeof options?.tabBarLabel === 'string'
            ? options.tabBarLabel
            : typeof options?.title === 'string'
              ? options.title
              : getTabLabel(routeName);

        const icon = getAndroidTabBarIcon(routeName, isFocused);

        const handlePress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (isFocused || event.defaultPrevented) {
            return;
          }

          navigation.dispatch({
            ...CommonActions.navigate(route.name, route.params),
            target: state.key,
          });
        };

        const handleLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options?.tabBarAccessibilityLabel}
            testID={options?.tabBarButtonTestID}
            onPress={handlePress}
            onLongPress={handleLongPress}
            android_ripple={{ color: 'rgba(255,255,255,0.10)', borderless: false }}
            style={[styles.androidTabButton, isFocused && styles.androidTabButtonActive]}
          >
            <View style={styles.androidTabIcon}>{icon}</View>
            <Text
              style={[
                styles.androidTabLabel,
                isFocused
                  ? styles.androidTabLabelActive
                  : styles.androidTabLabelInactive,
              ]}
              numberOfLines={1}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
});

function renderAndroidTabBar(props: BottomTabBarProps) {
  return <AndroidTabBar {...props} />;
}

function getScreenOptions(routeName: VisibleTabRouteName) {
  return {
    tabBarLabel: getTabLabel(routeName),
    tabBarIcon: ({ focused }: { focused: boolean }) =>
      getTabBarIcon(routeName, focused),
  };
}

export default function MainNavigator() {
  const isAndroid = Platform.OS === 'android';

  return (
    <BottomTab.Navigator
      initialRouteName="Home"
      implementation={isAndroid ? 'custom' : useNativeLiquidGlassTabs ? 'native' : 'custom'}
      tabBar={isAndroid ? renderAndroidTabBar : undefined}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: isAndroid,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.icon,
      }}
    >
      <BottomTab.Screen
        name="Home"
        component={HomeScreen}
        options={getScreenOptions('Home')}
      />
      <BottomTab.Screen
        name="Search"
        component={SearchScreen}
        options={getScreenOptions('Search')}
      />
      <BottomTab.Screen
        name="Filter"
        component={FilterScreen}
        options={getScreenOptions('Filter')}
      />
      <BottomTab.Screen
        name="Profile"
        component={ProfileScreen}
        options={getScreenOptions('Profile')}
      />
    </BottomTab.Navigator>
  );
}

const styles = StyleSheet.create({
  androidTabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.base,
    backgroundColor: Colors.black,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  androidTabButton: {
    flex: 1,
    minHeight: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  androidTabButtonActive: {
    backgroundColor: Colors.backgroundElevated,
  },
  androidTabIcon: {
    marginBottom: 2,
  },
  androidTabLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  androidTabLabelActive: {
    color: Colors.primary,
  },
  androidTabLabelInactive: {
    color: Colors.icon,
  },
});
