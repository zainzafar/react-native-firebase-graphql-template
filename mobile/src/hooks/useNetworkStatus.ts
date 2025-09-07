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

    let hasInitialized = false;

    // Get initial state first
    NetInfo.fetch().then((state) => {
      // If isInternetReachable is null (unknown), assume online if connected
      const online = state.isConnected && (state.isInternetReachable ?? true);
      // console.log('NetInfo.fetch() result:', JSON.stringify({ isConnected: state.isConnected, isInternetReachable: state.isInternetReachable, online }));
      dispatch(setNetworkStatus({ isOnline: online }));
      hasInitialized = true;
    });

    const unsubscribe = NetInfo.addEventListener((state) => {
      // Only dispatch after initial fetch is complete
      if (hasInitialized) {
        // If isInternetReachable is null (unknown), assume online if connected
        const online = state.isConnected && (state.isInternetReachable ?? true);
        dispatch(setNetworkStatus({ isOnline: online }));
      }
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
