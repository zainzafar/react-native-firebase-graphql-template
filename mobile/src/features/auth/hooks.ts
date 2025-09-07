import { useAppSelector } from '../../store/hooks';
import { selectUserPermissions } from './selectors';

export function usePermissions() {
  const permissions = useAppSelector(selectUserPermissions);

  // Create permission selectors within the hook
  const hasPermission = (permission: string) => {
    return permissions.includes(permission);
  };

  // Check if user has any ADMIN_ permission
  const canAccessAdmin = permissions.some(permission => permission.startsWith('ADMIN_'));

  return {
    // Check admin access
    canAccessAdmin,
    
    // Dynamic permission checker
    hasPermission,
    
    // Convenience methods for common permissions (using new simplified system)
    canViewUsers: hasPermission('ADMIN_USERS_VIEW_ALL'),
    canSearchUsers: hasPermission('ADMIN_USERS_SEARCH'),
    canUpdateUserProfile: hasPermission('ADMIN_USERS_UPDATE_PROFILE'),
    canUpdateUserPassword: hasPermission('ADMIN_USERS_UPDATE_PASSWORD'),
    canDeleteUsers: hasPermission('ADMIN_USERS_DELETE'),
    canImpersonateUsers: hasPermission('ADMIN_USERS_IMPERSONATE'),
    canAccessDebug: hasPermission('ADMIN_DEBUG'),
    
    // New delegation system permissions
    canViewRoles: hasPermission('ADMIN_ROLES_VIEW'),
    canViewPermissions: hasPermission('ADMIN_PERMISSIONS_VIEW'),
    canManageRoleGrantRules: hasPermission('ADMIN_ROLE_GRANT_RULES_VIEW'),
    canManagePermissionGrantRules: hasPermission('ADMIN_PERMISSION_GRANT_RULES_VIEW'),
    
    // App release permissions
    canViewAppReleases: hasPermission('ADMIN_APP_RELEASES_VIEW'),
    canManageAppReleases: hasPermission('ADMIN_APP_RELEASES_MANAGE'),
  };
}
