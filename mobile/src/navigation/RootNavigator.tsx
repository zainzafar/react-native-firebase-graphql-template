import React, { useEffect, useRef } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AccountScreen from '../screens/AccountScreen';
import AuthScreen from '../screens/AuthScreen';
import DebugScreen from '../screens/DebugScreen';
import AdminHomeScreen from '../screens/Admin/AdminHomeScreen';
import AdminManageUsersScreen from '../screens/Admin/AdminManageUsersScreen';
import AdminEditUserScreen from '../screens/Admin/AdminEditUserScreen';
import AdminDeleteUserScreen from '../screens/Admin/AdminDeleteUserScreen';

import { useAppSelector } from '../store/hooks';
import { selectAuthInitialized, selectIsAuthenticated } from '../features/auth/selectors';
import { View, StyleSheet, Animated } from 'react-native';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { useTheme } from '../theme/ThemeProvider';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const HomeTabIcon = ({ color, size }: { color: string; size?: number }) => (
  <FontAwesome6 name="house" iconStyle="solid" size={size ?? 22} color={color} />
);

const SettingsTabIcon = ({ color, size }: { color: string; size?: number }) => (
  <FontAwesome6 name="gear" iconStyle="solid" size={size ?? 22} color={color} />
);

function Tabs() {
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedText,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: HomeTabIcon }} />
      <Tab.Screen name="Settings" component={SettingsStack} options={{ tabBarIcon: SettingsTabIcon }} />
    </Tab.Navigator>
  );
}

function SettingsStack() {
  const { colors } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: colors.card },
        headerTitleStyle: { color: colors.text },
        headerTintColor: colors.text,
        headerShadowVisible: true,
      }}
    >
      <Stack.Screen name="SettingsHome" component={SettingsScreen} options={{ headerShown: true, title: 'Settings' }} />
      <Stack.Screen name="Account" component={AccountScreen} options={{ headerShown: true, title: 'Account' }} />
      {/* Admin screens */}
      <Stack.Screen name="AdminHome" component={AdminHomeScreen} options={{ headerShown: true, title: 'Admin' }} />
      <Stack.Screen name="AdminManageUsers" component={AdminManageUsersScreen} options={{ headerShown: true, title: 'Manage Users' }} />
      <Stack.Screen name="AdminEditUser" component={AdminEditUserScreen} options={{ headerShown: true, title: 'Edit User' }} />
      <Stack.Screen name="AdminDeleteUser" component={AdminDeleteUserScreen} options={{ headerShown: true, title: 'Delete User' }} />
      <Stack.Screen name="AdminDebug" component={DebugScreen} options={{ headerShown: true, title: 'Debug' }} />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const initialized = useAppSelector(selectAuthInitialized);
  const { colors } = useTheme();
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spin = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    );
    spin.start();
    return () => spin.stop();
  }, [spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!initialized) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Animated.View style={[styles.loader, { transform: [{ rotate: spin }] }]}>
          <FontAwesome6 name="spinner" iconStyle="solid" size={32} color={colors.primary} />
        </Animated.View>
      </View>
    );
  }

  return (
    <Stack.Navigator
      key={isAuthenticated ? 'in' : 'out'}
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: colors.card },
        headerTitleStyle: { color: colors.text },
        headerTintColor: colors.text,
        headerShadowVisible: true,

      }}
    >
      {isAuthenticated ? (
        <>
          <Stack.Screen name="Main" component={Tabs} />
        </>
      ) : (
        <>
          <Stack.Screen name="Auth" component={AuthScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  loader: {
    padding: 20,
  },
});


