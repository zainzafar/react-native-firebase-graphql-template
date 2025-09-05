import React from 'react';
import { View, StyleSheet, ScrollView, Alert, Pressable } from 'react-native';
import { useTheme } from '../../../theme/ThemeProvider';
import { useAppSelector } from '../../../store/hooks';
import { selectUserPermissions } from '../../../features/auth/selectors';
import { useQuery, useMutation } from '@apollo/client/react';
import { Body, Button, Card } from '../../../components';
import { useRoute, useNavigation } from '@react-navigation/native';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import {
  QUERY_ADMIN_GET_ROLE,
  QUERY_ADMIN_LIST_MANAGEABLE_ROLES,
  MUTATION_ADMIN_CREATE_ROLE_GRANT_RULE,
  MUTATION_ADMIN_DELETE_ROLE_GRANT_RULE,
} from '../../../graphql/operations';

type Role = {
  id: string;
  name: string;
  canGrantRolesRules?: RoleGrantRule[];
};

type RoleGrantRule = {
  id: string;
  scope: 'ALL' | 'ROLE';
  canAssign: boolean;
  canRevoke: boolean;
  canManage: boolean;
  granteeRole?: { id: string; name: string; description?: string };
};

type ManageableRole = { id: string; name: string; description?: string };


export default function AdminRoleGrantRules() {
  const { colors } = useTheme();
  const route = useRoute<any>();
  const navigation = useNavigation();
  const permissions = useAppSelector(selectUserPermissions) as string[];
  
  const roleId = route.params?.roleId;
  
  // Permission checks
  const canViewRoleGrants = permissions.includes('ADMIN_ROLE_GRANT_RULES_VIEW');
  const canCreateRoleGrants = permissions.includes('ADMIN_ROLE_GRANT_RULES_CREATE');
  const canDeleteRoleGrants = permissions.includes('ADMIN_ROLE_GRANT_RULES_DELETE');

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
  const [deleteRoleGrant] = useMutation(MUTATION_ADMIN_DELETE_ROLE_GRANT_RULE, {
    refetchQueries: [{ query: QUERY_ADMIN_GET_ROLE, variables: { id: roleId } }],
  });

  const role = roleData?.adminGetRole;
  const roles = rolesData?.adminListManageableRoles ?? [];

  const handleAddRoleGrant = () => {
    navigation.navigate('AdminAddRoleGrantRule', { roleId });
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
          <Body style={{ color: colors.mutedText, textAlign: 'center' }}>Loading role grant rules...</Body>
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

  if (!canViewRoleGrants) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Card style={styles.noAccessCard}>
          <View style={styles.noAccessContent}>
            <FontAwesome6 name="shield-halved" iconStyle="solid" size={32} color={colors.mutedText} />
            <Body style={[styles.noAccessTitle, { color: colors.text }]}>No Access</Body>
            <Body style={[styles.noAccessDescription, { color: colors.mutedText }]}>
              You don't have permission to view role grant rules.
            </Body>
          </View>
        </Card>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Add Role Grant Rule Button */}
      {canCreateRoleGrants && (
        <View style={styles.addButtonContainer}>
          <Button
            title="Add Role Grant Rule"
            onPress={handleAddRoleGrant}
            icon="plus"
            iconStyle="solid"
          />
        </View>
      )}

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {(role.canGrantRolesRules?.length ?? 0) === 0 ? (
          <Card style={styles.emptyCard}>
            <View style={styles.emptyContent}>
              <FontAwesome6 name="users" iconStyle="solid" size={32} color={colors.mutedText} />
              <Body style={[styles.emptyTitle, { color: colors.text }]}>No Role Grant Rules</Body>
              <Body style={[styles.emptyDescription, { color: colors.mutedText }]}>
                {canCreateRoleGrants 
                  ? 'Create your first role grant rule to start managing role assignments.'
                  : 'You don\'t have permission to create role grant rules.'
                }
              </Body>
            </View>
          </Card>
        ) : (
          <View style={styles.rulesContainer}>
            {(role.canGrantRolesRules ?? []).map((rule) => (
              <Card key={rule.id} style={styles.ruleCard}>
                <View style={styles.ruleHeader}>
                  <View style={styles.ruleInfo}>
                    <Body style={[styles.ruleScope, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">
                      {rule.scope === 'ALL' ? 'All Roles' : rule.granteeRole?.name || 'Unknown'}
                    </Body>
                    {rule.granteeRole?.description && (
                      <Body style={[styles.ruleDescription, { color: colors.mutedText }]}>
                        {rule.granteeRole.description}
                      </Body>
                    )}
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
                <View style={[styles.ruleDivider, { backgroundColor: colors.border }]} />
                <View style={styles.ruleActions}>
                  {rule.canAssign && (
                    <View style={styles.actionItem}>
                      <FontAwesome6 name="check" iconStyle="solid" size={12} color="#22C55E" />
                      <Body style={[styles.actionText, { color: colors.mutedText }]}>Assign</Body>
                    </View>
                  )}
                  {rule.canRevoke && (
                    <View style={styles.actionItem}>
                      <FontAwesome6 name="check" iconStyle="solid" size={12} color="#22C55E" />
                      <Body style={[styles.actionText, { color: colors.mutedText }]}>Revoke</Body>
                    </View>
                  )}
                  {rule.canManage && (
                    <View style={styles.actionItem}>
                      <FontAwesome6 name="check" iconStyle="solid" size={12} color="#22C55E" />
                      <Body style={[styles.actionText, { color: colors.mutedText }]}>Manage</Body>
                    </View>
                  )}
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  addButtonContainer: { paddingHorizontal: 16, paddingVertical: 20 },
  content: { flex: 1, paddingHorizontal: 16 },
  rulesContainer: { gap: 12 },
  ruleCard: { marginTop: 10 },
  ruleHeader: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    justifyContent: 'space-between' 
  },
  ruleInfo: { flex: 1 },
  ruleScope: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  ruleDescription: { fontSize: 14, marginBottom: 4 },
  ruleDivider: { height: 1, marginVertical: 8 },
  ruleActions: { flexDirection: 'row', gap: 12 },
  actionItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { fontSize: 14 },
  deleteButton: { 
    padding: 8,
    borderRadius: 4
  },
  emptyCard: { marginTop: 32 },
  emptyContent: { 
    alignItems: 'center', 
    paddingVertical: 32, 
    gap: 12 
  },
  emptyTitle: { fontSize: 18, fontWeight: '500' },
  emptyDescription: { fontSize: 14, textAlign: 'center', paddingHorizontal: 16 },
  loadingCard: { marginTop: 32, paddingVertical: 32 },
  errorCard: { marginTop: 32, paddingVertical: 32 },
  noAccessCard: { marginTop: 32 },
  noAccessContent: { 
    alignItems: 'center', 
    paddingVertical: 32, 
    gap: 12 
  },
  noAccessTitle: { fontSize: 18, fontWeight: '500' },
  noAccessDescription: { fontSize: 14, textAlign: 'center', paddingHorizontal: 16 },
});
