import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface OfflineState {
  isOnline: boolean;
  isInitialized: boolean;
}

const initialState: OfflineState = {
  isOnline: true,
  isInitialized: false,
};

const offlineSlice = createSlice({
  name: 'offline',
  initialState,
  reducers: {
    setNetworkStatus(state, action: PayloadAction<{ isOnline: boolean }>) {
      state.isOnline = action.payload.isOnline;
      state.isInitialized = true;
    },
  },
});

export const { setNetworkStatus } = offlineSlice.actions;
export const selectIsOnline = (state: { offline: OfflineState }) => state.offline.isOnline;
export const selectIsNetworkInitialized = (state: { offline: OfflineState }) => state.offline.isInitialized;

export default offlineSlice.reducer;
