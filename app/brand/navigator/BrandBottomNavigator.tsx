/* eslint-disable react/no-unstable-nested-components */
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React, { FC } from "react";
import { BrandStackParamList } from "../BrandNavigator";
import { BrandAppointmentScreen, BrandHomeScreen, BrandProfileScreen } from "../screen";
import { Icon } from "@/components/common";
import { Colors, Spacing, Typography } from "@/config/theme";

const Tab = createBottomTabNavigator<BrandStackParamList>();

export const BrandBottomNavigator: FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle:{
          paddingTop: Spacing.sm
        },
        tabBarActiveTintColor: Colors.primaryLight,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: Typography.fontWeight.medium,
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="BrandHomeScreen"
        component={BrandHomeScreen}
        options={{
          tabBarLabel: 'Trang chủ',
          tabBarIcon: ({ color }) => <Icon icon="Home" color={color} />
        }}
      />
      <Tab.Screen
        name="BrandAppointmentScreen"
        component={BrandAppointmentScreen}
        options={{
          tabBarLabel: 'Lịch hẹn',
          tabBarIcon: ({ color }) => <Icon icon="Calendar" color={color} />
        }}
      />
      <Tab.Screen
        name="BrandProfileScreen"
        component={BrandProfileScreen}
        options={{
          tabBarLabel: 'Cá nhân',
          tabBarIcon: ({ color }) => <Icon icon="User2" color={color} />
        }}
      />
    </Tab.Navigator>
  )
}