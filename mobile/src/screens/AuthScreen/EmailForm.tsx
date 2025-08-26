import React, { useState, useMemo } from 'react';
import { Alert, View, StyleSheet } from 'react-native';
import { Body, Button, Input } from '../../components/ui';
import { GoogleButton, AppleButton as AppleSignInButton } from '../../components/buttons';
import { useAuth } from '../../auth/AuthProvider';
import { getApp } from '@react-native-firebase/app';
import {
  fetchSignInMethodsForEmail,
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  getIdToken,
} from '@react-native-firebase/auth';
import { apolloClient } from '../../graphql/client';
import { MUTATION_LOGIN_WITH_ID_TOKEN } from '../../graphql/operations';
import { saveAccessToken } from '../../auth/tokenStorage';
import { Platform } from 'react-native';
import AppleAuth from '@invertase/react-native-apple-authentication';

type EmailFormProps = {
  onBack: () => void;
  onGoogleSignIn?: () => Promise<void> | void;
  googleLoading?: boolean;
  onAppleSignIn?: () => Promise<void> | void;
  appleLoading?: boolean;
  appleSupported?: boolean;
};

export default function EmailForm({ onBack, onGoogleSignIn, googleLoading, onAppleSignIn, appleLoading, appleSupported }: EmailFormProps) {
  const { signInWithGoogle } = useAuth();
  const [stage, setStage] = useState<'email' | 'signin' | 'signup' | 'useProvider'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [_methods, setMethodsList] = useState<string[]>([]);
  
  const readableProviders = useMemo(() => {
    return _methods
      .map((m) => (m === 'google.com' ? 'Google' : m === 'apple.com' ? 'Apple' : m === 'phone' ? 'Phone' : m === 'password' ? 'Email & Password' : m))
      .join(', ');
  }, [_methods]);

  const proceed = async () => {
    try {
      setLoading(true);
      if (stage === 'email') {
        const auth = getAuth(getApp());
        const list = await fetchSignInMethodsForEmail(auth as any, email.trim());
        const arr = Array.isArray(list) ? list : [];
        setMethodsList(arr);
        if (arr.includes('password')) setStage('signin');
        else if (arr.length > 0) setStage('useProvider');
        else setStage('signup');
      } else if (stage === 'signin') {
        const auth = getAuth(getApp());
        await signInWithEmailAndPassword(auth, email.trim(), password);
        const idToken = auth.currentUser ? await getIdToken(auth.currentUser, true) : undefined;
        if (idToken) {
          const { data } = await apolloClient.mutate({ mutation: MUTATION_LOGIN_WITH_ID_TOKEN, variables: { idToken } });
          const accessToken = (data as any)?.loginWithIdToken?.accessToken as string | undefined;
          if (accessToken) await saveAccessToken(accessToken);
        }
      } else if (stage === 'signup') {
        const auth = getAuth(getApp());
        await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (auth.currentUser) {
          try { await updateProfile(auth.currentUser as any, { displayName: `${firstName} ${lastName}`.trim() }); } catch {}
        }
        const idToken = auth.currentUser ? await getIdToken(auth.currentUser, true) : undefined;
        if (idToken) {
          const { data } = await apolloClient.mutate({ mutation: MUTATION_LOGIN_WITH_ID_TOKEN, variables: { idToken } });
          const accessToken = (data as any)?.loginWithIdToken?.accessToken as string | undefined;
          if (accessToken) await saveAccessToken(accessToken);
        }
      }
    } catch (e: any) {
      Alert.alert('Email Auth', e?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.formContainer}>
      {stage === 'email' && (
        <>
          <Input value={email} onChangeText={setEmail} placeholder="Email" autoCapitalize="none" keyboardType="email-address" />
          <Button title="Continue" onPress={proceed} loading={loading} />
          <Button title="Back" onPress={onBack} variant="ghost" />
        </>
      )}
      {stage === 'signin' && (
        <>
          <Input value={email} onChangeText={setEmail} placeholder="Email" autoCapitalize="none" keyboardType="email-address" />
          <Input value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry />
          <Button title="Sign In" onPress={proceed} loading={loading} />
          <Button title="Back" onPress={onBack} variant="ghost" />
        </>
      )}
      {stage === 'signup' && (
        <>
          <Input value={email} onChangeText={setEmail} placeholder="Email" autoCapitalize="none" keyboardType="email-address" />
          <Input value={firstName} onChangeText={setFirstName} placeholder="First name" />
          <Input value={lastName} onChangeText={setLastName} placeholder="Last name" />
          <Input value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry />
          <Button title="Create Account" onPress={proceed} loading={loading} />
          <Button title="Back" onPress={onBack} variant="ghost" />
        </>
      )}
      {stage === 'useProvider' && (
        <>
          <Body style={styles.centerText}>This email is linked with: {readableProviders}</Body>
          {_methods.includes('google.com') && (
            <GoogleButton
              onPress={async () => {
                try {
                  if (onGoogleSignIn) await onGoogleSignIn(); else await signInWithGoogle();
                } catch {}
              }}
              loading={!!googleLoading}
              disabled={!!googleLoading || !!appleLoading}
            />
          )}
          {_methods.includes('apple.com') && appleSupported && (
            <AppleSignInButton
              onPress={async () => {
                try {
                  if (onAppleSignIn) await onAppleSignIn();
                } catch {}
              }}
              loading={!!appleLoading}
              disabled={!!appleLoading || !!googleLoading}
            />
          )}
          <Button title="Back" onPress={onBack} variant="ghost" />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  formContainer: { gap: 12 },
  centerText: { textAlign: 'center' },
});
