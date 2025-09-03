import React, { useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { useAppSelector } from '../../store/hooks';
import { selectUserPermissions } from '../../features/auth/selectors';
import { useQuery, useMutation } from '@apollo/client/react';
import { Body, Button, Card, BottomSheet } from '../../components';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import {
  QUERY_ADMIN_LIST_ROLE_GRANT_RULES,
  QUERY_ADMIN_LIST_MANAGEABLE_ROLES,
  MUTATION_ADMIN_CREATE_ROLE_GRANT_RULE,
  MUTATION_ADMIN_DELETE_ROLE_GRANT_RULE,
} from '../../graphql/operations';

type RoleGrantRule = {
  id: string;
  scope: 'ALL' | 'ROLE';
  canAssign: boolean;
  canRevoke: boolean;
  canManage: boolean;
  granterRole: { id: string; name: string; description?: string };
  granteeRole?: { id: string; name: string; description?: string };
};

type Role = { id: string; name: string; description?: string };

interface AddGrantFormProps {
  roles: Role[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

function AddGrantForm({ roles, onSubmit, onCancel }: AddGrantFormProps) {
  const { colors } = useTheme();
  const [formData, setFormData] = useState({
    granterRoleId: '',
    scope: 'ALL' as 'ALL' | 'ROLE',
    targetId: '',
    canAssign: true,
    canRevoke: true,
    canManage: false,
  });

  const handleSubmit = () => {
    if (!formData.granterRoleId) return;
    
    const input = {
      granterRoleId: formData.granterRoleId,
      scope: formData.scope,
      ...(formData.scope === 'ALL' ? {} : { granteeRoleId: formData.targetId }),
      canAssign: formData.canAssign,
      canRevoke: formData.canRevoke,
      canManage: formData.canManage,
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
            <Body style={[styles.radioText, { color: colors.text }]}>Any Role</Body>
          </Pressable>
          <Pressable
            onPress={() => setFormData(prev => ({ ...prev, scope: 'ROLE' }))}
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
            <Body style={[styles.radioText, { color: colors.text }]}>Specific Role</Body>
          </Pressable>
        </View>
      </View>

      {/* Target Selection */}
      {formData.scope !== 'ALL' && (
        <View style={styles.formSection}>
          <Body style={[styles.formLabel, { color: colors.text }]}>Target Role *</Body>
          <View style={styles.dropdownContainer}>
            {roles.map((role) => (
              <Pressable
                key={role.id}
                onPress={() => setFormData(prev => ({ ...prev, targetId: role.id }))}
                style={[
                  styles.dropdownOption,
                  formData.targetId === role.id && { backgroundColor: colors.primary + '20' }
                ]}
              >
                <Body style={[styles.dropdownText, { color: colors.text }]}>{role.name}</Body>
                {formData.targetId === role.id && (
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
          <Pressable
            onPress={() => setFormData(prev => ({ ...prev, canManage: !prev.canManage }))}
            style={styles.checkboxOption}
          >
            <FontAwesome6 
              name={formData.canManage ? "check" : "square"} 
              iconStyle="solid" 
              size={16} 
              color={formData.canManage ? colors.primary : colors.mutedText} 
            />
            <Body style={[styles.checkboxText, { color: colors.text }]}>Can Manage (Governance)</Body>
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

export default function AdminRoleGrantsScreen() {
  const { colors } = useTheme();
  const permissions = useAppSelector(selectUserPermissions) as string[];
  
  // Permission checks
  const canViewRoleGrants = permissions.includes('ADMIN_ROLE_GRANT_RULES_VIEW');
  const canCreateRoleGrants = permissions.includes('ADMIN_ROLE_GRANT_RULES_CREATE');
  const canDeleteRoleGrants = permissions.includes('ADMIN_ROLE_GRANT_RULES_DELETE');
  
  // State
  const [addGrantModalVisible, setAddGrantModalVisible] = useState(false);

  // Queries
  const { data: roleGrantsData, loading: roleGrantsLoading } = useQuery<{ adminListRoleGrantRules: RoleGrantRule[] }>(
    QUERY_ADMIN_LIST_ROLE_GRANT_RULES,
    { skip: !canViewRoleGrants }
  );
  
  const { data: rolesData } = useQuery<{ adminListManageableRoles: Role[] }>(QUERY_ADMIN_LIST_MANAGEABLE_ROLES);

  // Mutations
  const [deleteRoleGrant] = useMutation(MUTATION_ADMIN_DELETE_ROLE_GRANT_RULE, {
    refetchQueries: [{ query: QUERY_ADMIN_LIST_ROLE_GRANT_RULES }],
  });
  const [createRoleGrant] = useMutation(MUTATION_ADMIN_CREATE_ROLE_GRANT_RULE, {
    refetchQueries: [{ query: QUERY_ADMIN_LIST_ROLE_GRANT_RULES }],
  });

  const roleGrants = roleGrantsData?.adminListRoleGrantRules ?? [];
  const roles = rolesData?.adminListManageableRoles ?? [];

  const handleAddGrant = async (input: any) => {
    try {
      await createRoleGrant({ variables: { input } });
      setAddGrantModalVisible(false);
      Alert.alert('Success', 'Role grant created successfully!');
    } catch (error: any) {
      console.error('Failed to create role grant:', error);
      Alert.alert('Error', error?.message || 'Failed to create role grant');
    }
  };

  const renderRoleGrantCard = (grant: RoleGrantRule) => (
    <Card key={grant.id} style={styles.grantCard}>
      <View style={styles.grantHeader}>
        <View style={styles.grantInfo}>
          <Body style={[styles.grantTitle, { color: colors.text }]}>
            {grant.granterRole.name} → {grant.scope === 'ALL' ? 'Any Role' : grant.granteeRole?.name}
          </Body>
          <Body style={[styles.grantDescription, { color: colors.mutedText }]}>
            Scope: {grant.scope}
          </Body>
        </View>
        {canDeleteRoleGrants && (
          <Pressable
            onPress={() => {
              Alert.alert(
                'Delete Grant',
                'Are you sure you want to delete this role grant?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Delete', 
                    style: 'destructive',
                    onPress: () => deleteRoleGrant({ variables: { id: grant.id } })
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
        <View style={styles.capabilityItem}>
          <FontAwesome6 
            name={grant.canManage ? "check" : "xmark"} 
            iconStyle="solid" 
            size={12} 
            color={grant.canManage ? "#22C55E" : "#DC2626"} 
          />
          <Body style={[styles.capabilityText, { color: colors.mutedText }]}>Governance</Body>
        </View>
      </View>
    </Card>
  );

  const renderEmptyState = () => {
    return (
      <Card style={styles.emptyCard}>
        <View style={styles.emptyContent}>
          <FontAwesome6 name="users" iconStyle="solid" size={32} color={colors.mutedText} />
          <Body style={[styles.emptyTitle, { color: colors.text }]}>No Role Grants Yet</Body>
          <Body style={[styles.emptyDescription, { color: colors.mutedText }]}>
            {canCreateRoleGrants 
              ? 'Create your first role grant to define delegation rules.'
              : 'You don\'t have permission to add role grants.'
            }
          </Body>
        </View>
      </Card>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Add Grant Button */}
      {canCreateRoleGrants && (
        <View style={styles.addButtonContainer}>
          <Button
            title="Add Role Grant"
            onPress={() => setAddGrantModalVisible(true)}
            icon="plus"
            iconStyle="solid"
          />
        </View>
      )}

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {roleGrantsLoading ? (
          <Card style={styles.loadingCard}>
            <Body style={{ color: colors.mutedText, textAlign: 'center' }}>Loading role grants...</Body>
          </Card>
        ) : roleGrants.length > 0 ? (
          roleGrants.map(renderRoleGrantCard)
        ) : (
          renderEmptyState()
        )}
      </ScrollView>

      {/* Add Grant Modal */}
      <BottomSheet
        visible={addGrantModalVisible}
        onClose={() => setAddGrantModalVisible(false)}
        title="Add Role Grant"
        height={0.8}
      >
        <AddGrantForm
          roles={roles}
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
