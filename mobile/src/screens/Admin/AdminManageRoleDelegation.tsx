import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Pressable } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { useAppSelector } from '../../store/hooks';
import { selectUserPermissions } from '../../features/auth/selectors';
import { useQuery, useMutation } from '@apollo/client/react';
import { Body, Button, Card, BottomSheet } from '../../components';
import { useRoute } from '@react-navigation/native';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import {
  QUERY_ADMIN_GET_ROLE,
  QUERY_ADMIN_LIST_MANAGEABLE_ROLES,
  MUTATION_ADMIN_CREATE_ROLE_GRANT_RULE,
  MUTATION_ADMIN_DELETE_ROLE_GRANT_RULE,
  MUTATION_ADMIN_DELETE_PERMISSION_GRANT_RULE,
} from '../../graphql/operations';

type Role = {
  id: string;
  name: string;
  canGrantRolesRules?: RoleGrantRule[];
  canGrantPermissionsRules?: PermissionGrantRule[];
};

type RoleGrantRule = {
  id: string;
  scope: 'ALL' | 'ROLE';
  canAssign: boolean;
  canRevoke: boolean;
  canManage: boolean;
  granteeRole?: { id: string; name: string; description?: string };
};

type PermissionGrantRule = {
  id: string;
  scope: 'ALL' | 'PERMISSION';
  canAssign: boolean;
  canRevoke: boolean;
  permission?: { id: string; name: string; description?: string };
};

type ManageableRole = { id: string; name: string; description?: string };

function AddRoleGrantForm({ 
  roles, 
  onSubmit, 
  onCancel 
}: { 
  roles: ManageableRole[]; 
  onSubmit: (input: any) => void; 
  onCancel: () => void; 
}) {
  const { colors } = useTheme();
  const [scope, _setScope] = useState<'ALL' | 'ROLE'>('ROLE');
  const [granteeRoleId, setGranteeRoleId] = useState('');
  const [canAssign, _setCanAssign] = useState(true);
  const [canRevoke, _setCanRevoke] = useState(true);
  const [canManage, _setCanManage] = useState(false);

  const handleSubmit = () => {
    onSubmit({
      scope,
      granteeRoleId: scope === 'ROLE' ? granteeRoleId : null,
      canAssign,
      canRevoke,
      canManage,
    });
  };

  return (
    <View style={styles.formContainer}>
      <View style={styles.formSection}>
        <Body style={[styles.formLabel, { color: colors.text }]}>Scope</Body>
        <View style={styles.radioGroup}>
          <View style={styles.radioOption}>
            <FontAwesome6 
              name={scope === 'ROLE' ? 'circle-dot' : 'circle'} 
              iconStyle="regular" 
              size={16} 
              color={colors.primary} 
            />
            <Body style={[styles.radioLabel, { color: colors.text }]}>Specific Role</Body>
          </View>
          <View style={styles.radioOption}>
            <FontAwesome6 
              name={scope === 'ALL' ? 'circle-dot' : 'circle'} 
              iconStyle="regular" 
              size={16} 
              color={colors.primary} 
            />
            <Body style={[styles.radioLabel, { color: colors.text }]}>All Roles</Body>
          </View>
        </View>
      </View>

      {scope === 'ROLE' && (
        <View style={styles.formSection}>
          <Body style={[styles.formLabel, { color: colors.text }]}>Target Role</Body>
          <View style={styles.roleSelector}>
            {roles.map((role) => (
              <Pressable
                key={role.id}
                style={[
                  styles.roleOption,
                  { 
                    backgroundColor: granteeRoleId === role.id ? colors.primary + '20' : 'transparent',
                    borderColor: colors.border 
                  }
                ]}
                onPress={() => setGranteeRoleId(role.id)}
              >
                <Body style={[styles.roleName, { color: colors.text }]}>{role.name}</Body>
                {role.description && (
                  <Body style={[styles.roleDescription, { color: colors.mutedText }]}>
                    {role.description}
                  </Body>
                )}
              </Pressable>
            ))}
          </View>
        </View>
      )}

      <View style={styles.formSection}>
        <Body style={[styles.formLabel, { color: colors.text }]}>Permissions</Body>
        <View style={styles.checkboxGroup}>
          <View style={styles.checkboxOption}>
            <FontAwesome6 
              name={canAssign ? 'square-check' : 'square'} 
              iconStyle="regular" 
              size={16} 
              color={colors.primary} 
            />
            <Body style={[styles.checkboxLabel, { color: colors.text }]}>Can Assign</Body>
          </View>
          <View style={styles.checkboxOption}>
            <FontAwesome6 
              name={canRevoke ? 'square-check' : 'square'} 
              iconStyle="regular" 
              size={16} 
              color={colors.primary} 
            />
            <Body style={[styles.checkboxLabel, { color: colors.text }]}>Can Revoke</Body>
          </View>
          <View style={styles.checkboxOption}>
            <FontAwesome6 
              name={canManage ? 'square-check' : 'square'} 
              iconStyle="regular" 
              size={16} 
              color={colors.primary} 
            />
            <Body style={[styles.checkboxLabel, { color: colors.text }]}>Can Manage</Body>
          </View>
        </View>
      </View>

      <View style={styles.formActions}>
        <Button title="Cancel" onPress={onCancel} variant="ghost" />
        <Button 
          title="Create Rule" 
          onPress={handleSubmit}
          disabled={scope === 'ROLE' && !granteeRoleId}
        />
      </View>
    </View>
  );
}

export default function AdminManageRoleDelegation() {
  const { colors } = useTheme();
  const route = useRoute<any>();
  const permissions = useAppSelector(selectUserPermissions) as string[];
  
  const roleId = route.params?.roleId;
  
  // Permission checks
  const canViewRoleGrants = permissions.includes('ADMIN_ROLE_GRANT_RULES_VIEW');
  const canCreateRoleGrants = permissions.includes('ADMIN_ROLE_GRANT_RULES_CREATE');
  const canDeleteRoleGrants = permissions.includes('ADMIN_ROLE_GRANT_RULES_DELETE');
  const canViewPermissionGrants = permissions.includes('ADMIN_PERMISSION_GRANT_RULES_VIEW');
  const canDeletePermissionGrants = permissions.includes('ADMIN_PERMISSION_GRANT_RULES_DELETE');
  
  // State
  const [addRoleGrantModalVisible, setAddRoleGrantModalVisible] = useState(false);

  // Queries
  const { data: roleData, loading: roleLoading } = useQuery<{ adminGetRole: Role }>(
    QUERY_ADMIN_GET_ROLE,
    { 
      variables: { id: roleId },
      skip: !roleId 
    }
  );

  const { data: rolesData } = useQuery<{ adminListManageableRoles: ManageableRole[] }>(
    QUERY_ADMIN_LIST_MANAGEABLE_ROLES
  );

  // Mutations
  const [createRoleGrant] = useMutation(MUTATION_ADMIN_CREATE_ROLE_GRANT_RULE, {
    refetchQueries: [{ query: QUERY_ADMIN_GET_ROLE, variables: { id: roleId } }],
  });

  const [deleteRoleGrant] = useMutation(MUTATION_ADMIN_DELETE_ROLE_GRANT_RULE, {
    refetchQueries: [{ query: QUERY_ADMIN_GET_ROLE, variables: { id: roleId } }],
  });

  const [deletePermissionGrant] = useMutation(MUTATION_ADMIN_DELETE_PERMISSION_GRANT_RULE, {
    refetchQueries: [{ query: QUERY_ADMIN_GET_ROLE, variables: { id: roleId } }],
  });

  const role = roleData?.adminGetRole;
  const roles = rolesData?.adminListManageableRoles ?? [];

  const handleAddRoleGrant = async (input: any) => {
    try {
      await createRoleGrant({ 
        variables: { 
          input: {
            ...input,
            granterRoleId: roleId,
          }
        } 
      });
      setAddRoleGrantModalVisible(false);
      Alert.alert('Success', 'Role grant rule created successfully!');
    } catch (error: any) {
      console.error('Failed to create role grant rule:', error);
      Alert.alert('Error', error?.message || 'Failed to create role grant rule');
    }
  };

  const handleDeleteRoleGrant = async (ruleId: string) => {
    Alert.alert(
      'Delete Rule',
      'Are you sure you want to delete this grant rule?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRoleGrant({ variables: { id: ruleId } });
              Alert.alert('Success', 'Rule deleted successfully!');
            } catch (error: any) {
              console.error('Failed to delete rule:', error);
              Alert.alert('Error', error?.message || 'Failed to delete rule');
            }
          }
        }
      ]
    );
  };

  if (roleLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Card style={styles.loadingCard}>
          <Body style={{ color: colors.mutedText, textAlign: 'center' }}>Loading delegation rules...</Body>
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
        {/* Role Grant Rules */}
        {canViewRoleGrants && (
          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <FontAwesome6 name="users" iconStyle="solid" size={16} color={colors.primary} />
              <Body style={[styles.sectionTitle, { color: colors.text }]}>Role Grant Rules</Body>
            </View>
            
            {canCreateRoleGrants && (
              <Button
                title="Add Role Grant Rule"
                onPress={() => setAddRoleGrantModalVisible(true)}
                icon="plus"
                iconStyle="solid"
                style={styles.addButton}
              />
            )}

            {(role.canGrantRolesRules?.length ?? 0) === 0 ? (
              <Body style={[styles.emptyText, { color: colors.mutedText }]}>
                No role grant rules configured
              </Body>
            ) : (
              <View style={styles.rulesList}>
                {(role.canGrantRolesRules ?? []).map((rule) => (
                  <View key={rule.id} style={styles.ruleItem}>
                    <View style={styles.ruleInfo}>
                      <Body style={[styles.ruleScope, { color: colors.text }]}>
                        {rule.scope === 'ALL' ? 'All Roles' : `Role: ${rule.granteeRole?.name || 'Unknown'}`}
                      </Body>
                      <Body style={[styles.rulePermissions, { color: colors.mutedText }]}>
                        {[
                          rule.canAssign && 'Assign',
                          rule.canRevoke && 'Revoke',
                          rule.canManage && 'Manage'
                        ].filter(Boolean).join(', ')}
                      </Body>
                    </View>
                    {canDeleteRoleGrants && (
                      <Pressable
                        onPress={() => handleDeleteRoleGrant(rule.id)}
                        style={styles.deleteButton}
                      >
                        <FontAwesome6 name="trash" iconStyle="solid" size={14} color="#DC2626" />
                      </Pressable>
                    )}
                  </View>
                ))}
              </View>
            )}
          </Card>
        )}

        {/* Permission Grant Rules */}
        {canViewPermissionGrants && (
          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <FontAwesome6 name="key" iconStyle="solid" size={16} color={colors.primary} />
              <Body style={[styles.sectionTitle, { color: colors.text }]}>Permission Grant Rules</Body>
            </View>
            
            {(role.canGrantPermissionsRules?.length ?? 0) === 0 ? (
              <Body style={[styles.emptyText, { color: colors.mutedText }]}>
                No permission grant rules configured
              </Body>
            ) : (
              <View style={styles.rulesList}>
                {(role.canGrantPermissionsRules ?? []).map((rule) => (
                  <View key={rule.id} style={styles.ruleItem}>
                    <View style={styles.ruleInfo}>
                      <Body style={[styles.ruleScope, { color: colors.text }]}>
                        {rule.scope === 'ALL' ? 'All Permissions' : `Permission: ${rule.permission?.name || 'Unknown'}`}
                      </Body>
                      <Body style={[styles.rulePermissions, { color: colors.mutedText }]}>
                        {[
                          rule.canAssign && 'Assign',
                          rule.canRevoke && 'Revoke'
                        ].filter(Boolean).join(', ')}
                      </Body>
                    </View>
                    {canDeletePermissionGrants && (
                      <Pressable
                        onPress={() => deletePermissionGrant({ variables: { id: rule.id } })}
                        style={styles.deleteButton}
                      >
                        <FontAwesome6 name="trash" iconStyle="solid" size={14} color="#DC2626" />
                      </Pressable>
                    )}
                  </View>
                ))}
              </View>
            )}
          </Card>
        )}
      </ScrollView>

      {/* Add Role Grant Modal */}
      <BottomSheet
        visible={addRoleGrantModalVisible}
        onClose={() => setAddRoleGrantModalVisible(false)}
        title="Add Role Grant Rule"
        height={0.8}
      >
        <AddRoleGrantForm
          roles={roles}
          onSubmit={handleAddRoleGrant}
          onCancel={() => setAddRoleGrantModalVisible(false)}
        />
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 16, paddingVertical: 20 },
  headerCard: { padding: 20, marginBottom: 16 },
  mainTitle: { fontSize: 20, fontWeight: '600', marginBottom: 8 },
  mainDescription: { fontSize: 14, lineHeight: 20 },
  sectionCard: { padding: 20, marginBottom: 16 },
  sectionHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    marginBottom: 16 
  },
  sectionTitle: { fontSize: 16, fontWeight: '600' },
  addButton: { marginBottom: 16 },
  rulesList: { gap: 12 },
  ruleItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 8
  },
  ruleInfo: { flex: 1 },
  ruleScope: { fontSize: 14, marginBottom: 4 },
  rulePermissions: { fontSize: 12 },
  deleteButton: { 
    padding: 8,
    borderRadius: 4
  },
  emptyText: { fontSize: 14, fontStyle: 'italic', textAlign: 'center' },
  loadingCard: { marginTop: 32, paddingVertical: 32 },
  errorCard: { marginTop: 32, paddingVertical: 32 },
  // Form styles
  formContainer: { padding: 16, gap: 20 },
  formSection: { gap: 8 },
  formLabel: { fontSize: 14, fontWeight: '500', marginBottom: 4 },
  radioGroup: { gap: 12 },
  radioOption: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8 
  },
  radioLabel: { fontSize: 14 },
  roleSelector: { gap: 8 },
  roleOption: { 
    padding: 12, 
    borderWidth: 1, 
    borderRadius: 8 
  },
  roleName: { fontSize: 14, fontWeight: '500', marginBottom: 4 },
  roleDescription: { fontSize: 12 },
  checkboxGroup: { gap: 12 },
  checkboxOption: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8 
  },
  checkboxLabel: { fontSize: 14 },
  formActions: { 
    flexDirection: 'row', 
    gap: 12, 
    marginTop: 8 
  },
});
