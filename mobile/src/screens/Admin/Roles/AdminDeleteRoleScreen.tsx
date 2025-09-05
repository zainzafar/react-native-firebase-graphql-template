import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { useTheme } from '../../../theme/ThemeProvider';
import { useAppSelector } from '../../../store/hooks';
import { selectUserPermissions } from '../../../features/auth/selectors';
import { useQuery, useMutation } from '@apollo/client/react';
import { Body, Button, Card } from '../../../components';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { useRoute, useNavigation } from '@react-navigation/native';
import {
  QUERY_ADMIN_GET_ROLE,
  QUERY_ADMIN_LIST_MANAGEABLE_ROLES,
  MUTATION_ADMIN_DELETE_ROLE,
  QUERY_ADMIN_LIST_ASSIGNABLE_ROLES,
} from '../../../graphql/operations';

type Role = {
  id: string;
  name: string;
  description?: string;
  permissions: { id: string; name: string; description?: string }[];
  users: { 
    id: string; 
    email: string; 
    displayName?: string;
    phoneNumber?: string;
    identities?: { providerId: string }[];
  }[];
};

export default function AdminDeleteRoleScreen() {
  const { colors } = useTheme();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const permissions = useAppSelector(selectUserPermissions) as string[];
  
  const roleId = route.params?.roleId;
  
  // Permission checks
  const canDeleteRoles = permissions.includes('ADMIN_ROLES_DELETE');
  
  // State
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteErrorFlash, setDeleteErrorFlash] = useState(false);

  // Queries
  const { data: roleData, loading: roleLoading } = useQuery<{ adminGetRole: Role }>(
    QUERY_ADMIN_GET_ROLE,
    { 
      variables: { id: roleId },
      skip: !roleId
    }
  );

  // Mutations
  const [deleteRole] = useMutation(MUTATION_ADMIN_DELETE_ROLE, {
    refetchQueries: [
      { query: QUERY_ADMIN_LIST_MANAGEABLE_ROLES },
      { query: QUERY_ADMIN_LIST_ASSIGNABLE_ROLES },
    ],
  });

  const role = roleData?.adminGetRole;

  const handleDeleteRole = async () => {
    if (!role) return;
    
    Alert.alert(
      'Final Confirmation',
      `Are you absolutely sure you want to delete the role "${role.name}"?\n\nThis action cannot be undone and will immediately remove access for all ${role.users.length} users currently assigned to this role.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete Role', 
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleteLoading(true);
              setDeleteSuccess(false);
              setDeleteError(null);
              setDeleteErrorFlash(false);
              
              await deleteRole({ variables: { id: roleId } });
              setDeleteSuccess(true);
            } catch (error: any) {
              console.error('Failed to delete role:', error);
              setDeleteError(error?.message || 'Failed to delete role');
              setDeleteErrorFlash(true);
            } finally {
              setDeleteLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleSuccessComplete = () => {
    // Pop back 2 screens to go directly to AdminRoles, skipping AdminRoleDetail
    navigation.pop(2);
  };

  if (roleLoading) {
    return (
      <View style={[styles.container, styles.paddedContainer, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <FontAwesome6 name="spinner" iconStyle="solid" size={32} color={colors.primary} />
          <Body style={[styles.loadingText, { color: colors.mutedText }]}>Loading role details...</Body>
        </View>
      </View>
    );
  }

  if (!role) {
    return (
      <View style={[styles.container, styles.paddedContainer, { backgroundColor: colors.background }]}>
        <Card style={styles.errorCard}>
          <Body style={{ color: colors.danger, textAlign: 'center' }}>Role not found</Body>
        </Card>
      </View>
    );
  }

  if (!canDeleteRoles) {
    return (
      <View style={[styles.container, styles.paddedContainer, { backgroundColor: colors.background }]}>
        <Card style={styles.errorCard}>
          <Body style={{ color: colors.danger, textAlign: 'center' }}>You don't have permission to delete roles</Body>
        </Card>
      </View>
    );
  }

  return (
    <View style={[styles.container, styles.paddedContainer, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Warning Header */}
        <Card style={styles.warningCard}>
          <View style={styles.warningHeader}>
            <FontAwesome6 name="triangle-exclamation" iconStyle="solid" size={24} color="#DC2626" />
            <Body style={[styles.warningTitle, { color: colors.text }]}>Delete Role</Body>
          </View>
          <Body style={[styles.warningText, { color: colors.mutedText }]}>
            This action cannot be undone. All users currently assigned to this role will lose access granted by it.
          </Body>
        </Card>

        {/* Role Details */}
        <Card style={styles.roleCard}>
          <Body style={[styles.roleTitle, { color: colors.text }]}>{role.name}</Body>
          {role.description && (
            <Body style={[styles.roleDescription, { color: colors.mutedText }]}>
              {role.description}
            </Body>
          )}
          
          <View style={styles.roleStats}>
            <View style={styles.statItem}>
              <FontAwesome6 name="users" iconStyle="solid" size={16} color={colors.mutedText} />
              <Body style={[styles.statText, { color: colors.mutedText }]}>
                {role.users.length} users will lose access
              </Body>
            </View>
            <View style={styles.statItem}>
              <FontAwesome6 name="key" iconStyle="solid" size={16} color={colors.mutedText} />
              <Body style={[styles.statText, { color: colors.mutedText }]}>
                {role.permissions.length} permissions will be removed
              </Body>
            </View>
          </View>
        </Card>

        {/* Delete Button */}
        <View style={styles.deleteButtonContainer}>
          <Button
            title={deleteLoading ? "Deleting..." : "Delete Role"}
            onPress={handleDeleteRole}
            disabled={deleteLoading}
            style={styles.deleteButton}
            loading={deleteLoading}
            success={deleteSuccess}
            successText="Role Deleted!"
            error={deleteErrorFlash}
            errorText="Error"
            onSuccessComplete={handleSuccessComplete}
          />
        </View>

        {/* Error Display */}
        {deleteError && (
          <Card style={styles.errorCard}>
            <Body style={[styles.errorText, { color: colors.danger }]}>
              {deleteError}
            </Body>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  paddedContainer: { paddingHorizontal: 20, paddingVertical: 20 },
  content: { flex: 1 },
  warningCard: { 
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626'
  },
  warningHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12, 
    marginBottom: 12 
  },
  warningTitle: { 
    fontSize: 18, 
    fontWeight: '600' 
  },
  warningText: { 
    fontSize: 14, 
    lineHeight: 20 
  },
  roleCard: { 
    padding: 20, 
    marginBottom: 24 
  },
  roleTitle: { 
    fontSize: 20, 
    fontWeight: '600', 
    marginBottom: 8 
  },
  roleDescription: { 
    fontSize: 16, 
    lineHeight: 22, 
    marginBottom: 16 
  },
  roleStats: { 
    gap: 12 
  },
  statItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8 
  },
  statText: { 
    fontSize: 14 
  },
  deleteButtonContainer: { 
    marginBottom: 16 
  },
  deleteButton: { 
    width: '100%' 
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    gap: 16
  },
  loadingText: { 
    fontSize: 16, 
    textAlign: 'center' 
  },
  errorCard: { 
    marginTop: 16, 
    paddingVertical: 16 
  },
  errorText: { 
    fontSize: 14, 
    textAlign: 'center' 
  },
});
