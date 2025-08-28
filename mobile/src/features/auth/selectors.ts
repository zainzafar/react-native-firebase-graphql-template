import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../store';

// Base selectors
export const selectUser = (state: RootState) => state.auth.user;
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectAuthInitialized = (state: RootState) => state.auth.initialized;
export const selectAuth = (state: RootState) => state.auth;

// Permission-based selectors
export const selectHasPermission = (permission: string) => 
  createSelector(
    [selectUser],
    (user) => user?.permissions?.includes(permission) ?? false
  );

// Admin access selector - checks if user has any ADMIN_ permission
export const selectCanAccessAdmin = 
  createSelector(
    [selectUser],
    (user) => user?.permissions?.some(permission => permission.startsWith('ADMIN_')) ?? false
  );

// Specific permission selectors
export const selectCanViewUsers = 
  selectHasPermission('ADMIN_USERS_VIEW');

export const selectCanSearchUsers = 
  selectHasPermission('ADMIN_USERS_SEARCH');

export const selectCanEditUsers = 
  selectHasPermission('ADMIN_USERS_EDIT');

export const selectCanDeleteUsers = 
  selectHasPermission('ADMIN_USERS_DELETE');

export const selectCanImpersonateUsers = 
  selectHasPermission('ADMIN_USERS_IMPERSONATE');

export const selectCanAccessDebug =  
  selectHasPermission('ADMIN_DEBUG');


