import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../../theme/ThemeProvider';
import { useAppSelector } from '../../../store/hooks';
import { selectUserPermissions } from '../../../features/auth/selectors';
import { useQuery } from '@apollo/client/react';
import { Body, Card, NavigationCard, Screen, LoadingContainer } from '../../../components';
import { useRoute, useNavigation } from '@react-navigation/native';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import {
  QUERY_ADMIN_GET_ROLE,
} from '../../../graphql/operations';

type Role = {
  id: string;
  name: string;
  description?: string;
};


export default function AdminManageRoleDelegation() {
  const { colors, layout } = useTheme();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const permissions = useAppSelector(selectUserPermissions) as string[];
  
  const roleId = route.params?.roleId;
  
  // Permission checks
  const canViewRoleGrants = permissions.includes('ADMIN_ROLE_GRANT_RULES_VIEW');
  const canViewPermissionGrants = permissions.includes('ADMIN_PERMISSION_GRANT_RULES_VIEW');

  // Queries
  const { data: roleData, loading: roleLoading } = useQuery<{ adminGetRole: Role }>(
    QUERY_ADMIN_GET_ROLE,
    { 
      variables: { id: roleId },
      skip: !roleId 
    }
  );

  const role = roleData?.adminGetRole;

  if (roleLoading) {
    return (
      <Screen>
        <LoadingContainer text="Loading delegation rules..." />
      </Screen>
    );
  }

  if (!role) {
    return (
      <Screen>
        <Card style={styles.errorCard}>
          <Body style={[styles.centerText, { color: colors.mutedText }]}>Role not found</Body>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen contentContainerStyle={{ gap: layout.containerGap }}>
      <View style={styles.section}>
        <Body style={[styles.sectionTitle, { color: colors.text }]}>Delegation Management</Body>
        <Body style={[styles.sectionDescription, { color: colors.mutedText }]}>
          Manage who can grant roles and permissions for "{role.name}"
        </Body>
      </View>

      <View style={[styles.cardsContainer, { gap: layout.containerGap }]}>
        <NavigationCard
          title="Role Grant Rules"
          description="Define which roles can assign other roles to users"
          icon="users"
          onPress={() => navigation.navigate('AdminRoleGrantRules', { roleId: role.id })}
          disabled={!canViewRoleGrants}
          iconColor={colors.primary}
          iconBackgroundColor={colors.primary + '20'}
        />

        <NavigationCard
          title="Permission Grant Rules"
          description="Define which roles can assign permissions to users"
          icon="key"
          onPress={() => navigation.navigate('AdminPermissionGrantRules', { roleId: role.id })}
          disabled={!canViewPermissionGrants}
          iconColor={colors.primary}
          iconBackgroundColor={colors.primary + '20'}
        />
      </View>

      {!canViewRoleGrants && !canViewPermissionGrants && (
        <Card style={styles.noAccessCard}>
          <View style={styles.noAccessContent}>
            <FontAwesome6 name="shield-halved" iconStyle="solid" size={32} color={colors.mutedText} />
            <Body style={[styles.noAccessTitle, { color: colors.text }]}>No Access</Body>
            <Body style={[styles.noAccessDescription, { color: colors.mutedText }]}>
              You don't have permission to manage delegation rules.
            </Body>
          </View>
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { paddingBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '600', marginBottom: 8 },
  sectionDescription: { fontSize: 14, lineHeight: 20 },
  cardsContainer: { },
  noAccessCard: { marginTop: 32 },
  noAccessContent: { 
    alignItems: 'center', 
    paddingVertical: 32, 
    gap: 12 
  },
  noAccessTitle: { fontSize: 18, fontWeight: '500' },
  noAccessDescription: { fontSize: 14, textAlign: 'center', paddingHorizontal: 16 },
  errorCard: { marginTop: 32, paddingVertical: 32 },
  centerText: { textAlign: 'center' },
});
