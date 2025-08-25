import React, { useState } from 'react';
import { Alert } from 'react-native';
import { Body, Button, Card, Heading, Input, ScreenContainer } from '../components/ui';
import { getApp } from '@react-native-firebase/app';
import { PhoneAuthProvider, getAuth, signInWithCredential } from '@react-native-firebase/auth';
import { apolloClient } from '../graphql/client';
import { getIdToken } from '@react-native-firebase/auth';
import { MUTATION_LOGIN_WITH_ID_TOKEN } from '../graphql/operations';
import { saveAccessToken } from '../auth/tokenStorage';

export default function PhoneAuthScreen() {
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
    <ScreenContainer>
      <Card>
        <Heading>Phone</Heading>
        {!verificationId ? (
          <>
            <Body>Enter your phone number</Body>
            <Input value={phone} onChangeText={setPhone} placeholder="Phone" keyboardType="phone-pad" />
            <Button title="Send Code" onPress={sendCode} loading={loading} />
          </>
        ) : (
          <>
            <Body>Enter the verification code</Body>
            <Input value={code} onChangeText={setCode} placeholder="Code" keyboardType="number-pad" />
            <Button title="Confirm" onPress={confirmCode} loading={loading} />
          </>
        )}
      </Card>
    </ScreenContainer>
  );
}


