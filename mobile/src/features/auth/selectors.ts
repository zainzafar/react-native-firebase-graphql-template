import type { RootState } from '../../store';

export const selectUser = (state: RootState) => state?.auth?.user ?? null;
export const selectIsAuthenticated = (state: RootState) => state?.auth?.isAuthenticated ?? false;
export const selectAuthInitialized = (state: RootState) => state?.auth?.initialized ?? false;
export const selectAuth = (state: RootState) => state?.auth ?? null;
export const selectUserPermissions = (state: RootState) => state?.auth?.user?.permissions ?? [];


