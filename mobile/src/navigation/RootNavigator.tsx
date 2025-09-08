import React, { useEffect, useRef } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AccountScreen from '../screens/AccountScreen';
import AuthScreen from '../screens/AuthScreen';
import DebugScreen from '../screens/Admin/DebugScreen';
import AdminHomeScreen from '../screens/Admin/AdminHomeScreen';
import AdminManageUsersScreen from '../screens/Admin/Users/AdminManageUsersScreen';
import AdminUserDetailScreen from '../screens/Admin/Users/AdminUserDetailScreen';
import AdminEditUserBasicInfoScreen from '../screens/Admin/Users/AdminEditUserBasicInfoScreen';
import AdminEditUserSecurityScreen from '../screens/Admin/Users/AdminEditUserSecurityScreen';
import AdminDeleteUserScreen from '../screens/Admin/Users/AdminDeleteUserScreen';
import AdminEditUserAccessScreen from '../screens/Admin/Users/AdminEditUserAccessScreen';
import AdminRolesScreen from '../screens/Admin/Roles/AdminRolesScreen';
import AdminRoleDetailScreen from '../screens/Admin/Roles/AdminRoleDetailScreen';
import AdminEditRoleBasicInfoScreen from '../screens/Admin/Roles/AdminEditRoleBasicInfoScreen';
import AdminEditRolePermissionsScreen from '../screens/Admin/Roles/AdminEditRolePermissionsScreen';
import AdminViewRoleUsersScreen from '../screens/Admin/Roles/AdminViewRoleUsersScreen';
import AdminManageRoleDelegationScreen from '../screens/Admin/Delegation/AdminManageRoleDelegationScreen';
import AdminRoleGrantRulesScreen from '../screens/Admin/Delegation/AdminRoleGrantRulesScreen';
import AdminPermissionGrantRulesScreen from '../screens/Admin/Delegation/AdminPermissionGrantRulesScreen';
import AdminAddRoleGrantRuleScreen from '../screens/Admin/Delegation/AdminAddRoleGrantRuleScreen';
import AdminAddPermissionGrantRuleScreen from '../screens/Admin/Delegation/AdminAddPermissionGrantRuleScreen';
import AdminCreateRoleScreen from '../screens/Admin/Roles/AdminCreateRoleScreen';
import AdminDeleteRoleScreen from '../screens/Admin/Roles/AdminDeleteRoleScreen';
import AdminAppReleasesScreen from '../screens/Admin/AppReleases/AdminAppReleasesScreen';
import AdminCreateAppReleaseScreen from '../screens/Admin/AppReleases/AdminCreateAppReleaseScreen';
import AdminEditAppReleaseScreen from '../screens/Admin/AppReleases/AdminEditAppReleaseScreen';

import { useAppSelector } from '../store/hooks';
import { selectAuthInitialized, selectIsAuthenticated } from '../features/auth/selectors';
import { usePermissions } from '../features/auth/hooks';
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
  const { canAccessAdmin } = usePermissions();
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
      {canAccessAdmin && (
        <>
          <Stack.Screen name="AdminHome" component={AdminHomeScreen} options={{ headerShown: true, title: 'Admin' }} />
          <Stack.Screen name="AdminManageUsers" component={AdminManageUsersScreen} options={{ headerShown: true, title: 'Manage Users' }} />
          <Stack.Screen name="AdminUserDetail" component={AdminUserDetailScreen} options={{ headerShown: true, title: 'User Details' }} />
          <Stack.Screen name="AdminEditUserBasicInfo" component={AdminEditUserBasicInfoScreen} options={{ headerShown: true, title: 'Basic Information' }} />
          <Stack.Screen name="AdminEditUserSecurity" component={AdminEditUserSecurityScreen} options={{ headerShown: true, title: 'Security' }} />
          <Stack.Screen name="AdminEditUserAccess" component={AdminEditUserAccessScreen} options={{ headerShown: true, title: 'Roles & Permissions' }} />
          <Stack.Screen name="AdminDeleteUser" component={AdminDeleteUserScreen} options={{ headerShown: true, title: 'Delete User' }} />
          <Stack.Screen name="AdminRoles" component={AdminRolesScreen} options={{ headerShown: true, title: 'Roles & Permissions' }} />
          <Stack.Screen name="AdminCreateRole" component={AdminCreateRoleScreen} options={{ headerShown: true, title: 'Create Role' }} />
          <Stack.Screen name="AdminRoleDetail" component={AdminRoleDetailScreen} options={{ headerShown: true, title: 'Role Details' }} />
          <Stack.Screen name="AdminEditRoleBasicInfo" component={AdminEditRoleBasicInfoScreen} options={{ headerShown: true, title: 'Edit Role' }} />
          <Stack.Screen name="AdminEditRolePermissions" component={AdminEditRolePermissionsScreen} options={{ headerShown: true, title: 'Role Permissions' }} />
          <Stack.Screen name="AdminViewRoleUsers" component={AdminViewRoleUsersScreen} options={{ headerShown: true, title: 'Role Users' }} />
          <Stack.Screen name="AdminManageRoleDelegation" component={AdminManageRoleDelegationScreen} options={{ headerShown: true, title: 'Role Delegation' }} />
          <Stack.Screen name="AdminRoleGrantRules" component={AdminRoleGrantRulesScreen} options={{ headerShown: true, title: 'Role Grant Rules' }} />
          <Stack.Screen name="AdminPermissionGrantRules" component={AdminPermissionGrantRulesScreen} options={{ headerShown: true, title: 'Permission Grant Rules' }} />
          <Stack.Screen name="AdminAddRoleGrantRule" component={AdminAddRoleGrantRuleScreen} options={{ headerShown: true, title: 'Add Role Grant Rule' }} />
          <Stack.Screen name="AdminAddPermissionGrantRule" component={AdminAddPermissionGrantRuleScreen} options={{ headerShown: true, title: 'Add Permission Grant Rule' }} />
          <Stack.Screen name="AdminDeleteRole" component={AdminDeleteRoleScreen} options={{ headerShown: true, title: 'Delete Role' }} />
          <Stack.Screen name="AdminAppReleases" component={AdminAppReleasesScreen} options={{ headerShown: true, title: 'App Releases' }} />
          <Stack.Screen name="AdminCreateAppRelease" component={AdminCreateAppReleaseScreen} options={{ headerShown: true, title: 'Create Release Rule' }} />
          <Stack.Screen name="AdminEditAppRelease" component={AdminEditAppReleaseScreen} options={{ headerShown: true, title: 'Edit Release Rule' }} />
          <Stack.Screen name="AdminDebug" component={DebugScreen} options={{ headerShown: true, title: 'Debug' }} />
        </>
      )}
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
      <View style={[{ backgroundColor: colors.background }, styles.loadingContainer ]}>
        <Animated.View style={[{ transform: [{ rotate: spin }] }, styles.loader]}>
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


