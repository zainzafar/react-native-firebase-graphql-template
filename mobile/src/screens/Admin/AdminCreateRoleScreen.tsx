import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TextInput, Switch } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { useAppSelector } from '../../store/hooks';
import { selectUserPermissions } from '../../features/auth/selectors';
import { useQuery, useMutation } from '@apollo/client/react';
import { Body, Button, Card } from '../../components';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { useNavigation } from '@react-navigation/native';
import {
  QUERY_ADMIN_LIST_GRANTABLE_PERMISSIONS,
  QUERY_ADMIN_LIST_MANAGEABLE_ROLES,
  MUTATION_ADMIN_CREATE_ROLE,
} from '../../graphql/operations';

type Permission = {
  id: string;
  name: string;
  description?: string;
};

export default function AdminCreateRoleScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const permissions = useAppSelector(selectUserPermissions) as string[];
  
  // Permission checks
  const canViewPermissions = permissions.includes('ADMIN_PERMISSIONS_VIEW');
  
  // State
  const [editData, setEditData] = useState({ name: '', description: '' });
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);
  const [createLoading, setCreateLoading] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createErrorFlash, setCreateErrorFlash] = useState(false);

  // Queries
  const { data: permissionsData } = useQuery<{ adminListAssignablePermissions: Permission[] }>(
    QUERY_ADMIN_LIST_GRANTABLE_PERMISSIONS,
    { skip: !canViewPermissions }
  );

  // Mutations
  const [createRole] = useMutation(MUTATION_ADMIN_CREATE_ROLE, {
    refetchQueries: [
      { query: QUERY_ADMIN_LIST_MANAGEABLE_ROLES },
      { query: QUERY_ADMIN_LIST_GRANTABLE_PERMISSIONS }
    ],
  });

  const allPermissions = permissionsData?.adminListAssignablePermissions ?? [];

  const handleCreateRole = async () => {
    try {
      setCreateLoading(true);
      setCreateSuccess(false);
      setCreateError(null);
      setCreateErrorFlash(false);
      
      if (!editData.name.trim()) {
        setCreateError('Role name is required');
        setCreateErrorFlash(true);
        return;
      }
      
      // Find the permission IDs for the selected permissions
      const selectedPermissionIds = allPermissions
        .filter(p => rolePermissions.includes(p.name))
        .map(p => p.id);
      
      await createRole({ 
        variables: { 
          input: {
            name: editData.name.trim(),
            description: editData.description.trim() || undefined,
            permissionIds: selectedPermissionIds.length > 0 ? selectedPermissionIds : undefined,
          }
        } 
      });
      
      setCreateSuccess(true);
      // Navigate back after a short delay to show success state
      setTimeout(() => {
        navigation.goBack();
      }, 1000);
    } catch (error: any) {
      console.error('Failed to create role:', error);
      setCreateError(error?.message || 'Failed to create role');
      setCreateErrorFlash(true);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleTogglePermission = async (permission: Permission, enabled: boolean) => {
    // Optimistically update local state first
    if (enabled) {
      setRolePermissions(prev => [...prev, permission.name]);
    } else {
      setRolePermissions(prev => prev.filter(p => p !== permission.name));
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
        />
      </View>

      <View style={styles.saveButtonContainer}>
        <Button
          title="Create Role"
          onPress={handleCreateRole}
          disabled={!editData.name.trim()}
          style={styles.saveButton}
          loading={createLoading}
          success={createSuccess}
          successText="Role Created!"
          error={createErrorFlash}
          errorText="Error creating"
          onSuccessComplete={() => { setCreateSuccess(false); setCreateErrorFlash(false); }}
        />
        {createError && (
          <Body style={[styles.errorText, { color: colors.danger }]}>
            {createError}
          </Body>
        )}
      </View>
    </Card>
  );

  const renderPermissions = () => {
    if (!canViewPermissions) return null;

    // If no permissions are available to assign, don't show the section
    if (allPermissions.length === 0) return null;

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
              
              return (
                <View key={p.id}>
                  <View style={styles.permRow}>
                    <View style={{ flex: 1 }}>
                      <Body style={{ color: colors.text }}>{p.description || p.name}</Body>
                    </View>
                    <Switch
                      value={isEnabled}
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
        {renderSectionHeader('Assign Permissions', 'key')}
        {renderPermissionSection('User Management', userManagement)}
        {renderPermissionSection('System', system)}
      </Card>
    );
  };

  return (
    <View style={[styles.container, styles.paddedContainer, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderBasicInfo()}
        {renderPermissions()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  paddedContainer: { paddingHorizontal: 20, paddingVertical: 24 },
  saveButtonContainer: { 
    marginTop: 16 
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
  errorText: { 
    fontSize: 14, 
    marginTop: 8, 
    textAlign: 'center' 
  },
});
