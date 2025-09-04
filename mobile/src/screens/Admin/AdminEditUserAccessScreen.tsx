import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, Modal, Pressable, ScrollView, Animated, PanResponder, Dimensions } from 'react-native';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { useRoute } from '@react-navigation/native';
import { useTheme } from '../../theme/ThemeProvider';
import { useAppSelector } from '../../store/hooks';
import { selectUserPermissions } from '../../features/auth/selectors';
import { useMutation, useQuery } from '@apollo/client/react';
import { Body, Button, Card, PermissionList } from '../../components';
import {
  QUERY_ADMIN_LIST_ASSIGNABLE_ROLES,
  QUERY_ADMIN_LIST_GRANTABLE_PERMISSIONS,
  QUERY_ADMIN_GET_USER,
  QUERY_ADMIN_GET_USER_RAW_PERMISSIONS,
  MUTATION_ADMIN_SET_USER_ROLE,
  MUTATION_ADMIN_SET_USER_PERMISSION,
} from '../../graphql/operations';

// Utility function to titleize role names
const titleizeRoleName = (roleName: string): string => {
  return roleName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

type Role = { id: string; name: string; description?: string | null; permissions: { id: string; name: string }[] };
type Permission = { id: string; name: string; description?: string | null };

export default function AdminEditUserAccessScreen() {
  const { colors } = useTheme();
  const route = useRoute<any>();
  const userId = route.params?.id as string;
  const adminPerms = useAppSelector(selectUserPermissions) as string[];
  const currentUser = useAppSelector((state) => state.auth.user);
  
  // Check if user is editing their own account
  const isEditingSelf = currentUser?.id === userId;

  // Check for new simplified permissions
  const canViewRoles = adminPerms.includes('ADMIN_ROLES_VIEW');
  const canViewPermissions = adminPerms.includes('ADMIN_PERMISSIONS_VIEW');

  const { data: rolesData } = useQuery<{ adminListAssignableRoles: Role[] }>(QUERY_ADMIN_LIST_ASSIGNABLE_ROLES, { skip: !canViewRoles });
  const { data: permsData } = useQuery<{ adminListAssignablePermissions: Permission[] }>(QUERY_ADMIN_LIST_GRANTABLE_PERMISSIONS, { skip: !canViewPermissions });
  const { data: userData } = useQuery<{ adminGetUser?: any }>(QUERY_ADMIN_GET_USER, { variables: { id: userId } });
  const { data: rawPermsData } = useQuery<{ adminGetUserRawPermissions: string[] }>(
    QUERY_ADMIN_GET_USER_RAW_PERMISSIONS,
    { variables: { id: userId }, skip: !canViewPermissions }
  );

  const [setRole, { loading: settingRole, error: setRoleError }] = useMutation(MUTATION_ADMIN_SET_USER_ROLE, {
    refetchQueries: [
      { query: QUERY_ADMIN_GET_USER, variables: { id: userId } },
      { query: QUERY_ADMIN_GET_USER_RAW_PERMISSIONS, variables: { id: userId } }
    ]
  });
  const [setUserPermission] = useMutation(MUTATION_ADMIN_SET_USER_PERMISSION);

  const roles = useMemo(() => (rolesData?.adminListAssignableRoles ?? []) as Role[], [rolesData?.adminListAssignableRoles]);
  const permissions = useMemo(() => (permsData?.adminListAssignablePermissions ?? []) as Permission[], [permsData?.adminListAssignablePermissions]);
  const [localRoleId, setLocalRoleId] = useState<string | null>(null);
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const sheetInitialY = Math.round(Dimensions.get('window').height * 0.60);
  const sheetTranslateY = useRef(new Animated.Value(sheetInitialY)).current;
  useEffect(() => {
    if (roleModalVisible) {
      sheetTranslateY.setValue(sheetInitialY);
      Animated.timing(sheetTranslateY, { toValue: 0, duration: 220, useNativeDriver: true }).start();
    }
  }, [roleModalVisible, sheetInitialY, sheetTranslateY]);
  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dy) > 4,
    onPanResponderMove: (_e, g) => { if (g.dy > 0) sheetTranslateY.setValue(g.dy); },
    onPanResponderRelease: (_e, g) => {
      if (g.dy > 120) {
        Animated.timing(sheetTranslateY, { toValue: sheetInitialY, duration: 180, useNativeDriver: true }).start(() => setRoleModalVisible(false));
      } else {
        Animated.timing(sheetTranslateY, { toValue: 0, duration: 160, useNativeDriver: true }).start();
      }
    },
  }), [sheetInitialY, sheetTranslateY]);
  
  // Sync localRoleId with the user's role whenever userData changes
  useEffect(() => {
    const userRole = userData?.adminGetUser?.role;
    if (userRole?.id) {
      setLocalRoleId(userRole.id);
    } else {
      setLocalRoleId(null);
    }
  }, [userData?.adminGetUser?.role]);

  const roleById = useMemo(() => {
    const map = new Map<string, Role>();
    roles.forEach((r) => map.set(r.id, r));
    return map;
  }, [roles]);

  const selectedRole = localRoleId ? roleById.get(localRoleId) ?? null : null;
  const rolePermissionNames = useMemo(() => new Set((selectedRole?.permissions ?? []).map((p) => p.name)), [selectedRole]);

  const [rawPermissions, setRawPermissions] = useState<string[]>(rawPermsData?.adminGetUserRawPermissions ?? []);
  useEffect(() => {
    if (rawPermsData?.adminGetUserRawPermissions) setRawPermissions(rawPermsData.adminGetUserRawPermissions);
  }, [rawPermsData?.adminGetUserRawPermissions]);

  // Filter roles to only show those the current admin can assign
  const assignableRoles = useMemo(() => {
    // The backend already filters roles based on delegation rules via canGrantRole()
    // We just need to respect what's returned
    return roles;
  }, [roles]);





  const canAssignPermission = (permName: string) => {
    // Check if the permission is in the assignable permissions list
    return assignablePermissions.some(perm => perm.name === permName);
  };

  // No need for granular permission disabling in the new system
  const isGranularPermissionDisabled = (_permName: string) => {
    return false;
  };

  const onSelectRole = async (roleId: string | null) => {
    try {
      await setRole({ variables: { id: userId, roleId } });
      // Update local state after successful mutation
      setLocalRoleId(roleId);
      // The mutation will automatically refetch the queries
    } catch (error) {
      console.error('Failed to set role:', error);
      // Don't update local state if mutation failed
    }
  };

  const onTogglePermission = async (permission: Permission, next: boolean) => {
    try {
      const res = await setUserPermission({ variables: { id: userId, permissionId: permission.id, enabled: next } });
      const updated = (res as any)?.data?.adminSetUserPermission as string[] | undefined;
      if (updated) setRawPermissions(updated);
    } catch {}
  };

  const renderRoleSelector = () => {
    if (!canViewRoles) return null;
    return (
      <Card style={styles.card}>
        <View style={styles.section}>
          <Body style={{ marginBottom: 12 }}>Select a role to inherit its permissions, or choose Manual Permissions to set direct user permissions. Only roles you can assign are shown.</Body>
          <Button
            title={localRoleId ? (titleizeRoleName(roleById.get(localRoleId!)?.name ?? 'Select role')) : 'Manual Permissions'}
            onPress={() => setRoleModalVisible(true)}
            variant="ghost"
            style={styles.triggerButton}
            icon="chevron-down"
            iconStyle="solid"
            iconRight
            disabled={isEditingSelf}
          />
          <Modal
            visible={roleModalVisible}
            transparent
            animationType="none"
            onRequestClose={() => setRoleModalVisible(false)}
            presentationStyle="overFullScreen"
          >
            <Pressable
              style={styles.modalBackdrop}
              onPress={() => {
                Animated.timing(sheetTranslateY, { toValue: sheetInitialY, duration: 180, useNativeDriver: true }).start(() => setRoleModalVisible(false));
              }}
            >
              <Animated.View
                style={[
                  styles.modalSheetBottom,
                  { backgroundColor: colors.card, borderColor: colors.border, transform: [{ translateY: sheetTranslateY }] },
                ]}
              >
                <View style={styles.dragHandleContainer} {...panResponder.panHandlers}>
                  <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />
                </View>
                <ScrollView style={styles.modalList} contentContainerStyle={styles.modalListContent}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => { setRoleModalVisible(false); onSelectRole(null); }}
                    disabled={settingRole}
                    style={styles.optionRow}
                  >
                    <View style={styles.optionText}>
                      <Body style={styles.optionTitle}>Manual Permissions</Body>
                      <Body style={styles.optionDesc}>Manage direct user permissions (no role)</Body>
                    </View>
                    {!localRoleId && (
                      <FontAwesome6 name="check" iconStyle="solid" size={18} color="#22C55E" />
                    )}
                  </Pressable>
                  {assignableRoles.length > 0 ? (
                    assignableRoles.map((r) => (
                      <Pressable
                        key={r.id}
                        accessibilityRole="button"
                        onPress={() => { setRoleModalVisible(false); onSelectRole(r.id); }}
                        disabled={settingRole}
                        style={styles.optionRow}
                      >
                        <View style={styles.optionText}>
                          <Body style={styles.optionTitle}>{titleizeRoleName(r.name)}</Body>
                          {!!r.description && <Body style={styles.optionDesc}>{r.description}</Body>}
                        </View>
                        {localRoleId === r.id && (
                          <FontAwesome6 name="check" iconStyle="solid" size={18} color="#22C55E" />
                        )}
                      </Pressable>
                    ))
                  ) : (
                    <View style={styles.optionRow}>
                      <View style={styles.optionText}>
                        <Body style={[styles.optionTitle, { color: colors.mutedText }]}>No roles available</Body>
                        <Body style={styles.optionDesc}>You don't have permission to assign any roles</Body>
                      </View>
                    </View>
                  )}
                </ScrollView>
              </Animated.View>
            </Pressable>
          </Modal>
          {setRoleError && <Body style={{ color: '#DC2626' }}>{String(setRoleError.message || setRoleError)}</Body>}
        </View>
      </Card>
    );
  };

  // Filter permissions to only show those the current admin can assign
  const assignablePermissions = useMemo(() => {
    return permissions.filter(p => {
      // Filter out delegation management permissions from regular user editing
      // These should only be managed in a dedicated delegation screen
      if (p.name.startsWith('ADMIN_ROLE_GRANT_RULES_') || p.name.startsWith('ADMIN_PERMISSION_GRANT_RULES_')) {
        return false;
      }
      
      // The backend already filters permissions based on delegation rules
      // We just need to respect what's returned
      return true;
    });
  }, [permissions]);

  // Group permissions by category
  const groupedPermissions = useMemo(() => {
    const userManagement: Permission[] = [];
    const system: Permission[] = [];
    
    assignablePermissions.forEach(p => {
      if (p.name.startsWith('ADMIN_DEBUG') || p.name.includes('ROLE') || p.name.includes('PERMISSION')) {
        system.push(p);
      } else {
        userManagement.push(p);
      }
    });
    
    return { userManagement, system };
  }, [assignablePermissions]);

  const renderPermissionSection = (title: string, permissions: Permission[]) => {
    if (permissions.length === 0) return null;
    
    // Pre-compute the maps for this permission section
    const helpTexts: { [permissionId: string]: string | undefined } = {};
    const canEnable: { [permissionId: string]: boolean } = {};
    const canDisable: { [permissionId: string]: boolean } = {};
    
    permissions.forEach(permission => {
      const inherited = selectedRole ? rolePermissionNames.has(permission.name) : false;
      const isGranularDisabled = isGranularPermissionDisabled(permission.name);
      const canAssign = canAssignPermission(permission.name);
      
      helpTexts[permission.id] = inherited ? 'Inherited from role' : undefined;
      canEnable[permission.id] = !isEditingSelf && !inherited && !isGranularDisabled && canAssign;
      canDisable[permission.id] = !isEditingSelf && !inherited && !isGranularDisabled && canAssign;
    });
    
    return (
      <Card style={styles.card}>
        <PermissionList
          permissions={permissions}
          selectedPermissions={permissions.filter(p => {
            const inherited = selectedRole ? rolePermissionNames.has(p.name) : false;
            const direct = rawPermissions.includes(p.name);
            const isGranularDisabled = isGranularPermissionDisabled(p.name);
            
            // For granular permissions, if global permission is active, they should be enabled
            let effective = inherited || direct;
            if (isGranularDisabled) {
              effective = true; // Granular permissions are automatically enabled when global is active
            }
            
            return effective;
          }).map(p => p.id)}
          onPermissionToggle={(permissionId, enabled) => {
            const permission = permissions.find(p => p.id === permissionId);
            if (permission) {
              onTogglePermission(permission, enabled);
            }
          }}
          showDescriptions={true}
          showNames={false}
          helpTexts={helpTexts}
          canEnable={canEnable}
          canDisable={canDisable}
        />
      </Card>
    );
  };

  const renderPermissions = () => {
    if (!canViewPermissions) return null;
    return (
      <>
        {renderPermissionSection('User Management', groupedPermissions.userManagement)}
        {renderPermissionSection('System', groupedPermissions.system)}
      </>
    );
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.pageContent}
      keyboardShouldPersistTaps="handled"
    > 
      {isEditingSelf && (
        <Card style={styles.card}>
          <Body style={{ color: '#DC2626', textAlign: 'center' }}>
            You cannot modify your own roles and permissions.
          </Body>
        </Card>
      )}
      {renderRoleSelector()}
      {renderPermissions()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  pageContent: { padding: 16 },
  section: { gap: 12 },
  card: { marginBottom: 16 },
  roleRow: { marginTop: 0 },

  separator: { height: 1, width: '100%' },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', padding: 0, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheetBottom: { width: '100%', height: '60%', borderTopLeftRadius: 16, borderTopRightRadius: 16, borderWidth: 1, overflow: 'hidden' },
  modalList: { maxHeight: '100%' },
  modalListContent: { paddingVertical: 8, paddingBottom: 16 },
  optionRow: { paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  optionTitle: { fontWeight: '600' },
  optionDesc: { opacity: 0.7, marginTop: 2 },
  optionText: { flex: 1, paddingRight: 12 },
  triggerButton: { alignSelf: 'stretch' },
  dragHandleContainer: { alignItems: 'center', paddingVertical: 8 },
  dragHandle: { width: 40, height: 4, borderRadius: 2, opacity: 0.7 },
});


