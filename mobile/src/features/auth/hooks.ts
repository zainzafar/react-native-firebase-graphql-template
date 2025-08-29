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
    
    // Convenience methods for common permissions
    canViewUsers: hasPermission('ADMIN_USERS_VIEW'),
    canSearchUsers: hasPermission('ADMIN_USERS_SEARCH'),
    canEditUsers: hasPermission('ADMIN_USERS_EDIT'),
    canDeleteUsers: hasPermission('ADMIN_USERS_DELETE'),
    canImpersonateUsers: hasPermission('ADMIN_USERS_IMPERSONATE'),
    canAccessDebug: hasPermission('ADMIN_DEBUG'),
  };
}
