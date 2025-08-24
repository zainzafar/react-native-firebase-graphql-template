import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import { Body, Button, Card, Heading, Input, ScreenContainer } from '../components/ui';
import { useAuth } from '../auth/AuthProvider';
import { FontAwesome6 } from '@react-native-vector-icons/fontawesome6';

export default function AuthScreen() {
  const { signInWithEmail, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const onSignIn = async () => {
    try {
      setLoading(true);
      await signInWithEmail(email, password);
    } catch (e: any) {
      const msg = e?.message || 'Failed to sign in';
      Alert.alert('Sign In Error', msg);
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <ScreenContainer>
      <Card>
        <Heading>Welcome back</Heading>
        <Body>Please sign in to continue</Body>
        <Input value={email} onChangeText={setEmail} placeholder="Email" autoCapitalize="none" keyboardType="email-address" />
        <Input value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry />
        <Button title="Sign In" onPress={onSignIn} loading={loading} />
        <View style={{ height: 8 }} />
        <Button title="Continue with Google" onPress={onSignInWithGoogle} loading={googleLoading} variant="ghost" />
      </Card>
    </ScreenContainer>
  );
}


