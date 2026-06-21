import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BrandScreen from './BrandScreen';
import { BrandBottomNavigator } from './navigator';
import {StackNavigationProp} from '@react-navigation/stack';
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
  navigation: StackNavigationProp<BrandStackParamList, T>;
  route: RouteProp<BrandStackParamList, T>;
};


const Stack = createNativeStackNavigator<BrandStackParamList>();

export function BrandNavigator({
  redirectUrl,
  isRefreshing = false,
  onRetryPress,
}: BrandNavigatorProps) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
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
