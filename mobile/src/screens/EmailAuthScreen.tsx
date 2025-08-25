import React, { useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { Body, Button, Card, Heading, Input, ScreenContainer } from '../components/ui';
import { GoogleButton } from '../components/buttons';
import { getApp } from '@react-native-firebase/app';
import { fetchSignInMethodsForEmail, getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from '@react-native-firebase/auth';
import { apolloClient } from '../graphql/client';
import { MUTATION_LOGIN_WITH_ID_TOKEN } from '../graphql/operations';
import { getIdToken } from '@react-native-firebase/auth';
import { saveAccessToken } from '../auth/tokenStorage';
import { useAuth } from '../auth/AuthProvider';

export default function EmailAuthScreen() {
  const { signInWithGoogle } = useAuth();
  const [stage, setStage] = useState<'email' | 'signin' | 'signup' | 'useProvider'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [methods, setMethods] = useState<string[]>([]);

  const readableProviders = useMemo(() => {
    return methods.map((m) => {
      if (m === 'google.com') return 'Google';
      if (m === 'apple.com') return 'Apple';
      if (m === 'phone') return 'Phone';
      if (m === 'password') return 'Email & Password';
      return m;
    }).join(', ');
  }, [methods]);

  const proceed = async () => {
    try {
      setLoading(true);
      if (stage === 'email') {
        const auth = getAuth(getApp());
        const list = await fetchSignInMethodsForEmail(auth as any, email.trim());
        setMethods(Array.isArray(list) ? list : []);
        if (list && list.includes('password')) {
          setStage('signin');
        } else if (list && list.length > 0) {
          // Account exists but with social/provider; prompt to use linked method(s)
          setStage('useProvider');
        } else {
          setStage('signup');
        }
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
    <ScreenContainer>
      <Card>
        <Heading>Email</Heading>
        {stage === 'email' && (
          <>
            <Body>Enter your email to continue</Body>
            <Input value={email} onChangeText={setEmail} placeholder="Email" autoCapitalize="none" keyboardType="email-address" />
            <Button title="Continue" onPress={proceed} loading={loading} />
          </>
        )}
        {stage === 'signin' && (
          <>
            <Body>Welcome back</Body>
            <Input value={email} onChangeText={setEmail} placeholder="Email" autoCapitalize="none" keyboardType="email-address" />
            <Input value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry />
            <Button title="Sign In" onPress={proceed} loading={loading} />
          </>
        )}
        {stage === 'signup' && (
          <>
            <Body>Create your account</Body>
            <Input value={email} onChangeText={setEmail} placeholder="Email" autoCapitalize="none" keyboardType="email-address" />
            <Input value={firstName} onChangeText={setFirstName} placeholder="First name" />
            <Input value={lastName} onChangeText={setLastName} placeholder="Last name" />
            <Input value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry />
            <Button title="Create Account" onPress={proceed} loading={loading} />
          </>
        )}
        {stage === 'useProvider' && (
          <>
            <Body>This email is linked with: {readableProviders}</Body>
            {methods.includes('google.com') && (
              <GoogleButton onPress={() => signInWithGoogle().catch(() => {})} />
            )}
            {!methods.includes('password') && !methods.includes('google.com') && (
              <Body>Please go back and choose the right provider.</Body>
            )}
          </>
        )}
      </Card>
    </ScreenContainer>
  );
}


