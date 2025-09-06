import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Body, Card, Screen } from '../../components';
import { useTheme } from '../../theme/ThemeProvider';
import { useNavigation } from '@react-navigation/native';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { usePermissions } from '../../features/auth/hooks';

export default function AdminHomeScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();

  // Permission checks for user management
  const { canViewUsers, canSearchUsers, canUpdateUserProfile, canUpdateUserPassword, canDeleteUsers, canImpersonateUsers, canAccessDebug, canViewRoles, canViewPermissions } = usePermissions();

  // Show Manage Users if user has any user management permission
  const canManageUsers = canViewUsers || canSearchUsers || canUpdateUserProfile || canUpdateUserPassword || canDeleteUsers || canImpersonateUsers;

  // Show Roles & Permissions if user can view roles or permissions
  const canManageRolesAndPermissions = canViewRoles || canViewPermissions;

  return (
    <Screen contentContainerStyle={styles.container}>
      {canManageUsers && (
        <Card style={styles.card}> 
          <Pressable onPress={() => navigation.navigate('AdminManageUsers')} style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <FontAwesome6 name="users" iconStyle="solid" size={20} color={colors.text} />
              <Body style={styles.menuItemText}>Manage Users</Body>
            </View>
            <FontAwesome6 name="chevron-right" iconStyle="solid" size={16} color={colors.mutedText} />
          </Pressable>
        </Card>
      )}

      {canManageRolesAndPermissions && (
        <Card style={styles.card}> 
          <Pressable onPress={() => navigation.navigate('AdminRoles')} style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <FontAwesome6 name="shield-halved" iconStyle="solid" size={20} color={colors.text} />
              <Body style={styles.menuItemText}>Roles & Permissions</Body>
            </View>
            <FontAwesome6 name="chevron-right" iconStyle="solid" size={16} color={colors.mutedText} />
          </Pressable>
        </Card>
      )}


      {canAccessDebug && (
        <Card style={styles.card}> 
          <Pressable onPress={() => navigation.navigate('AdminDebug')} style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <FontAwesome6 name="wrench" iconStyle="solid" size={20} color={colors.text} />
              <Body style={styles.menuItemText}>Debug</Body>
            </View>
            <FontAwesome6 name="chevron-right" iconStyle="solid" size={16} color={colors.mutedText} />
          </Pressable>
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16, flex: 1 },
  card: { padding: 12 },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, paddingHorizontal: 4 },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  menuItemText: { fontSize: 16, fontWeight: '500' },
});


