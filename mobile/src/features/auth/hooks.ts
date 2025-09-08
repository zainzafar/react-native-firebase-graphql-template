import { useAppSelector } from '../../store/hooks';
import { selectUserPermissions, selectIsImpersonating } from './selectors';

export function usePermissions() {
  const permissions = useAppSelector(selectUserPermissions);
  const isImpersonating = useAppSelector(selectIsImpersonating);

  // Create permission selectors within the hook
  const hasPermission = (permission: string) => {
    return permissions.includes(permission);
  };

  // Check if user has any ADMIN_ permission AND is not impersonating
  const canAccessAdmin = permissions.some(permission => permission.startsWith('ADMIN_')) && !isImpersonating;

  return {
    // Check admin access
    canAccessAdmin,
    
    // Dynamic permission checker
    hasPermission,
    
    // Convenience methods for common permissions (using new simplified system)
    // All admin permissions are disabled during impersonation
    canViewUsers: hasPermission('ADMIN_USERS_VIEW_ALL') && !isImpersonating,
    canSearchUsers: hasPermission('ADMIN_USERS_SEARCH') && !isImpersonating,
    canUpdateUserProfile: hasPermission('ADMIN_USERS_UPDATE_PROFILE') && !isImpersonating,
    canUpdateUserPassword: hasPermission('ADMIN_USERS_UPDATE_PASSWORD') && !isImpersonating,
    canDeleteUsers: hasPermission('ADMIN_USERS_DELETE') && !isImpersonating,
    canImpersonateUsers: hasPermission('ADMIN_USERS_IMPERSONATE') && !isImpersonating,
    canAccessDebug: hasPermission('ADMIN_DEBUG') && !isImpersonating,
    
    // New delegation system permissions
    canViewRoles: hasPermission('ADMIN_ROLES_VIEW') && !isImpersonating,
    canViewPermissions: hasPermission('ADMIN_PERMISSIONS_VIEW') && !isImpersonating,
    canManageRoleGrantRules: hasPermission('ADMIN_ROLE_GRANT_RULES_VIEW') && !isImpersonating,
    canManagePermissionGrantRules: hasPermission('ADMIN_PERMISSION_GRANT_RULES_VIEW') && !isImpersonating,
    
    // App release permissions
    canViewAppReleases: hasPermission('ADMIN_APP_RELEASES_VIEW') && !isImpersonating,
    canManageAppReleases: hasPermission('ADMIN_APP_RELEASES_MANAGE') && !isImpersonating,
  };
}
