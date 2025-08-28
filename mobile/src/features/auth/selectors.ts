import { RootState } from '../../store';

export const selectAuth = (state: RootState) => state.auth;
export const selectUser = (state: RootState) => state.auth.user;
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectAuthInitialized = (state: RootState) => state.auth.initialized;
export const selectIsSuperAdmin = (state: RootState) => Array.isArray(state.auth.user?.roles) && state.auth.user!.roles!.includes('SUPER_ADMIN');


