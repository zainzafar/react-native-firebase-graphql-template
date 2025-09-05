import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../../theme/ThemeProvider';
import { useAppSelector } from '../../../store/hooks';
import { selectUserPermissions } from '../../../features/auth/selectors';
import { useQuery, useMutation } from '@apollo/client/react';
import { Body, Card, PermissionList } from '../../../components';
import { useRoute } from '@react-navigation/native';
import {
  QUERY_ADMIN_GET_ROLE,
  QUERY_ADMIN_LIST_GRANTABLE_PERMISSIONS,
  MUTATION_ADMIN_SET_ROLE_PERMISSION,
} from '../../../graphql/operations';

type Role = {
  id: string;
  name: string;
  permissions: { id: string; name: string; description?: string }[];
};

type Permission = {
  id: string;
  name: string;
  description?: string;
};

export default function AdminEditRolePermissions() {
  const { colors } = useTheme();
  const route = useRoute<any>();
  const permissions = useAppSelector(selectUserPermissions) as string[];
  
  const roleId = route.params?.roleId;
  
  // Permission checks
  const canUpdateRoles = permissions.includes('ADMIN_ROLES_UPDATE');
  const canViewPermissions = permissions.includes('ADMIN_PERMISSIONS_VIEW');
  
  // State
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);

  // Queries
  const { data: roleData, loading: roleLoading } = useQuery<{ adminGetRole: Role }>(
    QUERY_ADMIN_GET_ROLE,
    { 
      variables: { id: roleId },
      skip: !roleId 
    }
  );

  const { data: permissionsData } = useQuery<{ adminListAssignablePermissions: Permission[] }>(
    QUERY_ADMIN_LIST_GRANTABLE_PERMISSIONS,
    { skip: !canViewPermissions }
  );

  // Mutations
  const [setRolePermission] = useMutation(MUTATION_ADMIN_SET_ROLE_PERMISSION, {
    refetchQueries: [
      { query: QUERY_ADMIN_GET_ROLE, variables: { id: roleId } },
    ],
  });

  const role = roleData?.adminGetRole;
  const allPermissions = permissionsData?.adminListAssignablePermissions ?? [];

  // Initialize role permissions when role data loads
  useEffect(() => {
    if (role) {
      setRolePermissions(role.permissions.map(p => p.id));
    }
  }, [role]);

  const handleTogglePermission = async (permissionId: string, enabled: boolean) => {
    // Optimistically update local state first
    if (enabled) {
      setRolePermissions(prev => [...prev, permissionId]);
    } else {
      setRolePermissions(prev => prev.filter(p => p !== permissionId));
    }
    
    try {
      await setRolePermission({ 
        variables: { 
          roleId, 
          permissionId, 
          enabled 
        } 
      });
      
      // No need to refetch since we're managing local state
    } catch (error: any) {
      // Revert local state on error
      if (enabled) {
        setRolePermissions(prev => prev.filter(p => p !== permissionId));
      } else {
        setRolePermissions(prev => [...prev, permissionId]);
      }
      
      console.error('Failed to toggle permission:', error);
    }
  };

  if (roleLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Card style={styles.loadingCard}>
          <Body style={{ color: colors.mutedText, textAlign: 'center' }}>Loading role permissions...</Body>
        </Card>
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {allPermissions.length === 0 ? (
          <Card style={styles.emptyCard}>
            <View style={styles.emptyContainer}>
              <Body style={[styles.emptyText, { color: colors.mutedText }]}>
                No permissions are available to assign to this role
              </Body>
            </View>
          </Card>
        ) : (
          <Card style={styles.mainCard}>
            <PermissionList
              permissions={allPermissions}
              selectedPermissions={rolePermissions}
              onPermissionToggle={handleTogglePermission}
              canEnable={Object.fromEntries(allPermissions.map(p => [p.id, canUpdateRoles]))}
              canDisable={Object.fromEntries(allPermissions.map(p => [p.id, canUpdateRoles]))}
              showDescriptions={true}
              showNames={false}
            />
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 4, paddingVertical: 12 },
  loadingCard: { marginTop: 32, paddingVertical: 32 },
  errorCard: { marginTop: 32, paddingVertical: 32 },
  emptyCard: { margin: 8, marginBottom: 16 },
  emptyContainer: { padding: 32, alignItems: 'center' },
  emptyText: { fontSize: 16, textAlign: 'center' },
  mainCard: {
    margin: 8,
  },
});
