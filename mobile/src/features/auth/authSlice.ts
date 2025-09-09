import { PayloadAction, createSlice } from '@reduxjs/toolkit';

export type Role = {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type UserIdentity = {
  providerId: string;
  providerUid: string;
  lastUsedAt?: string;
};

export type AuthUser = {
  id: string;
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  phoneNumber?: string;
  lastLoginProvider?: string;
  roles?: Role[];
  permissions?: string[];
  identities?: UserIdentity[];
};

export type AuthState = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  initialized: boolean;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error?: string;
  impersonation: {
    isActive: boolean;
    originalUser: AuthUser | null;
    impersonatedUser: AuthUser | null;
  };
};

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  initialized: false,
  status: 'idle',
  error: undefined,
  impersonation: {
    isActive: false,
    originalUser: null,
    impersonatedUser: null,
  },
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<AuthUser>) {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.initialized = true;
      state.status = 'succeeded';
      state.error = undefined;
    },
    updateUser(state, action: PayloadAction<Partial<AuthUser>>) {
      if (!state.user) return;
      state.user = { ...state.user, ...action.payload };
    },
    logout(state) {
      state.user = null;
      state.isAuthenticated = false;
      state.initialized = true;
      state.status = 'idle';
      state.error = undefined;
      // Clear impersonation state on logout
      state.impersonation = {
        isActive: false,
        originalUser: null,
        impersonatedUser: null,
      };
    },
    markInitialized(state) {
      state.initialized = true;
    },
    setError(state, action: PayloadAction<string | undefined>) {
      state.error = action.payload;
      state.status = action.payload ? 'failed' : 'idle';
    },
    setStatus(state, action: PayloadAction<AuthState['status']>) {
      state.status = action.payload;
    },
    beginImpersonation(state, action: PayloadAction<{ token: string; user: AuthUser }>) {
      // Snapshot original user if not already set
      if (!state.impersonation.originalUser && state.user) {
        state.impersonation.originalUser = state.user;
      }
      
      // Set impersonation state
      state.impersonation.isActive = true;
      state.impersonation.impersonatedUser = action.payload.user;
      state.user = action.payload.user;
    },
    endImpersonation(state) {
      // Restore original user
      if (state.impersonation.originalUser) {
        state.user = state.impersonation.originalUser;
      }
      
      // Reset impersonation state
      state.impersonation.isActive = false;
      state.impersonation.impersonatedUser = null;
      state.impersonation.originalUser = null;
    },
  },
});

export const { setUser, updateUser, logout, markInitialized, setError, setStatus, beginImpersonation, endImpersonation } = authSlice.actions;
export default authSlice.reducer;


