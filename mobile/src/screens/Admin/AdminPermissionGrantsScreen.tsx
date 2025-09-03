import React, { useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { useAppSelector } from '../../store/hooks';
import { selectUserPermissions } from '../../features/auth/selectors';
import { useQuery, useMutation } from '@apollo/client/react';
import { Body, Button, Card, BottomSheet } from '../../components';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import {
  QUERY_ADMIN_LIST_PERMISSION_GRANT_RULES,
  QUERY_ADMIN_LIST_MANAGEABLE_ROLES,
  QUERY_ADMIN_LIST_GRANTABLE_PERMISSIONS,
  MUTATION_ADMIN_CREATE_PERMISSION_GRANT_RULE,
  MUTATION_ADMIN_DELETE_PERMISSION_GRANT_RULE,
} from '../../graphql/operations';

type PermissionGrantRule = {
  id: string;
  scope: 'ALL' | 'PERMISSION';
  canAssign: boolean;
  canRevoke: boolean;
  granterRole: { id: string; name: string; description?: string };
  permission?: { id: string; name: string; description?: string };
};

type Role = { id: string; name: string; description?: string };
type Permission = { id: string; name: string; description?: string };

interface AddGrantFormProps {
  roles: Role[];
  permissions: Permission[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

function AddGrantForm({ roles, permissions, onSubmit, onCancel }: AddGrantFormProps) {
  const { colors } = useTheme();
  const [formData, setFormData] = useState({
    granterRoleId: '',
    scope: 'ALL' as 'ALL' | 'PERMISSION',
    targetId: '',
    canAssign: true,
    canRevoke: true,
  });

  const handleSubmit = () => {
    if (!formData.granterRoleId) return;
    
    const input = {
      granterRoleId: formData.granterRoleId,
      scope: formData.scope,
      ...(formData.scope === 'ALL' ? {} : { permissionId: formData.targetId }),
      canAssign: formData.canAssign,
      canRevoke: formData.canRevoke,
    };
    
    onSubmit(input);
  };

  const isValid = formData.granterRoleId && (formData.scope === 'ALL' || formData.targetId);

  return (
    <View style={styles.formContainer}>
      {/* Granter Role */}
      <View style={styles.formSection}>
        <Body style={[styles.formLabel, { color: colors.text }]}>Granter Role *</Body>
        <View style={styles.dropdownContainer}>
          {roles.map((role) => (
            <Pressable
              key={role.id}
              onPress={() => setFormData(prev => ({ ...prev, granterRoleId: role.id }))}
              style={[
                styles.dropdownOption,
                formData.granterRoleId === role.id && { backgroundColor: colors.primary + '20' }
              ]}
            >
              <Body style={[styles.dropdownText, { color: colors.text }]}>{role.name}</Body>
              {formData.granterRoleId === role.id && (
                <FontAwesome6 name="check" iconStyle="solid" size={16} color={colors.primary} />
              )}
            </Pressable>
          ))}
        </View>
      </View>

      {/* Scope */}
      <View style={styles.formSection}>
        <Body style={[styles.formLabel, { color: colors.text }]}>Scope *</Body>
        <View style={styles.radioGroup}>
          <Pressable
            onPress={() => setFormData(prev => ({ ...prev, scope: 'ALL', targetId: '' }))}
            style={[
              styles.radioOption,
              formData.scope === 'ALL' && { backgroundColor: colors.primary + '20' }
            ]}
          >
            <FontAwesome6 
              name={formData.scope === 'ALL' ? "check" : "circle"} 
              iconStyle="solid" 
              size={16} 
              color={formData.scope === 'ALL' ? colors.primary : colors.mutedText} 
            />
            <Body style={[styles.radioText, { color: colors.text }]}>Any Permission</Body>
          </Pressable>
          <Pressable
            onPress={() => setFormData(prev => ({ ...prev, scope: 'PERMISSION' }))}
            style={[
              styles.radioOption,
              formData.scope !== 'ALL' && { backgroundColor: colors.primary + '20' }
            ]}
          >
            <FontAwesome6 
              name={formData.scope !== 'ALL' ? "check" : "circle"} 
              iconStyle="solid" 
              size={16} 
              color={formData.scope !== 'ALL' ? colors.primary : colors.mutedText} 
            />
            <Body style={[styles.radioText, { color: colors.text }]}>Specific Permission</Body>
          </Pressable>
        </View>
      </View>

      {/* Target Selection */}
      {formData.scope !== 'ALL' && (
        <View style={styles.formSection}>
          <Body style={[styles.formLabel, { color: colors.text }]}>Target Permission *</Body>
          <View style={styles.dropdownContainer}>
            {permissions.map((permission) => (
              <Pressable
                key={permission.id}
                onPress={() => setFormData(prev => ({ ...prev, targetId: permission.id }))}
                style={[
                  styles.dropdownOption,
                  formData.targetId === permission.id && { backgroundColor: colors.primary + '20' }
                ]}
              >
                <Body style={[styles.dropdownText, { color: colors.text }]}>{permission.name}</Body>
                {formData.targetId === permission.id && (
                  <FontAwesome6 name="check" iconStyle="solid" size={16} color={colors.primary} />
                )}
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* Capabilities */}
      <View style={styles.formSection}>
        <Body style={[styles.formLabel, { color: colors.text }]}>Capabilities</Body>
        <View style={styles.checkboxGroup}>
          <Pressable
            onPress={() => setFormData(prev => ({ ...prev, canAssign: !prev.canAssign }))}
            style={styles.checkboxOption}
          >
            <FontAwesome6 
              name={formData.canAssign ? "check" : "square"} 
              iconStyle="solid" 
              size={16} 
              color={formData.canAssign ? colors.primary : colors.mutedText} 
            />
            <Body style={[styles.checkboxText, { color: colors.text }]}>Can Assign</Body>
          </Pressable>
          <Pressable
            onPress={() => setFormData(prev => ({ ...prev, canRevoke: !prev.canRevoke }))}
            style={styles.checkboxOption}
          >
            <FontAwesome6 
              name={formData.canRevoke ? "check" : "square"} 
              iconStyle="solid" 
              size={16} 
              color={formData.canRevoke ? colors.primary : colors.mutedText} 
            />
            <Body style={[styles.checkboxText, { color: colors.text }]}>Can Revoke</Body>
          </Pressable>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.formActions}>
        <Button
          title="Cancel"
          onPress={onCancel}
          variant="ghost"
          style={{ flex: 1 }}
        />
        <Button
          title="Create Grant"
          onPress={handleSubmit}
          disabled={!isValid}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}

export default function AdminPermissionGrantsScreen() {
  const { colors } = useTheme();
  const permissions = useAppSelector(selectUserPermissions) as string[];
  
  // Permission checks
  const canViewPermissions = permissions.includes('ADMIN_PERMISSIONS_VIEW');
  const canCreatePermissionGrants = permissions.includes('ADMIN_PERMISSION_GRANT_RULES_CREATE');
  const canDeletePermissionGrants = permissions.includes('ADMIN_PERMISSION_GRANT_RULES_DELETE');
  
  // State
  const [addGrantModalVisible, setAddGrantModalVisible] = useState(false);

  // Queries
  const { data: permissionGrantsData, loading: permissionGrantsLoading } = useQuery<{ adminListPermissionGrantRules: PermissionGrantRule[] }>(
    QUERY_ADMIN_LIST_PERMISSION_GRANT_RULES,
    { skip: !canViewPermissions }
  );
  
  const { data: rolesData } = useQuery<{ adminListManageableRoles: Role[] }>(QUERY_ADMIN_LIST_MANAGEABLE_ROLES);
  const { data: permissionsData } = useQuery<{ adminListAssignablePermissions: Permission[] }>(QUERY_ADMIN_LIST_GRANTABLE_PERMISSIONS);

  // Mutations
  const [deletePermissionGrant] = useMutation(MUTATION_ADMIN_DELETE_PERMISSION_GRANT_RULE, {
    refetchQueries: [{ query: QUERY_ADMIN_LIST_PERMISSION_GRANT_RULES }],
  });
  const [createPermissionGrant] = useMutation(MUTATION_ADMIN_CREATE_PERMISSION_GRANT_RULE, {
    refetchQueries: [{ query: QUERY_ADMIN_LIST_PERMISSION_GRANT_RULES }],
  });

  const permissionGrants = permissionGrantsData?.adminListPermissionGrantRules ?? [];
  const roles = rolesData?.adminListManageableRoles ?? [];
  const allPermissions = permissionsData?.adminListAssignablePermissions ?? [];

  const handleAddGrant = async (input: any) => {
    try {
      await createPermissionGrant({ variables: { input } });
      setAddGrantModalVisible(false);
      Alert.alert('Success', 'Permission grant created successfully!');
    } catch (error: any) {
      console.error('Failed to create permission grant:', error);
      Alert.alert('Error', error?.message || 'Failed to create permission grant');
    }
  };

  const renderPermissionGrantCard = (grant: PermissionGrantRule) => (
    <Card key={grant.id} style={styles.grantCard}>
      <View style={styles.grantHeader}>
        <View style={styles.grantInfo}>
          <Body style={[styles.grantTitle, { color: colors.text }]}>
            {grant.granterRole.name} → {grant.scope === 'ALL' ? 'Any Permission' : grant.permission?.name}
          </Body>
          <Body style={[styles.grantDescription, { color: colors.mutedText }]}>
            Scope: {grant.scope}
          </Body>
        </View>
        {canDeletePermissionGrants && (
          <Pressable
            onPress={() => {
              Alert.alert(
                'Delete Grant',
                'Are you sure you want to delete this permission grant?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Delete', 
                    style: 'destructive',
                    onPress: () => deletePermissionGrant({ variables: { id: grant.id } })
                  }
                ]
              );
            }}
            style={styles.deleteButton}
          >
            <FontAwesome6 name="trash" iconStyle="solid" size={16} color="#DC2626" />
          </Pressable>
        )}
      </View>
      
      <View style={styles.grantCapabilities}>
        <View style={styles.capabilityItem}>
          <FontAwesome6 
            name={grant.canAssign ? "check" : "xmark"} 
            iconStyle="solid" 
            size={12} 
            color={grant.canAssign ? "#22C55E" : "#DC2626"} 
          />
          <Body style={[styles.capabilityText, { color: colors.mutedText }]}>Assign</Body>
        </View>
        <View style={styles.capabilityItem}>
          <FontAwesome6 
            name={grant.canRevoke ? "check" : "xmark"} 
            iconStyle="solid" 
            size={12} 
            color={grant.canRevoke ? "#22C55E" : "#DC2626"} 
          />
          <Body style={[styles.capabilityText, { color: colors.mutedText }]}>Revoke</Body>
        </View>
      </View>
    </Card>
  );

  const renderEmptyState = () => {
    return (
      <Card style={styles.emptyCard}>
        <View style={styles.emptyContent}>
          <FontAwesome6 name="key" iconStyle="solid" size={32} color={colors.mutedText} />
          <Body style={[styles.emptyTitle, { color: colors.text }]}>No Permission Grants Yet</Body>
          <Body style={[styles.emptyDescription, { color: colors.mutedText }]}>
            {canCreatePermissionGrants 
              ? 'Create your first permission grant to define delegation rules.'
              : 'You don\'t have permission to add permission grants.'
            }
          </Body>
        </View>
      </Card>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Add Grant Button */}
      {canCreatePermissionGrants && (
        <View style={styles.addButtonContainer}>
          <Button
            title="Add Permission Grant"
            onPress={() => setAddGrantModalVisible(true)}
            icon="plus"
            iconStyle="solid"
          />
        </View>
      )}

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {permissionGrantsLoading ? (
          <Card style={styles.loadingCard}>
            <Body style={{ color: colors.mutedText, textAlign: 'center' }}>Loading permission grants...</Body>
          </Card>
        ) : permissionGrants.length > 0 ? (
          permissionGrants.map(renderPermissionGrantCard)
        ) : (
          renderEmptyState()
        )}
      </ScrollView>

      {/* Add Grant Modal */}
      <BottomSheet
        visible={addGrantModalVisible}
        onClose={() => setAddGrantModalVisible(false)}
        title="Add Permission Grant"
        height={0.8}
      >
        <AddGrantForm
          roles={roles}
          permissions={allPermissions}
          onSubmit={handleAddGrant}
          onCancel={() => setAddGrantModalVisible(false)}
        />
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  addButtonContainer: { paddingHorizontal: 16, paddingVertical: 16 },
  content: { flex: 1, paddingHorizontal: 16 },
  grantCard: { marginBottom: 12 },
  grantHeader: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    justifyContent: 'space-between', 
    marginBottom: 12 
  },
  grantInfo: { flex: 1 },
  grantTitle: { fontSize: 16, fontWeight: '500', marginBottom: 4 },
  grantDescription: { fontSize: 12 },
  deleteButton: { 
    padding: 8, 
    borderRadius: 6, 
    backgroundColor: 'rgba(220, 38, 38, 0.1)' 
  },
  grantCapabilities: { 
    flexDirection: 'row', 
    gap: 16 
  },
  capabilityItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6 
  },
  capabilityText: { fontSize: 12 },
  emptyCard: { marginTop: 32 },
  emptyContent: { 
    alignItems: 'center', 
    paddingVertical: 32, 
    gap: 12 
  },
  emptyTitle: { fontSize: 18, fontWeight: '500' },
  emptyDescription: { fontSize: 14, textAlign: 'center', paddingHorizontal: 16 },
  loadingCard: { marginTop: 32, paddingVertical: 32 },
  // Form styles
  formContainer: { padding: 16, gap: 20 },
  formSection: { gap: 8 },
  formLabel: { fontSize: 14, fontWeight: '500', marginBottom: 4 },
  dropdownContainer: { gap: 4 },
  dropdownOption: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingVertical: 12, 
    paddingHorizontal: 16, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: 'rgba(0,0,0,0.1)' 
  },
  dropdownText: { fontSize: 14 },
  radioGroup: { gap: 8 },
  radioOption: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12, 
    paddingVertical: 12, 
    paddingHorizontal: 16, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: 'rgba(0,0,0,0.1)' 
  },
  radioText: { fontSize: 14 },
  checkboxGroup: { gap: 8 },
  checkboxOption: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12, 
    paddingVertical: 8 
  },
  checkboxText: { fontSize: 14 },
  formActions: { 
    flexDirection: 'row', 
    gap: 12, 
    marginTop: 8 
  },
});
