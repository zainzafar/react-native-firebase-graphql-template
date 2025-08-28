import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
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
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, AppleAuthProvider, signInWithCredential } from '@react-native-firebase/auth';
import { googleWebClientId } from '../config/firebase';
import { apolloClient } from '../graphql/client';
import { MUTATION_LOGIN_WITH_ID_TOKEN, MUTATION_UPDATE_PROFILE, QUERY_ME } from '../graphql/operations';
import { saveAccessToken, clearAccessToken, getAccessToken } from './tokenStorage';
import { handleHardSignOut } from './session';
import { useAppDispatch } from '../store/hooks';
import { logout, setUser as setUserAction } from '../features/auth/authSlice';
import { persistor } from '../store';
import AppleAuth from '@invertase/react-native-apple-authentication';

type AuthContextValue = {
  user: FirebaseAuthTypes.User | null;
  initializing: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  createUserWithEmail: (email: string, password: string, displayName?: string) => Promise<void>;
  getSignInMethodsForEmail: (email: string) => Promise<string[]>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithPhone: (phoneNumber: string) => Promise<any>;
  confirmPhoneCode: (confirmation: any, code: string) => Promise<void>;
  updateUserProfile: (displayName?: string, photoURL?: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [initializing, setInitializing] = useState(true);

  const dispatch = useAppDispatch();

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
            const { data } = await apolloClient.mutate({
              mutation: MUTATION_LOGIN_WITH_ID_TOKEN,
              variables: { idToken: freshIdToken },
            });
            const accessToken = (data as any)?.loginWithIdToken?.accessToken as string | undefined;
            const userData = (data as any)?.loginWithIdToken?.user;
            if (accessToken) {
              await saveAccessToken(accessToken);
            }
            if (userData) {
              // Update Redux state with database user data only
              const profile = {
                id: userData.uid,
                email: userData.email ?? undefined,
                displayName: userData.displayName ?? undefined,
                photoURL: userData.photoURL ?? undefined,
                lastLoginProvider: userData.lastLoginProvider ?? undefined,
                permissions: Array.isArray(userData.permissions) ? userData.permissions : [],
              };
              console.log('[AuthProvider] Setting user profile with permissions:', profile.permissions);
              dispatch(setUserAction(profile));
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
          const { data } = await apolloClient.query({ 
            query: QUERY_ME, 
            fetchPolicy: 'network-only' 
          });
          const userData = (data as any)?.me;
          if (userData) {
            // Update Redux state with database user data
            const profile = {
              id: userData.uid,
              email: userData.email ?? undefined,
              displayName: userData.displayName ?? undefined,
              photoURL: userData.photoURL ?? undefined,
              lastLoginProvider: userData.lastLoginProvider ?? undefined,
              permissions: Array.isArray(userData.permissions) ? userData.permissions : [],
            };
            console.log('[AuthProvider] Setting user profile with permissions:', profile.permissions);
            dispatch(setUserAction(profile));
          }
        } catch {
          await clearAccessToken();
        }
      }
    })();
  }, []);

  const exchangeIdTokenForAppJWT = async (authMethod: string) => {
    const app = getApp();
    const authInstance = getAuth(app);
    const freshIdToken = authInstance.currentUser ? await getIdToken(authInstance.currentUser, true) : undefined;
    if (freshIdToken) {
      try {
        console.log(`[Auth] Exchanging ${authMethod} Firebase ID token for app JWT via mutation`);
        const { data } = await apolloClient.mutate({
          mutation: MUTATION_LOGIN_WITH_ID_TOKEN,
          variables: { idToken: freshIdToken },
        });
        const accessToken = (data as any)?.loginWithIdToken?.accessToken as string | undefined;
        const userData = (data as any)?.loginWithIdToken?.user;
        if (accessToken) {
          await saveAccessToken(accessToken);
        }
        if (userData) {
          // Update Redux state with user data from GraphQL (includes lastLoginProvider)
          const profile = {
            id: userData.uid,
            email: userData.email ?? undefined,
            displayName: userData.displayName ?? undefined,
            photoURL: userData.photoURL ?? undefined,
            lastLoginProvider: userData.lastLoginProvider ?? undefined,
            roles: Array.isArray(userData.roles) ? userData.roles : [],
          };
          dispatch(setUserAction(profile));
        }
      } catch (e) {
        console.log(`[Auth] loginWithIdToken mutation failed after ${authMethod} sign-in`, e);
        throw e;
      }
    } else {
      console.log(`[Auth] No fresh Firebase ID token after ${authMethod} sign-in`);
    }
  };

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const app = getApp();
    const authInstance = getAuth(app);
    await signInWithEmailAndPassword(authInstance, email.trim(), password);
    await exchangeIdTokenForAppJWT('Email');
  }, []);

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
  });

  const getSignInMethodsForEmail = useCallback(async (email: string) => {
    const app = getApp();
    const authInstance = getAuth(app);
    const list = await fetchSignInMethodsForEmail(authInstance as any, email.trim());
    return Array.isArray(list) ? list : [];
  }, []);

  const signOut = useCallback(async () => {
    await handleHardSignOut();
    dispatch(logout());
    await persistor.purge();
  }, [dispatch]);

  const signInWithGoogle = useCallback(async () => {
    try {
      GoogleSignin.configure({
        webClientId: googleWebClientId,
        forceCodeForRefreshToken: true,
        scopes: ['profile', 'email'],
      });
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const { idToken, user: gUser } = await GoogleSignin.signIn();
      if (!idToken) throw new Error('Google Sign-In failed: no idToken returned');
      const app = getApp();
      const authInstance = getAuth(app);
      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(authInstance, credential);
      // Ensure Firebase profile has a display name; set from Google profile if missing
      try {
        const cur = authInstance.currentUser as any;
        const existingName: string | undefined = cur?.displayName || undefined;
        const candidateName: string | undefined = (gUser?.name as string | undefined) ||
          (gUser?.givenName ? `${gUser.givenName} ${gUser?.familyName || ''}`.trim() : undefined);
        if (cur && !existingName && candidateName) {
          await updateProfile(cur, { displayName: candidateName });
        }
      } catch {}
      await exchangeIdTokenForAppJWT('Google');
    } catch (e: any) {
      // Handle user cancellation gracefully
      if (e?.code === 'SIGN_IN_CANCELLED' || 
          e?.code === 'SIGN_IN_REQUIRED' ||
          e?.message?.includes('cancelled') ||
          e?.message?.includes('canceled') ||
          e?.message?.includes('user_cancelled') ||
          e?.message?.includes('user_canceled')) {
        // User cancelled the Google Sign-In flow - this is not an error
        console.log('[Auth] Google Sign-In cancelled by user');
        return; // Silently return without throwing an error
      }
      // Re-throw other errors
      throw e;
    }
  }, []);

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
    } catch (e: any) {
      // Handle user cancellation gracefully
      if (e?.code === 1001 || e?.message?.includes('1001')) {
        // User cancelled the Apple Sign-In flow - this is not an error
        console.log('[Auth] Apple Sign-In cancelled by user');
        return; // Silently return without throwing an error
      }
      // Re-throw other errors
      throw e;
    }
  }, []);

  const signInWithPhone = useCallback(async (phoneNumber: string) => {
    try {
      const app = getApp();
      const authInstance = getAuth(app);
      const confirmation = await signInWithPhoneNumber(authInstance, phoneNumber);
      return confirmation;
    } catch (e: any) {
      console.error('Phone auth error:', e);
      let errorMessage = 'Failed to send code';
      
      if (e?.code === 'auth/invalid-multi-factor-session') {
        errorMessage = 'Phone authentication not properly configured. Please check Firebase settings.';
      } else if (e?.code === 'auth/invalid-phone-number') {
        errorMessage = 'Invalid phone number format';
      } else if (e?.code === 'auth/too-many-requests') {
        errorMessage = 'Too many attempts. Please try again later.';
      } else if (e?.code === 'auth/quota-exceeded') {
        errorMessage = 'SMS quota exceeded. Please try again later.';
      } else if (e?.message) {
        errorMessage = e.message;
      }
      
      throw new Error(errorMessage);
    }
  }, []);

  const confirmPhoneCode = useCallback(async (confirmation: any, code: string) => {
    try {
      const result = await confirmation.confirm(code);
      console.log('Sign in result:', result);
      await exchangeIdTokenForAppJWT('Phone');
    } catch (e: any) {
      console.error('Code confirmation error:', e);
      let errorMessage = 'Failed to confirm code';
      
      if (e?.code === 'auth/invalid-verification-code') {
        errorMessage = 'Invalid verification code. Please check the code and try again.';
      } else if (e?.code === 'auth/code-expired') {
        errorMessage = 'Verification code has expired. Please request a new code.';
      } else if (e?.code === 'auth/too-many-requests') {
        errorMessage = 'Too many attempts. Please try again later.';
      } else if (e?.message) {
        errorMessage = e.message;
      }
      
      throw new Error(errorMessage);
    }
  }, []);

  const updateUserProfile = useCallback(async (displayName?: string, photoURL?: string) => {
    try {
      // Call GraphQL mutation to update profile
      const { data } = await apolloClient.mutate({
        mutation: MUTATION_UPDATE_PROFILE,
        variables: { displayName, photoURL },
      });

      const updatedUser = (data as any)?.updateProfile;
      if (!updatedUser) {
        throw new Error('Failed to update profile');
      }

      // Update Redux state with the updated user data
      const profile = {
        id: updatedUser.uid,
        email: updatedUser.email ?? undefined,
        displayName: updatedUser.displayName ?? undefined,
        photoURL: updatedUser.photoURL ?? undefined,
        lastLoginProvider: updatedUser.lastLoginProvider ?? undefined,
      };
      dispatch(setUserAction(profile));
    } catch (e: any) {
      console.error('Profile update error:', e);
      throw e;
    }
  }, [dispatch]);

  const updatePassword = useCallback(async (newPassword: string) => {
    try {
      const app = getApp();
      const authInstance = getAuth(app);
      const currentUser = authInstance.currentUser;
      
      if (!currentUser) {
        throw new Error('No user is currently signed in');
      }

      await currentUser.updatePassword(newPassword);
    } catch (e: any) {
      console.error('Password update error:', e);
      throw e;
    }
  }, []);

  const value = useMemo(() => ({ user, initializing, signInWithEmail, createUserWithEmail, getSignInMethodsForEmail, signInWithGoogle, signInWithApple, signInWithPhone, confirmPhoneCode, updateUserProfile, updatePassword, signOut }), [user, initializing, signInWithEmail, createUserWithEmail, getSignInMethodsForEmail, signInWithGoogle, signInWithApple, signInWithPhone, confirmPhoneCode, updateUserProfile, updatePassword, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

