import React, { useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTheme } from '../../../theme/ThemeProvider';
import { Body, Screen } from '../../../components';
import GrantRuleForm from '../../../components/GrantRuleForm';
import { useAppSelector } from '../../../store/hooks';
import { selectUserPermissions } from '../../../features/auth/selectors';
import { useQuery, useMutation } from '@apollo/client/react';
import { QUERY_ADMIN_LIST_MANAGEABLE_ROLES, QUERY_ADMIN_GET_ROLE, MUTATION_ADMIN_CREATE_ROLE_GRANT_RULE } from '../../../graphql/operations';

type AdminAddRoleGrantRuleRouteParams = {
  roleId: string;
};

type AdminAddRoleGrantRuleRouteProp = RouteProp<{
  params: AdminAddRoleGrantRuleRouteParams;
}, 'params'>;

export default function AdminAddRoleGrantRule() {
  const { colors, borderRadius } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<AdminAddRoleGrantRuleRouteProp>();
  const { roleId } = route.params;
  const permissions = useAppSelector(selectUserPermissions) as string[];

  const canCreateRoleGrantRules = permissions.includes('ADMIN_ROLE_GRANT_RULES_CREATE');

  const { data: rolesData, loading: rolesLoading } = useQuery<{ adminListManageableRoles?: unknown[] }>(QUERY_ADMIN_LIST_MANAGEABLE_ROLES, {
    skip: !canCreateRoleGrantRules
  });

  const { data: roleData } = useQuery<{ adminGetRole?: { canGrantRolesRules?: unknown[] } }>(QUERY_ADMIN_GET_ROLE, {
    variables: { id: roleId },
    skip: !canCreateRoleGrantRules
  });

  const [createRoleGrantRule] = useMutation(MUTATION_ADMIN_CREATE_ROLE_GRANT_RULE, {
    refetchQueries: [
      { query: QUERY_ADMIN_LIST_MANAGEABLE_ROLES },
      { query: QUERY_ADMIN_GET_ROLE, variables: { id: roleId } }
    ],
    onCompleted: () => {
      navigation.goBack();
    }
  });

  const allRoles = (rolesData?.adminListManageableRoles as { id: string; name: string; description?: string }[]) || [];
  const existingRoleGrantRules = (roleData?.adminGetRole?.canGrantRolesRules as { scope: string; granteeRole?: { id: string } }[]) || [];
  
  // Check if there's an "ALL" scope rule - if so, no "All roles" option should be available
  const hasAllScopeRule = existingRoleGrantRules.some((rule) => rule.scope === 'ALL');
  
  // Get role IDs that already have specific grant rules
  const existingRoleIds = existingRoleGrantRules
    .filter((rule) => rule.scope === 'ROLE' && rule.granteeRole?.id)
    .map((rule) => rule.granteeRole!.id);
  
  // Filter out the granter role and roles that already have grant rules
  const availableRoles = allRoles.filter((role) => 
    role.id !== roleId && !existingRoleIds.includes(role.id)
  );

  // Check if no roles are available and navigate back with alert
  useEffect(() => {
    if (rolesData && roleData && availableRoles.length === 0) {
      Alert.alert(
        'No Available Roles',
        'All roles already have grant rules assigned for this role.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  }, [rolesData, roleData, availableRoles.length, navigation]);

  const handleSubmit = async (input: {
    scope: 'ALL' | 'SPECIFIC';
    itemId?: string;
    canAssign: boolean;
    canRevoke: boolean;
    canManage?: boolean;
  }) => {
    try {
      await createRoleGrantRule({
        variables: {
          input: {
            granterRoleId: roleId,
            granteeRoleId: input.scope === 'ALL' ? null : input.itemId,
            scope: input.scope === 'ALL' ? 'ALL' : 'ROLE',
            canAssign: input.canAssign,
            canRevoke: input.canRevoke,
            canManage: input.canManage || false
          }
        }
      });
    } catch (error) {
      throw error; // Re-throw to be handled by the form
    }
  };


  if (!canCreateRoleGrantRules) {
    return (
      <Screen>
        <View style={[{ backgroundColor: colors.card, borderColor: colors.border, borderRadius: borderRadius.md }, styles.noAccessCard]}>
          <Body style={[{ color: colors.text }, styles.noAccessText]}>
            You don't have permission to create role grant rules.
          </Body>
        </View>
      </Screen>
    );
  }

  if (rolesLoading) {
    return (
      <Screen>
        <View style={styles.loadingContainer}>
          <Body style={[{ color: colors.text }, styles.loadingText]}>Loading...</Body>
        </View>
      </Screen>
    );
  }


  return (
    <Screen scroll={true} contentContainerStyle={styles.scrollContent}>
      <GrantRuleForm
        type="role"
        items={availableRoles}
        granterRoleName="Admin"
        showAllOption={!hasAllScopeRule}
        onSubmit={handleSubmit}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    fontSize: 16
  },
  noAccessCard: {
    margin: 20,
    padding: 20,
    borderWidth: 1
  },
  noAccessText: {
    fontSize: 16,
    textAlign: 'center'
  }
});
