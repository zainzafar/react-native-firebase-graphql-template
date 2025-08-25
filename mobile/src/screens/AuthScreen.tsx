import React, { useEffect, useRef, useState } from 'react';
import { Alert, View, Pressable, StyleSheet, LayoutAnimation, Platform, UIManager, Animated, Easing } from 'react-native';
//
import { Body, Card, Heading, ScreenContainer, Button, Input } from '../components/ui';
import { GoogleButton, EmailButton, PhoneButton, AppleButton as AppleSignInButton } from '../components/buttons';
import { useAuth } from '../auth/AuthProvider';
import { useNavigation } from '@react-navigation/native';
//
import { getApp } from '@react-native-firebase/app';
import {
  fetchSignInMethodsForEmail,
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  PhoneAuthProvider,
  signInWithCredential,
  getIdToken,
} from '@react-native-firebase/auth';
import { apolloClient } from '../graphql/client';
import { MUTATION_LOGIN_WITH_ID_TOKEN } from '../graphql/operations';
import { saveAccessToken } from '../auth/tokenStorage';

type Mode = 'methods' | 'email' | 'phone';

export default function AuthScreen() {
  const { signInWithGoogle, signInWithApple } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const navigation = useNavigation<any>();
  const [mode, setMode] = useState<Mode>('methods');
  const appear = useRef(new Animated.Value(1)).current;

  const goTo = (next: Mode) => {
    if (Platform.OS === 'android') {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setMode(next);
  };

  useEffect(() => {
    if (Platform.OS === 'android' && (UIManager as any)?.setLayoutAnimationEnabledExperimental) {
      try { (UIManager as any).setLayoutAnimationEnabledExperimental(true); } catch {}
    }
  }, []);

  useEffect(() => {
    // Fade/slide in current content so Android gets a smooth transition
    appear.setValue(0);
    Animated.timing(appear, {
      toValue: 1,
      duration: 1000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [mode, appear]);

  const onSignInWithGoogle = async () => {
    try {
      setGoogleLoading(true);
      await signInWithGoogle();
    } catch (e: any) {
      const msg = e?.message || 'Google Sign-In failed';
      Alert.alert('Google Sign-In', msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  const onSignInWithApple = async () => {
    try {
      setAppleLoading(true);
      await signInWithApple();
    } catch (e: any) {
      const msg = e?.message || 'Apple Sign-In failed';
      Alert.alert('Apple Sign-In', msg);
    } finally {
      setAppleLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Heading>Let’s get started…</Heading>
      </View>
      <Card>
        <Animated.View style={{ opacity: appear, transform: [{ translateY: appear.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }}>
          {mode === 'methods' && (
            <View style={styles.buttonGroup}>
              <EmailButton onPress={() => goTo('email')} disabled={googleLoading || appleLoading} />
              <GoogleButton onPress={onSignInWithGoogle} disabled={googleLoading || appleLoading} loading={googleLoading} />
              <AppleSignInButton onPress={onSignInWithApple} disabled={googleLoading || appleLoading} />
              <PhoneButton onPress={() => goTo('phone')} disabled={googleLoading || appleLoading} />
            </View>
          )}
          {mode === 'email' && (
            <EmailForm
              onBack={() => goTo('methods')}
              onGoogleSignIn={onSignInWithGoogle}
              googleLoading={googleLoading}
              onAppleSignIn={onSignInWithApple}
              appleLoading={appleLoading}
            />
          )}
          {mode === 'phone' && (
            <PhoneForm onBack={() => goTo('methods')} />
          )}
        </Animated.View>
      </Card>
      <Pressable style={styles.debugLink} onPress={() => navigation.navigate('Debug')} hitSlop={8}>
        <Body style={styles.debugText}>Debug</Body>
      </Pressable>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', gap: 6 },
  subheading: { textAlign: 'center' },
  debugLink: { position: 'absolute', bottom: 24, left: 0, right: 0, alignItems: 'center' },
  debugText: { textAlign: 'center' },
  buttonGroup: { gap: 12 },
  formContainer: { gap: 12 },
  centerText: { textAlign: 'center' },
});

function EmailForm({ onBack, onGoogleSignIn, googleLoading, onAppleSignIn: _onAppleSignIn, appleLoading: _appleLoading }: {
  onBack: () => void;
  onGoogleSignIn?: () => Promise<void> | void;
  googleLoading?: boolean;
  onAppleSignIn?: () => Promise<void> | void;
  appleLoading?: boolean;
}) {
  const { signInWithGoogle } = useAuth();
  const [stage, setStage] = useState<'email' | 'signin' | 'signup' | 'useProvider'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [_methods, setMethodsList] = useState<string[]>([]);
  const readableProviders = React.useMemo(() => {
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
              disabled={!!googleLoading}
            />
          )}
          <Button title="Back" onPress={onBack} variant="ghost" />
        </>
      )}
    </View>
  );
}

function PhoneForm({ onBack }: { onBack: () => void }) {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const sendCode = async () => {
    try {
      setLoading(true);
      const auth = getAuth(getApp());
      const provider = new PhoneAuthProvider(auth as any);
      const id = await provider.verifyPhoneNumber(phone);
      setVerificationId(id);
    } catch (e: any) {
      Alert.alert('Phone Auth', e?.message || 'Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  const confirmCode = async () => {
    try {
      setLoading(true);
      if (!verificationId) throw new Error('Missing verification id');
      const auth = getAuth(getApp());
      const credential = PhoneAuthProvider.credential(verificationId, code);
      await signInWithCredential(auth, credential);
      const idToken = auth.currentUser ? await getIdToken(auth.currentUser, true) : undefined;
      if (idToken) {
        const { data } = await apolloClient.mutate({ mutation: MUTATION_LOGIN_WITH_ID_TOKEN, variables: { idToken } });
        const accessToken = (data as any)?.loginWithIdToken?.accessToken as string | undefined;
        if (accessToken) await saveAccessToken(accessToken);
      }
    } catch (e: any) {
      Alert.alert('Phone Auth', e?.message || 'Failed to confirm code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.formContainer}>
      {!verificationId ? (
        <>
          <Input value={phone} onChangeText={setPhone} placeholder="Phone" keyboardType="phone-pad" />
          <Button title="Send Code" onPress={sendCode} loading={loading} />
          <Button title="Back" onPress={onBack} variant="ghost" />
        </>
      ) : (
        <>
          <Input value={code} onChangeText={setCode} placeholder="Code" keyboardType="number-pad" />
          <Button title="Confirm" onPress={confirmCode} loading={loading} />
          <Button title="Back" onPress={onBack} variant="ghost" />
        </>
      )}
    </View>
  );
}

// ProviderButton imported from components/buttons; no local duplicate.


