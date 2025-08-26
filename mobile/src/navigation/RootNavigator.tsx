import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AuthScreen from '../screens/AuthScreen';
import DebugScreen from '../screens/DebugScreen';

import { useAuth } from '../auth/AuthProvider';
import { Text, StyleSheet } from 'react-native';
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
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarIcon: SettingsTabIcon }} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { user, initializing } = useAuth();
  const { colors } = useTheme();

  if (initializing) {
    return <Text style={styles.loading}>Loading...</Text>;
  }

  return (
    <Stack.Navigator
      key={user ? 'in' : 'out'}
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: colors.card },
        headerTitleStyle: { color: colors.text },
        headerTintColor: colors.text,
        headerShadowVisible: true,
      }}
    >
      {user ? (
        <>
          <Stack.Screen name="Tabs" component={Tabs} />
          <Stack.Screen name="Debug" component={DebugScreen} options={{ headerShown: true, title: 'Debug' }} />
        </>
      ) : (
        <>
          <Stack.Screen name="Auth" component={AuthScreen} />
          <Stack.Screen name="Debug" component={DebugScreen} options={{ headerShown: true, title: 'Debug' }} />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loading: { padding: 24 },
});


