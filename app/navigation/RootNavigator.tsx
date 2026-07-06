import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import MainNavigator from './MainNavigator';
import MovieDetailScreen from '@/features/movie/screens/MovieDetailScreen';
import WatchScreen from '@/features/player/screens/WatchScreen';
import SettingScreen from '@/features/settings/screens/SettingScreen';
import ForgotPasswordScreen from '@/features/auth/screens/ForgotPasswordScreen';
import LoginScreen from '@/features/auth/screens/LoginScreen';
import RegisterScreen from '@/features/auth/screens/RegisterScreen';
import ResetPasswordScreen from '@/features/auth/screens/ResetPasswordScreen';
import HistoryScreen from '@/features/history/screens/HistoryScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        inactiveBehavior: 'none',
      }}
    >
      <Stack.Screen
        name="RootTabs"
        component={MainNavigator}
        options={{ animation: 'none' }}
      />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="ResetPassword"
        component={ResetPasswordScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="History"
        component={HistoryScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="MovieDetail"
        component={MovieDetailScreen}
        options={{ animation: 'slide_from_right' }}
      />

      <Stack.Screen
        name="Setting"
        component={SettingScreen}
        options={{ animation: 'slide_from_right' }}
      />

      <Stack.Screen
        name="Watch"
        component={WatchScreen}
        options={{
          headerShown: false,
          // iOS native-stack can keep the previous portrait frame during a
          // fade transition into a landscape-only screen, which breaks the
          // player layout. Disable the transition so the screen mounts with
          // the correct bounds immediately.
          animation: 'none',
          autoHideHomeIndicator: true,
        }}
      />
    </Stack.Navigator>
  );
}
