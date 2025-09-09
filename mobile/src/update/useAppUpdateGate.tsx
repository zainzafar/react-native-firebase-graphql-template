import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform, AppState, Linking } from 'react-native';
import { useApolloClient } from '@apollo/client/react';
import { useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';
import { QUERY_APP_SETTINGS } from '../graphql/operations';
import { compareSemver } from './versionUtils';
import { RootState } from '../store';
import type { AppSettings, AppSettingsQuery } from '../generated/graphql';
import { AppPlatform } from '../generated/graphql';

type Gate = {
  hard: boolean;
  soft: boolean;
  message?: string | null;
  storeUrl?: string;
  currentVersion?: string;
  newVersion?: string;
  canSkip?: boolean; // Admin users can skip
};

type CachedSettings = {
  t: number; // timestamp
  s: AppSettings; // settings
};

const CACHE_KEY = 'app.settings.v1';
const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
const DEFAULT_SNOOZE_SECONDS = 3600; // 1 hour

export function useAppUpdateGate() {
  const apolloClient = useApolloClient();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [gate, setGate] = useState<Gate>({ hard: false, soft: false });
  const [isDeferred, setIsDeferred] = useState(false);
  const [deferReason, setDeferReason] = useState<string | null>(null);
  const lastSoftPromptAt = useRef<number>(0);
  const authStateRef = useRef({ user, isAuthenticated });

  // Keep ref updated with current auth state
  useEffect(() => {
    authStateRef.current = { user, isAuthenticated };
  }, [user, isAuthenticated]);

  const platform: AppPlatform = Platform.OS === 'ios' ? AppPlatform.Ios : AppPlatform.Android;

  const getCurrentVersion = useCallback(async (): Promise<string> => {
    try {
      return await DeviceInfo.getVersion();
    } catch (error) {
      console.warn('[AppUpdateGate] Failed to get app version:', error);
      return '0.0.0';
    }
  }, []);

  const checkAdminPermissions = useCallback((): boolean => {
    const { user: currentUser, isAuthenticated: currentAuth } = authStateRef.current;
    
    // Return false if user is not authenticated
    if (!currentAuth || !currentUser) return false;
    
    // Check if user has admin app releases permission
    // ADMIN_APP_RELEASES_VIEW or ADMIN_APP_RELEASES_MANAGE
    return currentUser.permissions?.includes('ADMIN_APP_RELEASES_VIEW') || currentUser.permissions?.includes('ADMIN_APP_RELEASES_MANAGE') || false;
  }, []); // No dependencies - uses ref for current state

  const fetchAppSettings = useCallback(async (): Promise<AppSettings | null> => {
    try {
      const result = await apolloClient.query<AppSettingsQuery>({
        query: QUERY_APP_SETTINGS,
        variables: { platform },
        fetchPolicy: 'network-only', // Always fetch fresh data
      });

      return result.data?.appSettings || null;
    } catch (error) {
      console.warn('[AppUpdateGate] Failed to fetch app settings:', error);
      return null;
    }
  }, [apolloClient, platform]);

  const getCachedSettings = useCallback(async (): Promise<AppSettings | null> => {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const parsed: CachedSettings = JSON.parse(cached);
      const now = Date.now();

      // Check if cache is still valid
      if (now - parsed.t > CACHE_DURATION) {
        await AsyncStorage.removeItem(CACHE_KEY);
        return null;
      }

      return parsed.s;
    } catch (error) {
      console.warn('[AppUpdateGate] Failed to read cached settings:', error);
      return null;
    }
  }, []);

  const setCachedSettings = useCallback(async (settings: AppSettings): Promise<void> => {
    try {
      const cached: CachedSettings = {
        t: Date.now(),
        s: settings,
      };
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cached));
    } catch (error) {
      console.warn('[AppUpdateGate] Failed to cache settings:', error);
    }
  }, []);

  const evaluateGate = useCallback(async (currentVersion: string, settings: AppSettings): Promise<Gate> => {
    const belowMin = compareSemver(currentVersion, settings.minVersion) < 0;
    const behindLatest = compareSemver(currentVersion, settings.latestVersion) < 0;
    const forcedNow = !!settings.enforced || (settings.forceAt ? Date.now() >= Date.parse(settings.forceAt) : false);
    const canSkip = checkAdminPermissions();

    const baseGate = {
      message: settings.message,
      storeUrl: settings.storeUrl,
      currentVersion,
      newVersion: settings.latestVersion,
      canSkip,
    };

    if (belowMin) {
      return { 
        hard: true, 
        soft: false, 
        ...baseGate
      };
    } else if (behindLatest) {
      if (forcedNow) {
        return { 
          hard: true, 
          soft: false, 
          ...baseGate
        };
      } else {
        return { 
          hard: false, 
          soft: true, 
          ...baseGate
        };
      }
    } else {
      return { hard: false, soft: false };
    }
  }, [checkAdminPermissions]);

  const check = useCallback(async (): Promise<void> => {
    if (isDeferred) {
      console.log(`[AppUpdateGate] Check deferred due to: ${deferReason}`);
      return;
    }

    try {
      const currentVersion = await getCurrentVersion();
      console.log(`[AppUpdateGate] Current version: ${currentVersion}`);

      // Try to get fresh settings first, fallback to cache
      let settings = await fetchAppSettings();
      if (!settings) {
        settings = await getCachedSettings();
        if (!settings) {
          console.warn('[AppUpdateGate] No settings available (fresh or cached)');
          return;
        }
        console.log('[AppUpdateGate] Using cached settings');
      } else {
        console.log('[AppUpdateGate] Using fresh settings');
        await setCachedSettings(settings);
      }

      const newGate = await evaluateGate(currentVersion, settings);
      
      // Apply soft prompt snooze logic
      if (newGate.soft) {
        const snoozeMs = (settings.softSnoozeSeconds ?? DEFAULT_SNOOZE_SECONDS) * 1000;
        const timeSinceLastPrompt = Date.now() - lastSoftPromptAt.current;
        
        if (timeSinceLastPrompt < snoozeMs) {
          console.log(`[AppUpdateGate] Soft prompt snoozed for ${snoozeMs - timeSinceLastPrompt}ms more`);
          setGate({ hard: false, soft: false });
          return;
        }
      }

      console.log('[AppUpdateGate] Gate evaluation:', newGate);
      setGate(newGate);
    } catch (error) {
      console.error('[AppUpdateGate] Check failed:', error);
    }
  }, [isDeferred, deferReason, getCurrentVersion, fetchAppSettings, getCachedSettings, setCachedSettings, evaluateGate]);

  const openStore = useCallback((): void => {
    console.log('[AppUpdateGate] Opening store URL:', gate.storeUrl);
    if (gate.storeUrl) {
      try {
        Linking.openURL(gate.storeUrl);
      } catch (error) {
        console.warn('[AppUpdateGate] Failed to open store URL:', error);
      }
    } else {
      console.warn('[AppUpdateGate] No store URL available');
    }
  }, [gate.storeUrl]);

  const snoozeSoft = useCallback((): void => {
    lastSoftPromptAt.current = Date.now();
    setGate({ hard: false, soft: false });
    console.log('[AppUpdateGate] Soft prompt snoozed');
  }, []);

  const defer = useCallback((reason?: string): void => {
    setIsDeferred(true);
    setDeferReason(reason || 'unknown');
    setGate({ hard: false, soft: false });
    console.log(`[AppUpdateGate] Deferred: ${reason || 'unknown'}`);
  }, []);

  const resume = useCallback((): void => {
    setIsDeferred(false);
    setDeferReason(null);
    console.log('[AppUpdateGate] Resumed');
    // Trigger a check after resuming
    setTimeout(check, 100);
  }, [check]);

  const refresh = useCallback(async (): Promise<void> => {
    console.log('[AppUpdateGate] Manual refresh triggered');
    await check();
  }, [check]);

  const skip = useCallback((): void => {
    setGate({ hard: false, soft: false });
    console.log('[AppUpdateGate] Update skipped by admin user');
  }, []);

  // Check on mount and when app becomes active
  useEffect(() => {
    check();

    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        console.log('[AppUpdateGate] App became active, checking for updates');
        check();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [check]);

  return {
    gate,
    openStore,
    snoozeSoft,
    defer,
    resume,
    refresh,
    skip,
    getCachedSettings, // Expose cached settings access
  };
}
