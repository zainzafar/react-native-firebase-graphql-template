import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { getApp } from '@react-native-firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  getIdToken,
  FirebaseAuthTypes,
  updateProfile,
  signInWithPhoneNumber,
} from '@react-native-firebase/auth';
import { GoogleSignin, isSuccessResponse, isCancelledResponse } from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, AppleAuthProvider, signInWithCredential } from '@react-native-firebase/auth';
import { googleWebClientId } from '../config/firebase';
import { apolloClient } from '../graphql/client';
import { MUTATION_LOGIN_WITH_ID_TOKEN, QUERY_ME } from '../graphql/operations';
import { saveAccessToken, clearAccessToken, getAccessToken, getImpersonationToken, clearImpersonationToken } from './tokenStorage';
import { handleHardSignOut } from './session';
import { useAppDispatch } from '../store/hooks';
import { logout, setUser as setUserAction, beginImpersonation, endImpersonation, type AuthUser } from '../features/auth/authSlice';
import { persistor, store } from '../store';
import AppleAuth from '@invertase/react-native-apple-authentication';
import type { UserFieldsFragment, LoginWithIdTokenMutation, MeQuery } from '../generated/graphql';

// Helper function to create user profile from GraphQL data
const createUserProfile = (userData: UserFieldsFragment): AuthUser => ({
  id: userData.id,
  uid: userData.uid,
  email: userData.email ?? undefined,
  displayName: userData.displayName ?? undefined,
  photoURL: userData.photoURL ?? undefined,
  phoneNumber: userData.phoneNumber ?? undefined,
  lastLoginProvider: userData.lastLoginProvider ?? undefined,
  permissions: Array.isArray(userData.permissions) ? userData.permissions : [],
  identities: Array.isArray(userData.identities) ? userData.identities : [],
  roles: userData.role ? [{ id: userData.role.id, name: userData.role.name }] : [],
});

type AuthContextValue = {
  user: FirebaseAuthTypes.User | null;
  initializing: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  createUserWithEmail: (email: string, password: string, displayName?: string) => Promise<void>;
  getSignInMethodsForEmail: (email: string) => Promise<string[]>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithPhone: (phoneNumber: string) => Promise<{ confirm: (code: string) => Promise<unknown> }>;
  confirmPhoneCode: (confirmation: { confirm: (code: string) => Promise<unknown> }, code: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [initializing, setInitializing] = useState(true);

  const dispatch = useAppDispatch();
  const navigation = useNavigation();

  useEffect(() => {
    const app = getApp();
    const authInstance = getAuth(app);
    const unsubscribe = onAuthStateChanged(authInstance, async (u) => {
      setUser(u);
      if (u) {
        // Get fresh ID token and exchange for app JWT to get database user data
        try {
          const freshIdToken = await getIdToken(u, true);
          if (freshIdToken) {
            const { data } = await apolloClient.mutate<LoginWithIdTokenMutation>({
              mutation: MUTATION_LOGIN_WITH_ID_TOKEN,
              variables: { idToken: freshIdToken },
            });
            const accessToken = data?.loginWithIdToken?.accessToken;
            const userData = data?.loginWithIdToken?.user;
            if (accessToken) {
              await saveAccessToken(accessToken);
            }
            if (userData) {
              // Update Redux state with database user data only
              dispatch(setUserAction(createUserProfile(userData as UserFieldsFragment)));
            }
          }
        } catch (e) {
          console.log('[Auth] Failed to get database user data on auth state change:', e);
          // Fallback to logout if we can't get database data
          dispatch(logout());
        }
      } else {
        dispatch(logout());
      }
      if (initializing) setInitializing(false);
    });
    return unsubscribe;
  }, [initializing, dispatch]);

  // Validate existing app JWT on boot; if invalid, clear it
  useEffect(() => {
    (async () => {
      const token = await getAccessToken();
      if (token) {
        try {
          const { data } = await apolloClient.query<MeQuery>({ 
            query: QUERY_ME, 
            fetchPolicy: 'network-only' 
          });
          const userData = data?.me;
          if (userData) {
            // Update Redux state with database user data
            dispatch(setUserAction(createUserProfile(userData as UserFieldsFragment)));
          }
        } catch {
          await clearAccessToken();
        }
      }
    })();
  }, [dispatch]);

  // Check for impersonation token on app startup
  useEffect(() => {
    (async () => {
      const impersonationToken = await getImpersonationToken();
      if (impersonationToken) {
        try {
          // Fetch user data for impersonated user
          const { data } = await apolloClient.query<MeQuery>({ 
            query: QUERY_ME, 
            fetchPolicy: 'network-only' 
          });
          const userData = data?.me;
          if (userData) {
            // Set impersonation state - this will hide admin UI immediately
            dispatch(beginImpersonation({
              token: impersonationToken,
              user: createUserProfile(userData as UserFieldsFragment)
            }));
          } else {
            // Invalid impersonation token, clear it
            await clearImpersonationToken();
            dispatch(endImpersonation());
          }
        } catch (error) {
          console.log('[Auth] Impersonation token validation failed:', error);
          // Clear invalid impersonation token
          await clearImpersonationToken();
          dispatch(endImpersonation());
        }
      }
    })();
  }, [dispatch]);

  // Monitor for impersonation token expiry (401 errors during impersonation)
  useEffect(() => {
    const checkImpersonationToken = async () => {
      const impersonationToken = await getImpersonationToken();
      const isImpersonating = impersonationToken !== null;
      
      // If we think we're impersonating but no token exists, end impersonation
      if (!isImpersonating) {
        // Check if Redux state thinks we're still impersonating
        // This handles the case where the token was cleared by the error link
        const currentState = store.getState();
        if (currentState.auth?.impersonation?.isActive) {
          console.log('[Auth] Impersonation token was cleared, ending impersonation...');
          dispatch(endImpersonation());
          
          // Reset navigation and go to home screen
          (navigation as NavigationProp<Record<string, object | undefined>>).reset({
            index: 0,
            routes: [{ name: 'Home' }],
          });
        }
      }
    };

    // Check periodically for token changes
    const interval = setInterval(checkImpersonationToken, 5000); // Check every 5 seconds
    
    return () => clearInterval(interval);
  }, [dispatch, navigation]);

  // Refetch user data when app comes to foreground
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && user) {
        // App has come to the foreground and user is logged in
        try {
          console.log('[Auth] App came to foreground, refetching user data...');
          const { data } = await apolloClient.query<MeQuery>({ 
            query: QUERY_ME, 
            fetchPolicy: 'network-only' 
          });
          const userData = data?.me;
          if (userData) {
            // Update Redux state with fresh database user data
            dispatch(setUserAction(createUserProfile(userData as UserFieldsFragment)));
            console.log('[Auth] User data refreshed successfully');
          }
        } catch (error) {
          console.log('[Auth] Failed to refetch user data on app foreground:', error);
          // Don't logout on error - just log it, as the user might still be valid
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [user, dispatch]);

  const exchangeIdTokenForAppJWT = useCallback(async (authMethod: string) => {
    const app = getApp();
    const authInstance = getAuth(app);
    const freshIdToken = authInstance.currentUser ? await getIdToken(authInstance.currentUser, true) : undefined;
    if (freshIdToken) {
      try {
        console.log(`[Auth] Exchanging ${authMethod} Firebase ID token for app JWT via mutation`);
        const { data } = await apolloClient.mutate<LoginWithIdTokenMutation>({
          mutation: MUTATION_LOGIN_WITH_ID_TOKEN,
          variables: { idToken: freshIdToken },
        });
        const accessToken = data?.loginWithIdToken?.accessToken;
        const userData = data?.loginWithIdToken?.user;
        if (accessToken) {
          await saveAccessToken(accessToken);
        }
        if (userData) {
          // Update Redux state with user data from GraphQL (includes lastLoginProvider)
          dispatch(setUserAction(createUserProfile(userData as UserFieldsFragment)));
        }
      } catch (e) {
        console.log(`[Auth] loginWithIdToken mutation failed after ${authMethod} sign-in`, e);
        throw e;
      }
    } else {
      console.log(`[Auth] No fresh Firebase ID token after ${authMethod} sign-in`);
    }
  }, [dispatch]);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const app = getApp();
    const authInstance = getAuth(app);
    await signInWithEmailAndPassword(authInstance, email.trim(), password);
    await exchangeIdTokenForAppJWT('Email');
  }, [exchangeIdTokenForAppJWT]);

  const createUserWithEmail = useCallback(async (email: string, password: string, displayName?: string) => {
    const app = getApp();
    const authInstance = getAuth(app);
    await createUserWithEmailAndPassword(authInstance, email.trim(), password);
    if (displayName && authInstance.currentUser) {
      try {
        await updateProfile(authInstance.currentUser, { displayName });
      } catch {}
    }
    await exchangeIdTokenForAppJWT('Email');
  }, [exchangeIdTokenForAppJWT]);

  const getSignInMethodsForEmail = useCallback(async (email: string) => {
    const app = getApp();
    const authInstance = getAuth(app);
    const list = await fetchSignInMethodsForEmail(authInstance, email.trim());
    return Array.isArray(list) ? list : [];
  }, []);

  const signOut = useCallback(async () => {
    await handleHardSignOut();
    await persistor.purge();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      GoogleSignin.configure({
        webClientId: googleWebClientId,
        forceCodeForRefreshToken: true,
        scopes: ['profile', 'email'],
      });
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const signInResponse = await GoogleSignin.signIn();
      if (isCancelledResponse(signInResponse)) {
        console.log('[Auth] Google Sign-In cancelled by user');
        return; // Silently return without throwing an error
      }
      if (!isSuccessResponse(signInResponse)) {
        throw new Error('Google Sign-In failed');
      }
      const idToken = signInResponse.data.idToken;
      const gUser = signInResponse.data.user;
      if (!idToken) throw new Error('Google Sign-In failed: no idToken returned');
      const app = getApp();
      const authInstance = getAuth(app);
      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(authInstance, credential);
      // Ensure Firebase profile has a display name; set from Google profile if missing
      try {
        const cur = authInstance.currentUser;
        if (cur) {
          const existingName: string | undefined = cur.displayName || undefined;
          const candidateName: string | undefined = (gUser?.name as string | undefined) ||
            (gUser?.givenName ? `${gUser.givenName} ${gUser?.familyName || ''}`.trim() : undefined);
          if (!existingName && candidateName) {
            await updateProfile(cur, { displayName: candidateName });
          }
        }
      } catch {}
      await exchangeIdTokenForAppJWT('Google');
    } catch (e: unknown) {
      // Handle user cancellation gracefully
      const error = e as { code?: string; message?: string };
      if (error?.code === 'SIGN_IN_CANCELLED' || 
          error?.code === 'SIGN_IN_REQUIRED' ||
          error?.message?.includes('cancelled') ||
          error?.message?.includes('canceled') ||
          error?.message?.includes('user_cancelled') ||
          error?.message?.includes('user_canceled')) {
        // User cancelled the Google Sign-In flow - this is not an error
        console.log('[Auth] Google Sign-In cancelled by user');
        return; // Silently return without throwing an error
      }
      // Re-throw other errors
      throw e;
    }
  }, [exchangeIdTokenForAppJWT]);

  const signInWithApple = useCallback(async () => {
    // If not supported (e.g., Android), silently return
    if (!AppleAuth?.isSupported) {
      throw new Error('Apple Sign-In not supported on this device');
    }
    try {
      // Generate a nonce and include it on the request, per Firebase docs
      const rawNonce = Array.from({ length: 32 })
        .map(() => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.charAt(Math.floor(Math.random() * 62)))
        .join('');
      // Request Apple credential (identity token)
      const response = await AppleAuth.performRequest({
        requestedOperation: AppleAuth.Operation.LOGIN,
        requestedScopes: [AppleAuth.Scope.EMAIL, AppleAuth.Scope.FULL_NAME],
        nonce: rawNonce,
      });
      const { identityToken } = response;
      if (!identityToken) throw new Error('Apple Sign-In failed: no identity token');
      const app = getApp();
      const authInstance = getAuth(app);
      const credential = AppleAuthProvider.credential(identityToken, rawNonce);
      await signInWithCredential(authInstance, credential);
      await exchangeIdTokenForAppJWT('Apple');
    } catch (e: unknown) {
      // Handle user cancellation gracefully
      const error = e as { code?: number; message?: string };
      if (error?.code === 1001 || error?.message?.includes('1001')) {
        // User cancelled the Apple Sign-In flow - this is not an error
        console.log('[Auth] Apple Sign-In cancelled by user');
        return; // Silently return without throwing an error
      }
      // Re-throw other errors
      throw e;
    }
  }, [exchangeIdTokenForAppJWT]);

  const signInWithPhone = useCallback(async (phoneNumber: string) => {
    try {
      const app = getApp();
      const authInstance = getAuth(app);
      const confirmation = await signInWithPhoneNumber(authInstance, phoneNumber);
      return confirmation;
    } catch (e: unknown) {
      console.error('Phone auth error:', e);
      let errorMessage = 'Failed to send code';
      
      const error = e as { code?: string; message?: string };
      if (error?.code === 'auth/invalid-multi-factor-session') {
        errorMessage = 'Phone authentication not properly configured. Please check Firebase settings.';
      } else if (error?.code === 'auth/invalid-phone-number') {
        errorMessage = 'Invalid phone number format';
      } else if (error?.code === 'auth/too-many-requests') {
        errorMessage = 'Too many attempts. Please try again later.';
      } else if (error?.code === 'auth/quota-exceeded') {
        errorMessage = 'SMS quota exceeded. Please try again later.';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  }, []);

  const confirmPhoneCode = useCallback(async (confirmation: { confirm: (code: string) => Promise<unknown> }, code: string) => {
    try {
      const result = await confirmation.confirm(code);
      console.log('Sign in result:', result);
      await exchangeIdTokenForAppJWT('Phone');
    } catch (e: unknown) {
      console.error('Code confirmation error:', e);
      let errorMessage = 'Failed to confirm code';
      
      const error = e as { code?: string; message?: string };
      if (error?.code === 'auth/invalid-verification-code') {
        errorMessage = 'Invalid verification code. Please check the code and try again.';
      } else if (error?.code === 'auth/code-expired') {
        errorMessage = 'Verification code has expired. Please request a new code.';
      } else if (error?.code === 'auth/too-many-requests') {
        errorMessage = 'Too many attempts. Please try again later.';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  }, [exchangeIdTokenForAppJWT]);

  const updatePassword = useCallback(async (newPassword: string) => {
    try {
      const app = getApp();
      const authInstance = getAuth(app);
      const currentUser = authInstance.currentUser;
      
      if (!currentUser) {
        throw new Error('No user is currently signed in');
      }

      await currentUser.updatePassword(newPassword);
    } catch (e: unknown) {
      console.error('Password update error:', e);
      throw e;
    }
  }, []);

  const value = useMemo(() => ({ user, initializing, signInWithEmail, createUserWithEmail, getSignInMethodsForEmail, signInWithGoogle, signInWithApple, signInWithPhone, confirmPhoneCode, updatePassword, signOut }), [user, initializing, signInWithEmail, createUserWithEmail, getSignInMethodsForEmail, signInWithGoogle, signInWithApple, signInWithPhone, confirmPhoneCode, updatePassword, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

