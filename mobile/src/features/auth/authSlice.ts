import { PayloadAction, createSlice } from '@reduxjs/toolkit';

export type Role = {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
};

export type AuthUser = {
  id: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  lastLoginProvider?: string;
  roles?: Role[];
  permissions?: string[];
};

export type AuthState = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  initialized: boolean;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error?: string;
};

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  initialized: false,
  status: 'idle',
  error: undefined,
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
  },
});

export const { setUser, updateUser, logout, markInitialized, setError, setStatus } = authSlice.actions;
export default authSlice.reducer;


