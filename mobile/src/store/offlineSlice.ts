import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface OfflineState {
  isOnline: boolean;
}

const initialState: OfflineState = {
  isOnline: false,
};

const offlineSlice = createSlice({
  name: 'offline',
  initialState,
  reducers: {
    setNetworkStatus(state, action: PayloadAction<{ isOnline: boolean }>) {
      state.isOnline = action.payload.isOnline;
    },
  },
});

export const { setNetworkStatus } = offlineSlice.actions;
export const selectIsOnline = (state: { offline: OfflineState }) => state.offline.isOnline;

export default offlineSlice.reducer;
