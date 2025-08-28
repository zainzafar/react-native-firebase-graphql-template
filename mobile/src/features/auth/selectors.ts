import { RootState } from '../../store';

export const selectAuthInitialized = (state: RootState) => state.auth.initialized;
export const selectIsAuthenticated = (state: RootState) => !!state.auth.user;
export const selectUser = (state: RootState) => state.auth.user;
export const selectAuth = (state: RootState) => state.auth;

// Permission-based selectors
export const selectHasPermission = (permission: string) => (state: RootState) => 
  Array.isArray(state.auth.user?.permissions) && state.auth.user!.permissions!.includes(permission);

// Convenience selectors for common permissions
export const selectHasAdminAccess = (state: RootState) => 
  selectHasPermission('ADMIN_ACCESS')(state);

export const selectCanViewUsers = (state: RootState) => 
  selectHasPermission('ADMIN_USERS_VIEW')(state);

export const selectCanSearchUsers = (state: RootState) => 
  selectHasPermission('ADMIN_USERS_SEARCH')(state);

export const selectCanEditUsers = (state: RootState) => 
  selectHasPermission('ADMIN_USERS_EDIT')(state);

export const selectCanDeleteUsers = (state: RootState) => 
  selectHasPermission('ADMIN_USERS_DELETE')(state);

export const selectCanImpersonateUsers = (state: RootState) => 
  selectHasPermission('ADMIN_USERS_IMPERSONATE')(state);

export const selectCanAccessDebug = (state: RootState) => 
  selectHasPermission('ADMIN_DEBUG')(state);

// Legacy role-based selector for backward compatibility
export const selectIsSuperAdmin = (state: RootState) => 
  Array.isArray(state.auth.user?.roles) && state.auth.user!.roles!.includes('SUPER_ADMIN');


