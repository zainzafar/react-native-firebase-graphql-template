import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getApp } from '@react-native-firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  getIdToken,
  FirebaseAuthTypes,
} from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, signInWithCredential } from '@react-native-firebase/auth';
import { googleWebClientId } from '../config/firebase';
import { apolloClient } from '../graphql/client';
import { MUTATION_LOGIN_WITH_ID_TOKEN, QUERY_ME } from '../graphql/operations';
import { saveAccessToken, clearAccessToken, getAccessToken } from './tokenStorage';
import { handleHardSignOut } from './session';

type AuthContextValue = {
  user: FirebaseAuthTypes.User | null;
  initializing: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const app = getApp();
    const authInstance = getAuth(app);
    const unsubscribe = onAuthStateChanged(authInstance, (u) => {
      setUser(u);
      if (initializing) setInitializing(false);
    });
    return unsubscribe;
  }, [initializing]);

  // Validate existing app JWT on boot; if invalid, clear it
  useEffect(() => {
    (async () => {
      const token = await getAccessToken();
      if (token) {
        try {
          await apolloClient.query({ query: QUERY_ME, fetchPolicy: 'network-only' });
        } catch {
          await clearAccessToken();
        }
      }
    })();
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    const app = getApp();
    const authInstance = getAuth(app);
    await signInWithEmailAndPassword(authInstance, email.trim(), password);
    const idToken = authInstance.currentUser ? await getIdToken(authInstance.currentUser, true) : undefined;
    if (idToken) {
      try {
        console.log('[Auth] Exchanging Firebase ID token for app JWT via mutation');
        const { data } = await apolloClient.mutate({
          mutation: MUTATION_LOGIN_WITH_ID_TOKEN,
          variables: { idToken },
        });
        const accessToken = (data as any)?.loginWithIdToken?.accessToken as string | undefined;
        if (accessToken) await saveAccessToken(accessToken);
      } catch (e) {
        console.log('[Auth] loginWithIdToken mutation failed', e);
      }
    }
  };

  const signOut = async () => {
    await handleHardSignOut();
  };

  const signInWithGoogle = async () => {
    GoogleSignin.configure({
      webClientId: googleWebClientId,
      forceCodeForRefreshToken: true,
    });
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const { idToken } = await GoogleSignin.signIn();
    if (!idToken) throw new Error('Google Sign-In failed: no idToken returned');
    const app = getApp();
    const authInstance = getAuth(app);
    const credential = GoogleAuthProvider.credential(idToken);
    await signInWithCredential(authInstance, credential);
    try {
      const freshIdToken = authInstance.currentUser ? await getIdToken(authInstance.currentUser, true) : undefined;
      if (freshIdToken) {
        console.log('[Auth] Exchanging Google Firebase ID token for app JWT via mutation');
        const { data } = await apolloClient.mutate({
          mutation: MUTATION_LOGIN_WITH_ID_TOKEN,
          variables: { idToken: freshIdToken },
        });
        const accessToken = (data as any)?.loginWithIdToken?.accessToken as string | undefined;
        if (accessToken) {
          await saveAccessToken(accessToken);
        }
      } else {
        console.log('[Auth] No fresh Firebase ID token after Google sign-in');
      }
    } catch (e) {
      console.log('[Auth] loginWithIdToken mutation failed after Google sign-in', e);
    }
  };

  const value = useMemo(() => ({ user, initializing, signInWithEmail, signInWithGoogle, signOut }), [user, initializing]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

