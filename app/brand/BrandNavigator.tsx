import React from 'react';
import {
  createNativeStackNavigator,
  type NativeStackNavigationProp,
} from '@react-navigation/native-stack';
import { BrandBottomNavigator } from './navigator';
import { RouteProp } from '@react-navigation/native';

interface BrandNavigatorProps {
  redirectUrl?: string;
  isRefreshing?: boolean;
  onRetryPress?: () => void;
}

export type BrandStackParamList = {
  BrandHome: undefined;
  BrandBottomNavigator: undefined;
  BrandAppointmentScreen: undefined;
  BrandBookingScreen: undefined;
  BrandHomeScreen: undefined;
  BrandLoginScreen: undefined;
  BrandRegisterScreen: undefined;
  BrandServiceDetailScreen: undefined;
  BrandProfileScreen: undefined;
};

export type NavigateProps<T extends keyof BrandStackParamList> = {
  navigation: NativeStackNavigationProp<BrandStackParamList, T>;
  route: RouteProp<BrandStackParamList, T>;
};

const Stack = createNativeStackNavigator<BrandStackParamList>();

export function BrandNavigator(_props: BrandNavigatorProps) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        inactiveBehavior: 'none',
      }}
    >
      <Stack.Screen name='BrandBottomNavigator' component={BrandBottomNavigator} />
      {/* <Stack.Screen name="BrandHome">
        {() => (
          <BrandScreen
            isRefreshing={isRefreshing}
            onRetryPress={onRetryPress}
            redirectUrl={redirectUrl}
          />
        )}
      </Stack.Screen> */}
    </Stack.Navigator>
  );
}
