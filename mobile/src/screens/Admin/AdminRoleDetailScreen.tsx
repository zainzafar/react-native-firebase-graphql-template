import React from 'react';
import { ActivityIndicator } from 'react-native';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { useAppSelector } from '../../store/hooks';
import { selectUserPermissions } from '../../features/auth/selectors';
import { useQuery } from '@apollo/client/react';
import { Body, Card, NavigationCard } from '../../components';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { useRoute, useNavigation } from '@react-navigation/native';
import {
  QUERY_ADMIN_GET_ROLE,
} from '../../graphql/operations';

type Role = {
  id: string;
  name: string;
  description?: string;
  permissions: { id: string; name: string; description?: string }[];
  users: { 
    id: string; 
    email: string; 
    displayName?: string;
    phoneNumber?: string;
    identities?: { providerId: string }[];
  }[];
};

export default function AdminRoleDetailScreen() {
  const { colors } = useTheme();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const permissions = useAppSelector(selectUserPermissions) as string[];
  
  const roleId = route.params?.roleId;
  
  // Permission checks
  const canViewRoles = permissions.includes('ADMIN_ROLES_VIEW');
  const canUpdateRoles = permissions.includes('ADMIN_ROLES_UPDATE');
  const canDeleteRoles = permissions.includes('ADMIN_ROLES_DELETE');
  const canViewPermissions = permissions.includes('ADMIN_PERMISSIONS_VIEW');
  // For viewing users in a specific role, use ADMIN_ROLES_VIEW since it's role-specific
  const canViewRoleUsers = permissions.includes('ADMIN_ROLES_VIEW');
  const canViewRoleGrants = permissions.includes('ADMIN_ROLE_GRANT_RULES_VIEW');
  


  // Queries
  const { data: roleData, loading: roleLoading } = useQuery<{ adminGetRole: Role }>(
    QUERY_ADMIN_GET_ROLE,
    { 
      variables: { id: roleId },
      skip: !roleId || !canViewRoles 
    }
  );



  const role = roleData?.adminGetRole;



  if (roleLoading) {
    return (
      <View style={[styles.container, styles.paddedContainer, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Body style={[styles.loadingText, { color: colors.mutedText }]}>Loading role details...</Body>
        </View>
      </View>
    );
  }

  if (!role) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Card style={styles.errorCard}>
          <Body style={{ color: colors.mutedText, textAlign: 'center' }}>Role not found</Body>
        </Card>
      </View>
    );
  }



  return (
    <View style={[styles.container, styles.paddedContainer, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Role Header */}
        <Card style={styles.headerCard}>
          <Body style={[styles.roleTitle, { color: colors.text }]}>{role.name}</Body>
          {role.description && (
            <Body style={[styles.roleDescription, { color: colors.mutedText }]}>
              {role.description}
            </Body>
          )}
          <View style={styles.roleStats}>
            <View style={styles.statItem}>
              <FontAwesome6 name="users" iconStyle="solid" size={12} color={colors.mutedText} />
              <Body style={[styles.statText, { color: colors.mutedText }]}>
                {role.users.length} users
              </Body>
            </View>
            <View style={styles.statItem}>
              <FontAwesome6 name="key" iconStyle="solid" size={12} color={colors.mutedText} />
              <Body style={[styles.statText, { color: colors.mutedText }]}>
                {role.permissions.length} permissions
              </Body>
            </View>
          </View>
        </Card>

        {/* Navigation Cards */}
        <View style={styles.navigationCards}>
          {/* Update Basic Information */}
          <NavigationCard
            title="Update Basic Information"
            description="Update the name and description of this role"
            icon="edit"
            onPress={() => navigation.navigate('AdminEditRoleBasicInfo', { roleId: role.id })}
            disabled={!canUpdateRoles}
            iconColor={colors.primary}
            iconBackgroundColor={`${colors.primary}20`}
          />

          {/* Manage Permissions */}
          <NavigationCard
            title="Manage Permissions"
            description="Manage assigned permissions to this role"
            icon="key"
            onPress={() => navigation.navigate('AdminEditRolePermissions', { roleId: role.id })}
            disabled={!canViewPermissions}
            iconColor={colors.primary}
            iconBackgroundColor={`${colors.primary}20`}
          />

          {/* View Users */}
          <NavigationCard
            title="View Users"
            description="View users currently assigned to this role"
            icon="users"
            onPress={() => navigation.navigate('AdminViewRoleUsers', { roleId: role.id })}
            disabled={!canViewRoleUsers}
            iconColor={colors.primary}
            iconBackgroundColor={`${colors.primary}20`}
          />

          {/* Manage Delegation Rules */}
          <NavigationCard
            title="Manage Delegation Rules"
            description="Manage who can assign/revoke this role and related permissions"
            icon="sitemap"
            onPress={() => navigation.navigate('AdminManageRoleDelegation', { roleId: role.id })}
            disabled={!canViewRoleGrants}
            iconColor={colors.primary}
            iconBackgroundColor={`${colors.primary}20`}
          />

          {/* Delete Role */}
          <NavigationCard
            title="Delete Role"
            description="Delete this role. All users will lose access granted by this role."
            icon="trash"
            onPress={() => navigation.navigate('AdminDeleteRole', { roleId: role.id })}
            disabled={!canDeleteRoles}
            iconColor="#DC2626"
            iconBackgroundColor="#DC262620"
          />
        </View>


      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  paddedContainer: { paddingHorizontal: 20, paddingVertical: 20 },
  content: { flex: 1 },
  headerCard: { padding: 20, marginBottom: 16 },
  roleTitle: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  roleDescription: { fontSize: 16, lineHeight: 22, marginBottom: 16 },
  roleStats: { 
    flexDirection: 'row', 
    gap: 16 
  },
  statItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6 
  },
  statText: { fontSize: 14 },
  navigationCards: { gap: 12 },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    gap: 16
  },
  loadingText: { 
    fontSize: 16, 
    textAlign: 'center' 
  },
  errorCard: { 
    marginTop: 16, 
    paddingVertical: 16 
  },

});
