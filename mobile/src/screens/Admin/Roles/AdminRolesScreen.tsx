import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../../../theme/ThemeProvider';
import { useAppSelector } from '../../../store/hooks';
import { selectUserPermissions } from '../../../features/auth/selectors';
import { useQuery } from '@apollo/client/react';
import { Body, Button, Card, Screen } from '../../../components';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { useNavigation } from '@react-navigation/native';
import {
  QUERY_ADMIN_LIST_MANAGEABLE_ROLES,
} from '../../../graphql/operations';

type Role = {
  id: string;
  name: string;
  description?: string;
  permissions: { id: string; name: string }[];
  users: { id: string }[];
};

export default function AdminRolesScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const permissions = useAppSelector(selectUserPermissions) as string[];
  
  // Permission checks
  const canViewRoles = permissions.includes('ADMIN_ROLES_VIEW');
  const canCreateRoles = permissions.includes('ADMIN_ROLES_CREATE');
  
  // Queries
  const { data: rolesData, loading: rolesLoading } = useQuery<{ adminListManageableRoles: Role[] }>(
    QUERY_ADMIN_LIST_MANAGEABLE_ROLES,
    { skip: !canViewRoles }
  );

  const roles = rolesData?.adminListManageableRoles ?? [];

  const renderRoleCard = (role: Role) => (
    <Card key={role.id} style={styles.roleCard}>
      <Pressable 
        onPress={() => navigation.navigate('AdminRoleDetail', { roleId: role.id })}
        style={styles.roleCardPressable}
      >
        <View style={styles.roleHeader}>
          <View style={styles.roleInfo}>
            <Body style={[styles.roleTitle, { color: colors.text }]}>{role.name}</Body>
            {role.description && (
              <Body style={[styles.roleDescription, { color: colors.mutedText }]}>
                {role.description}
              </Body>
            )}
          </View>
          <FontAwesome6 name="chevron-right" iconStyle="solid" size={16} color={colors.mutedText} />
        </View>
        
        <View style={styles.roleStats}>
          <View style={styles.statItem}>
            <FontAwesome6 name="users" iconStyle="solid" size={12} color={colors.mutedText} />
            <Body style={[styles.statText, { color: colors.mutedText }]}>
              {role.users.length} users
            </Body>
          </View>
          <View style={styles.statItem}>
            <FontAwesome6 name="key" iconStyle="solid" size={12} color={colors.mutedText} />
            <Body style={[styles.statText, { color: colors.mutedText }]}>
              {role.permissions.length} permissions
            </Body>
          </View>
        </View>
      </Pressable>
    </Card>
  );

  const renderEmptyState = () => {
    return (
      <Card style={styles.emptyCard}>
        <View style={styles.emptyContent}>
          <FontAwesome6 name="shield-halved" iconStyle="solid" size={32} color={colors.mutedText} />
          <Body style={[styles.emptyTitle, { color: colors.text }]}>No Roles Yet</Body>
          <Body style={[styles.emptyDescription, { color: colors.mutedText }]}>
            {canCreateRoles 
              ? 'Create your first role to start managing permissions.'
              : 'You don\'t have permission to create roles.'
            }
          </Body>
        </View>
      </Card>
    );
  };


  return (
    <Screen scroll={true} contentContainerStyle={styles.content}>
      {/* Create Role Button */}
      {canCreateRoles && (
        <View style={styles.addButtonContainer}>
          <Button
            title="Create Role"
            onPress={() => navigation.navigate('AdminCreateRole')}
            icon="plus"
            iconStyle="solid"
          />
        </View>
      )}

      {/* Content */}
      {rolesLoading ? (
        <Card style={styles.loadingCard}>
          <Body style={{ color: colors.mutedText, textAlign: 'center' }}>Loading roles...</Body>
        </Card>
      ) : roles.length > 0 ? (
        roles.map(renderRoleCard)
      ) : (
        renderEmptyState()
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  addButtonContainer: { paddingBottom: 16 },
  content: { flex: 1 },
  roleCard: { marginVertical: 10 },
  roleCardPressable: { padding: 0 },
  roleHeader: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    justifyContent: 'space-between', 
    marginBottom: 12 
  },
  roleInfo: { flex: 1 },
  roleTitle: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  roleDescription: { fontSize: 14, lineHeight: 18 },
  roleStats: { 
    flexDirection: 'row', 
    gap: 16, 
  },
  statItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6 
  },
  statText: { fontSize: 12 },
  emptyCard: { marginTop: 32 },
  emptyContent: { 
    alignItems: 'center', 
    paddingVertical: 32, 
    gap: 12 
  },
  emptyTitle: { fontSize: 18, fontWeight: '500' },
  emptyDescription: { fontSize: 14, textAlign: 'center', paddingHorizontal: 16 },
  loadingCard: { marginTop: 32, paddingVertical: 32 },
});
