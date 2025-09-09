import React, { useState, useMemo } from 'react';
import { View, StyleSheet, Text, Pressable } from 'react-native';
import { Body, Button, Input, InlineLoader } from '../../components';
import { useTheme } from '../../theme/ThemeProvider';
import { GoogleButton, AppleButton as AppleSignInButton } from '../../components/auth-buttons';
import { useAuth } from '../../auth/AuthProvider';
import { getAuth, sendPasswordResetEmail } from '@react-native-firebase/auth';

type EmailFormProps = {
  onBack: () => void;
  onGoogleSignIn?: () => Promise<void> | void;
  googleLoading?: boolean;
  onAppleSignIn?: () => Promise<void> | void;
  appleLoading?: boolean;
  appleSupported?: boolean;
};

export default function EmailForm({ onBack, onGoogleSignIn, googleLoading, onAppleSignIn, appleLoading, appleSupported }: EmailFormProps) {
  const { layout } = useTheme();
  const { signInWithEmail, createUserWithEmail, getSignInMethodsForEmail, signInWithGoogle } = useAuth();
  const [stage, setStage] = useState<'email' | 'signin' | 'signup' | 'useProvider'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastErrorCode, setLastErrorCode] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [_methods, setMethodsList] = useState<string[]>([]);
  
  const readableProviders = useMemo(() => {
    return _methods
      .map((m) => (m === 'google.com' ? 'Google' : m === 'apple.com' ? 'Apple' : m === 'phone' ? 'Phone' : m === 'password' ? 'Email & Password' : m))
      .join(', ');
  }, [_methods]);

  const getErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/user-not-found':
        return 'No account found with this email address.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters long.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection and try again.';
      case 'auth/operation-not-allowed':
        return 'Email & password sign-in is not enabled. Please contact support.';
      default:
        return 'Something went wrong. Please try again.';
    }
  };

  const handleResetPassword = async () => {
    try {
      setResetLoading(true);
      setError(null);
      const auth = getAuth();
      await sendPasswordResetEmail(auth, email.trim());
      setResetSent(true);
    } catch (e: unknown) {
      const errorMessage = getErrorMessage((e as { code?: string; message?: string })?.code || (e as { code?: string; message?: string })?.message || '');
      setError(errorMessage);
    } finally {
      setResetLoading(false);
    }
  };

  const proceed = async () => {
    try {
      setLoading(true);
      setError(null);
      setLastErrorCode(null);
      setResetSent(false); // Reset the reset sent state when trying again
      if (stage === 'email') {
        const arr = await getSignInMethodsForEmail(email.trim());
        setMethodsList(arr);
        if (arr.includes('password')) setStage('signin');
        else if (arr.length > 0) setStage('useProvider');
        else setStage('signup');
      } else if (stage === 'signin') {
        await signInWithEmail(email.trim(), password);
      } else if (stage === 'signup') {
        const displayName = `${firstName} ${lastName}`.trim();
        await createUserWithEmail(email.trim(), password, displayName);
      }
    } catch (e: unknown) {
      const code = (e as { code?: string; message?: string })?.code || (e as { code?: string; message?: string })?.message || '';
      const errorMessage = getErrorMessage(code);
      setError(errorMessage);
      setLastErrorCode(code);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[{ gap: layout.formGap }, styles.formContainer]}>
      {stage === 'email' && (
        <>
          <Input 
            value={email} 
            onChangeText={setEmail} 
            placeholder="Email" 
            autoCapitalize="none" 
            keyboardType="email-address"
            textContentType="emailAddress"
            autoComplete="email"
          />
          {error ? <Body style={styles.errorText}>{error}</Body> : null}
          <Button title="Continue" onPress={proceed} loading={loading} />
          <Button title="Back" onPress={onBack} variant="ghost" />
        </>
      )}
      {stage === 'signin' && (
        <>
          <Input 
            value={email} 
            onChangeText={setEmail} 
            placeholder="Email" 
            autoCapitalize="none" 
            keyboardType="email-address"
            textContentType="emailAddress"
            autoComplete="email"
          />
          <Input 
            value={password} 
            onChangeText={setPassword} 
            placeholder="Password" 
            secureTextEntry
            textContentType="password"
            autoComplete="password"
          />
          {error && !resetSent && (
            <View>
              <Body style={styles.errorText}>{error}</Body>
              {lastErrorCode === 'auth/wrong-password' && (
                <Pressable onPress={handleResetPassword} style={styles.resetLink}>
                  <Text style={styles.resetLinkText}>Reset password</Text>
                </Pressable>
              )}
            </View>
          )}
          {resetLoading && (
            <InlineLoader text="Sending reset email..." />
          )}
          {resetSent && (
            <Body style={styles.successText}>Please check your email, reset the password and then try again.</Body>
          )}
          <Button title="Sign In" onPress={proceed} loading={loading} disabled={resetLoading} />
          <Button title="Back" onPress={onBack} variant="ghost" />
        </>
      )}
      {stage === 'signup' && (
        <>
          <Input 
            value={email} 
            onChangeText={setEmail} 
            placeholder="Email" 
            autoCapitalize="none" 
            keyboardType="email-address"
            textContentType="emailAddress"
            autoComplete="email"
          />
          <Input 
            value={firstName} 
            onChangeText={setFirstName} 
            placeholder="First name"
            textContentType="givenName"
            autoComplete="given-name"
          />
          <Input 
            value={lastName} 
            onChangeText={setLastName} 
            placeholder="Last name"
            textContentType="familyName"
            autoComplete="family-name"
          />
          <Input 
            value={password} 
            onChangeText={setPassword} 
            placeholder="Password" 
            secureTextEntry
            textContentType="newPassword"
            autoComplete="new-password"
          />
          {error ? <Body style={styles.errorText}>{error}</Body> : null}
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
                } catch (e: unknown) {
                  // Handle user cancellation gracefully
                  const error = e as { code?: string; message?: string };
                  if (error?.code === 'SIGN_IN_CANCELLED' || 
                      error?.code === 'SIGN_IN_REQUIRED' ||
                      error?.message?.includes('cancelled') ||
                      error?.message?.includes('canceled') ||
                      error?.message?.includes('user_cancelled') ||
                      error?.message?.includes('user_canceled')) {
                    // User cancelled - this is not an error, do nothing
                    return;
                  }
                  // For other errors, show them to the user
                  const errorMessage = getErrorMessage(error?.code || error?.message || '');
                  setError(errorMessage);
                }
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
                } catch (e: unknown) {
                  // Handle user cancellation gracefully
                  const error = e as { code?: number; message?: string };
                  if (error?.code === 1001 || error?.message?.includes('1001')) {
                    // User cancelled - this is not an error, do nothing
                    return;
                  }
                  // For other errors, show them to the user
                  const errorMessage = getErrorMessage(error?.code?.toString() || error?.message || '');
                  setError(errorMessage);
                }
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
  formContainer: { },
  centerText: { textAlign: 'center' },
  errorText: { color: '#EF4444' },
  resetLink: { marginTop: 4 },
  resetLinkText: { color: '#2563EB', textDecorationLine: 'underline' },
  successText: { color: '#059669' },
});
