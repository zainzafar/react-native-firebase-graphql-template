import React from 'react';
import { View, StyleSheet, Alert, Pressable } from 'react-native';
import { useTheme } from '../../../theme/ThemeProvider';
import { useAppSelector } from '../../../store/hooks';
import { selectUserPermissions } from '../../../features/auth/selectors';
import { useQuery, useMutation } from '@apollo/client/react';
import { Body, Button, Card, Screen, LoadingContainer } from '../../../components';
import { useRoute, useNavigation } from '@react-navigation/native';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import {
  QUERY_ADMIN_GET_ROLE,
  MUTATION_ADMIN_DELETE_PERMISSION_GRANT_RULE,
} from '../../../graphql/operations';

type Role = {
  id: string;
  name: string;
  canGrantPermissionsRules?: PermissionGrantRule[];
};

type PermissionGrantRule = {
  id: string;
  scope: 'ALL' | 'PERMISSION';
  canAssign: boolean;
  canRevoke: boolean;
  permission?: { id: string; name: string; description?: string };
};

export default function AdminPermissionGrantRules() {
  const { colors, layout } = useTheme();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const userPermissions = useAppSelector(selectUserPermissions) as string[];
  
  const roleId = route.params?.roleId;
  
  // Permission checks
  const canViewPermissionGrants = userPermissions.includes('ADMIN_PERMISSION_GRANT_RULES_VIEW');
  const canCreatePermissionGrants = userPermissions.includes('ADMIN_PERMISSION_GRANT_RULES_CREATE');
  const canDeletePermissionGrants = userPermissions.includes('ADMIN_PERMISSION_GRANT_RULES_DELETE');

  // Queries
  const { data: roleData, loading: roleLoading } = useQuery<{ adminGetRole: Role }>(
    QUERY_ADMIN_GET_ROLE,
    { 
      variables: { id: roleId },
      skip: !roleId 
    }
  );

  // Mutations
  const [deletePermissionGrant] = useMutation(MUTATION_ADMIN_DELETE_PERMISSION_GRANT_RULE, {
    refetchQueries: [{ query: QUERY_ADMIN_GET_ROLE, variables: { id: roleId } }],
  });

  const role = roleData?.adminGetRole;

  const handleAddPermissionGrant = () => {
    navigation.navigate('AdminAddPermissionGrantRule', { roleId });
  };

  const handleDeletePermissionGrant = async (ruleId: string) => {
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
              await deletePermissionGrant({ variables: { id: ruleId } });
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
      <Screen>
        <LoadingContainer text="Loading permission grant rules..." />
      </Screen>
    );
  }

  if (!role) {
    return (
      <Screen>
        <Card style={styles.errorCard}>
          <Body style={[{ color: colors.mutedText }, styles.centerText]}>Role not found</Body>
        </Card>
      </Screen>
    );
  }

  if (!canViewPermissionGrants) {
    return (
      <Screen>
        <Card style={styles.noAccessCard}>
          <View style={styles.noAccessContent}>
            <FontAwesome6 name="shield-halved" iconStyle="solid" size={32} color={colors.mutedText} />
            <Body style={[{ color: colors.text }, styles.noAccessTitle]}>No Access</Body>
            <Body style={[{ color: colors.mutedText }, styles.noAccessDescription]}>
              You don't have permission to view permission grant rules.
            </Body>
          </View>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      {/* Add Permission Grant Rule Button */}
      {canCreatePermissionGrants && (
        <View style={styles.addButtonContainer}>
          <Button
            title="Add Permission Grant Rule"
            onPress={handleAddPermissionGrant}
            icon="plus"
            iconStyle="solid"
          />
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>
        {(role.canGrantPermissionsRules?.length ?? 0) === 0 ? (
          <Card style={[layout.emptyCard, styles.emptyCard]}>
            <View style={styles.emptyContent}>
              <FontAwesome6 name="key" iconStyle="solid" size={32} color={colors.mutedText} />
              <Body style={[{ color: colors.text }, styles.emptyTitle]}>No Permission Grant Rules</Body>
              <Body style={[{ color: colors.mutedText }, styles.emptyDescription]}>
                {canCreatePermissionGrants 
                  ? 'Create your first permission grant rule to start managing permission assignments.'
                  : 'You don\'t have permission to create permission grant rules.'
                }
              </Body>
            </View>
          </Card>
        ) : (
          <View style={[{ gap: layout.containerGap }, styles.rulesContainer]}>
            {(role.canGrantPermissionsRules ?? []).map((rule) => (
              <Card key={rule.id} style={styles.ruleCard}>
                <View style={styles.ruleHeader}>
                  <View style={styles.ruleInfo}>
                    <Body style={[{ color: colors.text }, styles.ruleScope]}>
                      {rule.scope === 'ALL' 
                        ? 'All Permissions' 
                        : rule.permission?.name?.replace(/^ADMIN_/, '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown'
                      }
                    </Body>
                    {rule.scope !== 'ALL' && rule.permission?.description && (
                      <Body style={[{ color: colors.mutedText }, styles.ruleDescription]}>
                        {rule.permission.description}
                      </Body>
                    )}
                  </View>
                  {canDeletePermissionGrants && (
                    <Pressable
                      onPress={() => handleDeletePermissionGrant(rule.id)}
                      style={styles.deleteButton}
                    >
                      <FontAwesome6 name="trash" iconStyle="solid" size={14} color="#DC2626" />
                    </Pressable>
                  )}
                </View>
                <View style={[{ backgroundColor: colors.border }, styles.ruleDivider]} />
                <View style={styles.ruleActions}>
                  {rule.canAssign && (
                    <View style={styles.actionItem}>
                      <FontAwesome6 name="check" iconStyle="solid" size={12} color="#22C55E" />
                      <Body style={[{ color: colors.mutedText }, styles.actionText]}>Assign</Body>
                    </View>
                  )}
                  {rule.canRevoke && (
                    <View style={styles.actionItem}>
                      <FontAwesome6 name="check" iconStyle="solid" size={12} color="#22C55E" />
                      <Body style={[{ color: colors.mutedText }, styles.actionText]}>Revoke</Body>
                    </View>
                  )}
                </View>
              </Card>
            ))}
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  addButtonContainer: {  },
  content: { flex: 1 },
  rulesContainer: { },
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
  emptyCard: { },
  emptyContent: { 
    alignItems: 'center', 
    paddingVertical: 32, 
    gap: 12 
  },
  emptyTitle: { fontSize: 18, fontWeight: '500' },
  emptyDescription: { fontSize: 14, textAlign: 'center', paddingHorizontal: 16 },
  errorCard: { marginTop: 32, paddingVertical: 32 },
  noAccessCard: { marginTop: 32 },
  noAccessContent: { 
    alignItems: 'center', 
    paddingVertical: 32, 
    gap: 12 
  },
  noAccessTitle: { fontSize: 18, fontWeight: '500' },
  noAccessDescription: { fontSize: 14, textAlign: 'center', paddingHorizontal: 16 },
  centerText: { textAlign: 'center' },
});
