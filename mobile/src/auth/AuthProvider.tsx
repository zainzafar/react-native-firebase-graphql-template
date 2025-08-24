import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getApp } from '@react-native-firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  FirebaseAuthTypes,
} from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, signInWithCredential } from '@react-native-firebase/auth';

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

  const signInWithEmail = async (email: string, password: string) => {
    const app = getApp();
    const authInstance = getAuth(app);
    await signInWithEmailAndPassword(authInstance, email.trim(), password);
  };

  const signOut = async () => {
    const app = getApp();
    const authInstance = getAuth(app);
    await firebaseSignOut(authInstance);
  };

  const signInWithGoogle = async () => {
    GoogleSignin.configure({
      // iOS uses REVERSED_CLIENT_ID via URL scheme; Android will need webClientId if using offline access
    });
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const { idToken } = await GoogleSignin.signIn();
    if (!idToken) throw new Error('Google Sign-In failed: no idToken returned');
    const app = getApp();
    const authInstance = getAuth(app);
    const credential = GoogleAuthProvider.credential(idToken);
    await signInWithCredential(authInstance, credential);
  };

  const value = useMemo(() => ({ user, initializing, signInWithEmail, signInWithGoogle, signOut }), [user, initializing]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

