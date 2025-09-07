import { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setNetworkStatus, selectIsOnline } from '../store/offlineSlice';

// Global test state for toggling offline mode (controlled by debug screen)
let testOfflineState = false;

export function useNetworkStatus() {
  const dispatch = useAppDispatch();
  const reduxIsOnline = useAppSelector(selectIsOnline);

  useEffect(() => {
    // If in test mode, don't listen to real network changes
    if (testOfflineState) {
      return;
    }

    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = (state.isConnected && state.isInternetReachable) ?? false;
      dispatch(setNetworkStatus({ isOnline: online }));
    });

    // Get initial state
    NetInfo.fetch().then((state) => {
      const online = (state.isConnected && state.isInternetReachable) ?? false;
      dispatch(setNetworkStatus({ isOnline: online }));
    });

    return unsubscribe;
  }, [dispatch]);

  // Always return Redux state for consistency
  return reduxIsOnline;
}

// Test utility functions (only available in development)
export const testUtils = __DEV__ ? {
  setOfflineMode: (offline: boolean) => {
    testOfflineState = offline;
    const { store } = require('../store');
    store.dispatch(setNetworkStatus({ isOnline: !offline }));
  }
} : {};
