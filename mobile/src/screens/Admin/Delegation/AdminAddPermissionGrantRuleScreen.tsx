import React, { useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTheme } from '../../../theme/ThemeProvider';
import { Body, Screen } from '../../../components';
import GrantRuleForm from '../../../components/GrantRuleForm';
import { useAppSelector } from '../../../store/hooks';
import { selectUserPermissions } from '../../../features/auth/selectors';
import { useQuery, useMutation } from '@apollo/client/react';
import { QUERY_ADMIN_LIST_GRANTABLE_PERMISSIONS, QUERY_ADMIN_GET_ROLE, MUTATION_ADMIN_CREATE_PERMISSION_GRANT_RULE } from '../../../graphql/operations';

type AdminAddPermissionGrantRuleRouteParams = {
  roleId: string;
};

type AdminAddPermissionGrantRuleRouteProp = RouteProp<{
  params: AdminAddPermissionGrantRuleRouteParams;
}, 'params'>;

export default function AdminAddPermissionGrantRule() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<AdminAddPermissionGrantRuleRouteProp>();
  const { roleId } = route.params;
  const permissions = useAppSelector(selectUserPermissions) as string[];

  const canCreatePermissionGrantRules = permissions.includes('ADMIN_PERMISSION_GRANT_RULES_CREATE');

  const { data: permissionsData, loading: permissionsLoading } = useQuery(QUERY_ADMIN_LIST_GRANTABLE_PERMISSIONS, {
    skip: !canCreatePermissionGrantRules
  });

  const { data: roleData } = useQuery(QUERY_ADMIN_GET_ROLE, {
    variables: { id: roleId },
    skip: !canCreatePermissionGrantRules
  });

  const [createPermissionGrantRule] = useMutation(MUTATION_ADMIN_CREATE_PERMISSION_GRANT_RULE, {
    refetchQueries: [
      { query: QUERY_ADMIN_LIST_GRANTABLE_PERMISSIONS },
      { query: QUERY_ADMIN_GET_ROLE, variables: { id: roleId } }
    ],
    onCompleted: () => {
      navigation.goBack();
    }
  });

  const allPermissions = (permissionsData as any)?.adminListAssignablePermissions || [];
  const existingPermissionGrantRules = (roleData as any)?.adminGetRole?.canGrantPermissionsRules || [];
  
  // Check if there's an "ALL" scope rule - if so, no "All permissions" option should be available
  const hasAllScopeRule = existingPermissionGrantRules.some((rule: any) => rule.scope === 'ALL');
  
  // Get permission IDs that already have grant rules
  const existingPermissionIds = existingPermissionGrantRules
    .filter((rule: any) => rule.scope === 'PERMISSION' && rule.permission?.id)
    .map((rule: any) => rule.permission.id);
  
  // Filter out permissions that already have grant rules
  const availablePermissions = allPermissions.filter((permission: any) => !existingPermissionIds.includes(permission.id));

  // Check if no permissions are available and navigate back with alert
  useEffect(() => {
    if (permissionsData && roleData && availablePermissions.length === 0) {
      Alert.alert(
        'No Available Permissions',
        'All permissions already have grant rules assigned for this role.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  }, [permissionsData, roleData, availablePermissions.length, navigation]);

  const handleSubmit = async (input: {
    scope: 'ALL' | 'SPECIFIC';
    itemId?: string;
    canAssign: boolean;
    canRevoke: boolean;
    canManage?: boolean;
  }) => {
    try {
      await createPermissionGrantRule({
        variables: {
          input: {
            granterRoleId: roleId,
            permissionId: input.scope === 'ALL' ? null : input.itemId,
            scope: input.scope === 'ALL' ? 'ALL' : 'PERMISSION',
            canAssign: input.canAssign,
            canRevoke: input.canRevoke
          }
        }
      });
    } catch (error) {
      throw error; // Re-throw to be handled by the form
    }
  };


  if (!canCreatePermissionGrantRules) {
    return (
      <Screen>
        <View style={[{ backgroundColor: colors.card, borderColor: colors.border }, styles.noAccessCard]}>
          <Body style={[{ color: colors.text }, styles.noAccessText]}>
            You don't have permission to create permission grant rules.
          </Body>
        </View>
      </Screen>
    );
  }

  if (permissionsLoading) {
    return (
      <Screen>
        <View style={styles.loadingContainer}>
          <Body style={[{ color: colors.text }, styles.loadingText]}>Loading...</Body>
        </View>
      </Screen>
    );
  }

  return (
    <Screen contentContainerStyle={styles.scrollContent}>
      <GrantRuleForm
        type="permission"
        items={availablePermissions}
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
    borderRadius: 8,
    borderWidth: 1
  },
  noAccessText: {
    fontSize: 16,
    textAlign: 'center'
  }
});
