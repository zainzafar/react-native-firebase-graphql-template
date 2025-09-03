import React, { useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { View, StyleSheet, ScrollView, Alert, TextInput, Switch, Pressable } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { useAppSelector } from '../../store/hooks';
import { selectUserPermissions } from '../../features/auth/selectors';
import { useQuery, useMutation } from '@apollo/client/react';
import { Body, Button, Card, UserIdentityRow } from '../../components';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { useRoute, useNavigation } from '@react-navigation/native';
import {
  QUERY_ADMIN_GET_ROLE,
  QUERY_ADMIN_LIST_GRANTABLE_PERMISSIONS,
  QUERY_ADMIN_LIST_MANAGEABLE_ROLES,
  MUTATION_ADMIN_UPDATE_ROLE,
  MUTATION_ADMIN_DELETE_ROLE,
  MUTATION_ADMIN_SET_ROLE_PERMISSION,
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

type Permission = {
  id: string;
  name: string;
  description?: string;
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
  
  // State
  const [editData, setEditData] = useState({ name: '', description: '' });
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveErrorFlash, setSaveErrorFlash] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteErrorFlash, setDeleteErrorFlash] = useState(false);

  // Queries
  const { data: roleData, loading: roleLoading } = useQuery<{ adminGetRole: Role }>(
    QUERY_ADMIN_GET_ROLE,
    { 
      variables: { id: roleId },
      skip: !roleId || !canViewRoles 
    }
  );

  const { data: permissionsData } = useQuery<{ adminListAssignablePermissions: Permission[] }>(
    QUERY_ADMIN_LIST_GRANTABLE_PERMISSIONS,
    { skip: !canViewPermissions }
  );

  // Mutations
  const [updateRole] = useMutation(MUTATION_ADMIN_UPDATE_ROLE, {
    refetchQueries: [
      { query: QUERY_ADMIN_GET_ROLE, variables: { id: roleId } },
      { query: QUERY_ADMIN_LIST_MANAGEABLE_ROLES },
      { query: QUERY_ADMIN_LIST_GRANTABLE_PERMISSIONS }
    ],
  });
  const [deleteRole] = useMutation(MUTATION_ADMIN_DELETE_ROLE, {
    refetchQueries: [
      { query: QUERY_ADMIN_LIST_MANAGEABLE_ROLES },
      { query: QUERY_ADMIN_LIST_GRANTABLE_PERMISSIONS }
    ],
  });
  const [setRolePermission] = useMutation(MUTATION_ADMIN_SET_ROLE_PERMISSION, {
    refetchQueries: [
      { query: QUERY_ADMIN_GET_ROLE, variables: { id: roleId } },
      { query: QUERY_ADMIN_LIST_MANAGEABLE_ROLES },
      { query: QUERY_ADMIN_LIST_GRANTABLE_PERMISSIONS }
    ],
  });

  const role = roleData?.adminGetRole;
  const allPermissions = permissionsData?.adminListAssignablePermissions ?? [];

  // Initialize edit data and role permissions when role data loads
  React.useEffect(() => {
    if (role) {
      setEditData({
        name: role.name,
        description: role.description || '',
      });
      setRolePermissions(role.permissions.map(p => p.name));
      setHasChanges(false);
    }
  }, [role]);

  // Check for changes
  React.useEffect(() => {
    if (role) {
      const hasNameChanged = editData.name !== role.name;
      const hasDescriptionChanged = editData.description !== (role.description || '');
      setHasChanges(hasNameChanged || hasDescriptionChanged);
    }
  }, [editData, role]);

  const handleSaveRole = async () => {
    try {
      setSaveLoading(true);
      setSaveSuccess(false);
      setSaveError(null);
      setSaveErrorFlash(false);
      await updateRole({ variables: { id: roleId, input: editData } });
      setSaveSuccess(true);
      setHasChanges(false);
    } catch (error: any) {
      console.error('Failed to update role:', error);
      setSaveError(error?.message || 'Failed to update role');
      setSaveErrorFlash(true);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleTogglePermission = async (permission: Permission, enabled: boolean) => {
    // Optimistically update local state first
    if (enabled) {
      setRolePermissions(prev => [...prev, permission.name]);
    } else {
      setRolePermissions(prev => prev.filter(p => p !== permission.name));
    }
    
    try {
      await setRolePermission({ 
        variables: { 
          roleId, 
          permissionId: permission.id, 
          enabled 
        } 
      });
      
      // No need to refetch since we're managing local state
    } catch (error: any) {
      // Revert local state on error
      if (enabled) {
        setRolePermissions(prev => prev.filter(p => p !== permission.name));
      } else {
        setRolePermissions(prev => [...prev, permission.name]);
      }
      
      console.error('Failed to toggle permission:', error);
      Alert.alert('Error', error?.message || 'Failed to update permission');
    }
  };

  const handleDeleteRole = async () => {
    if (!role) return;
    
    try {
      setDeleteLoading(true);
      setDeleteSuccess(false);
      setDeleteError(null);
      setDeleteErrorFlash(false);
      await deleteRole({ variables: { id: roleId } });
      setDeleteSuccess(true);
      // Navigate back after a short delay to show success state
      setTimeout(() => {
        navigation.goBack();
      }, 1000);
    } catch (error: any) {
      console.error('Failed to delete role:', error);
      setDeleteError(error?.message || 'Failed to delete role');
      setDeleteErrorFlash(true);
    } finally {
      setDeleteLoading(false);
    }
  };

  const renderSectionHeader = (title: string, icon: string) => (
    <View style={styles.sectionHeader}>
      <FontAwesome6 name={icon as any} iconStyle="solid" size={16} color={colors.primary} />
      <Body style={[styles.sectionTitle, { color: colors.text }]}>{title}</Body>
    </View>
  );

  const renderBasicInfo = () => (
    <Card style={styles.sectionCard}>
      
      <View style={styles.formSection}>
        <Body style={[styles.formLabel, { color: colors.text }]}>Role Name *</Body>
        <TextInput
          style={[styles.textInput, { 
            borderColor: colors.border, 
            color: colors.text,
            backgroundColor: colors.card 
          }]}
          placeholder="Enter role name..."
          placeholderTextColor={colors.mutedText}
          value={editData.name}
          onChangeText={(text) => setEditData(prev => ({ ...prev, name: text }))}
          editable={canUpdateRoles}
        />
      </View>
      
      <View style={styles.formSection}>
        <Body style={[styles.formLabel, { color: colors.text }]}>Description</Body>
        <TextInput
          style={[styles.textInput, { 
            borderColor: colors.border, 
            color: colors.text,
            backgroundColor: colors.card 
          }]}
          placeholder="Enter role description..."
          placeholderTextColor={colors.mutedText}
          value={editData.description}
          onChangeText={(text) => setEditData(prev => ({ ...prev, description: text }))}
          multiline
          numberOfLines={3}
          editable={canUpdateRoles}
        />
      </View>

      {canUpdateRoles && (
        <View style={styles.saveButtonContainer}>
          <Button
            title="Save Changes"
            onPress={handleSaveRole}
            disabled={!editData.name.trim() || !hasChanges}
            style={styles.saveButton}
            loading={saveLoading}
            success={saveSuccess}
            successText="Role Updated!"
            error={saveErrorFlash}
            errorText="Error saving"
            onSuccessComplete={() => { setSaveSuccess(false); setSaveErrorFlash(false); }}
          />
          {saveError && (
            <Body style={[styles.errorText, { color: colors.danger }]}>
              {saveError}
            </Body>
          )}
        </View>
      )}
    </Card>
  );

  const renderPermissions = () => {
    if (!canViewPermissions) return null;

    // Group permissions by category
    const userManagement: Permission[] = [];
    const system: Permission[] = [];
    
    allPermissions.forEach(p => {
      if (p.name.startsWith('ADMIN_DEBUG') || p.name.includes('ROLE') || p.name.includes('PERMISSION')) {
        system.push(p);
      } else {
        userManagement.push(p);
      }
    });

    const renderPermissionSection = (title: string, permissions: Permission[]) => {
      if (permissions.length === 0) return null;
      
      return (
        <View style={styles.permissionSection}>
          <Body style={{ color: colors.mutedText, marginBottom: 12 }}>{title}</Body>
          {title === 'System' && (
            <Body style={{ color: colors.mutedText, marginBottom: 12, fontSize: 12 }}>
              Advanced system permissions. Only permissions you can assign are shown.
            </Body>
          )}
          <View style={{ gap: 20 }}>
            {permissions.map((p) => {
              const isEnabled = rolePermissions.includes(p.name);
              const canToggle = canUpdateRoles; // If you can update roles, you can toggle permissions
              
              return (
                <View key={p.id}>
                  <View style={styles.permRow}>
                    <View style={{ flex: 1 }}>
                      <Body style={{ color: colors.text }}>{p.description || p.name}</Body>
                    </View>
                    <Switch
                      value={isEnabled}
                      disabled={!canToggle}
                      onValueChange={(v) => handleTogglePermission(p, v)}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      );
    };

    return (
      <Card style={styles.sectionCard}>
        {renderSectionHeader('Assigned Permissions', 'key')}
        {renderPermissionSection('User Management', userManagement)}
        {renderPermissionSection('System', system)}
      </Card>
    );
  };

  const renderUsers = () => (
    <Card style={styles.sectionCard}>
      {renderSectionHeader(`Current Users (${role?.users?.length || 0})`, 'users')}
      
      {role?.users.length === 0 ? (
        <Body style={[styles.emptyText, { color: colors.mutedText }]}>
          No users assigned to this role
        </Body>
      ) : (
        <View style={styles.userList}>
          {role?.users.slice(0, 5).map((user) => (
              <Pressable
                key={user.id}
                style={styles.userItem}
                onPress={() => navigation.navigate('AdminEditUserAccess', { id: user.id })}
              >
                <UserIdentityRow
                  email={user.email}
                  phoneNumber={user.phoneNumber}
                  identities={user.identities}
                  style={styles.userIdentityRow}
                />
                <FontAwesome6 name="chevron-right" iconStyle="solid" size={12} color={colors.mutedText} />
            </Pressable>
          ))}
          {(role?.users?.length || 0) > 5 && (
            <Body style={[styles.moreText, { color: colors.mutedText }]}>
              +{(role?.users?.length || 0) - 5} more users
            </Body>
          )}
        </View>
      )}
      

    </Card>
  );

  const renderDeleteButton = () => {
    if (!canDeleteRoles) return null;
    
    return (
      <View style={styles.deleteButtonContainer}>
        <Button
          title="Delete Role"
          onPress={handleDeleteRole}
          icon="trash"
          iconStyle="solid"
          variant="ghost"
          style={styles.deleteButton}
          loading={deleteLoading}
          success={deleteSuccess}
          successText="Role Deleted!"
          error={deleteErrorFlash}
          errorText="Error deleting"
          onSuccessComplete={() => { setDeleteSuccess(false); setDeleteErrorFlash(false); }}
        />
        {deleteError && (
          <Body style={[styles.errorText, { color: colors.danger }]}>
            {deleteError}
          </Body>
        )}
      </View>
    );
  };

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
        {renderBasicInfo()}
        {renderPermissions()}
        {renderUsers()}
        {renderDeleteButton()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  paddedContainer: { paddingHorizontal: 20, paddingVertical: 24 },
  saveButtonContainer: { 
  },
  saveButton: { width: '100%' },
  content: { flex: 1 },
  sectionCard: { marginBottom: 16 },
  sectionHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    marginBottom: 16 
  },
  sectionTitle: { fontSize: 16, fontWeight: '600' },
  formSection: { gap: 8, marginBottom: 16 },
  formLabel: { fontSize: 14, fontWeight: '500', marginBottom: 4 },
  textInput: { 
    paddingVertical: 12, 
    paddingHorizontal: 16, 
    borderRadius: 8, 
    borderWidth: 1, 
    fontSize: 14 
  },
  permissionSection: { marginBottom: 20 },
  permRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  userList: { gap: 8 },
  userItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.02)'
  },
  userIdentityRow: { flex: 1 },
  moreText: { fontSize: 12, fontStyle: 'italic' },
  sectionFooter: { 
    marginTop: 12, 
    paddingTop: 12, 
    borderTopWidth: 1, 
    borderTopColor: 'rgba(0,0,0,0.1)' 
  },
  countText: { fontSize: 12 },
  emptyText: { fontSize: 14, fontStyle: 'italic' },
  deleteButtonContainer: { 
    marginTop: 16
  },
  deleteButton: { width: '100%' },
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
  errorText: { 
    fontSize: 14, 
    marginTop: 8, 
    textAlign: 'center' 
  },
  errorCard: { marginTop: 32, paddingVertical: 32 },
});
