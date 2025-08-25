import React, { useState } from 'react';
import { Alert, View, Pressable, StyleSheet } from 'react-native';
//
import { Body, Button, Card, Heading, Input, ScreenContainer } from '../components/ui';
import { useAuth } from '../auth/AuthProvider';
import { useNavigation } from '@react-navigation/native';

export default function AuthScreen() {
  const { signInWithEmail, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigation = useNavigation<any>();

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
      <Pressable style={styles.debugLink} onPress={() => navigation.navigate('Debug')} hitSlop={8}>
        <Body style={styles.debugText}>Debug</Body>
      </Pressable>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  debugLink: { position: 'absolute', bottom: 24, left: 0, right: 0, alignItems: 'center' },
  debugText: { textAlign: 'center' },
});


