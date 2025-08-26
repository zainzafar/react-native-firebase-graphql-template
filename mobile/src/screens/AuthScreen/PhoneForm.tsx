import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Body, Button, Input } from '../../components/ui';
import { getApp } from '@react-native-firebase/app';
import {
  getAuth,
  getIdToken,
  signInWithPhoneNumber,
} from '@react-native-firebase/auth';
import { apolloClient } from '../../graphql/client';
import { MUTATION_LOGIN_WITH_ID_TOKEN } from '../../graphql/operations';
import { saveAccessToken } from '../../auth/tokenStorage';
import PhoneNumberInput, { PhoneNumberValue } from '../../components/PhoneNumberInput';

type PhoneFormProps = {
  onBack: () => void;
};

export default function PhoneForm({ onBack }: PhoneFormProps) {
  const [phone, setPhone] = useState<PhoneNumberValue>({ e164: null, countryCode: 'US', callingCode: '+1', national: '', valid: false });
  const [code, setCode] = useState('');
  const [confirmation, setConfirmation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPhoneError, setShowPhoneError] = useState(false);

  const sendCode = async () => {
    try {
      setLoading(true);
      setError(null);
      setShowPhoneError(true);
      if (!phone.valid || !phone.e164) {
        setError('Please enter a valid phone number');
        return;
      }
      
      const app = getApp();
      const auth = getAuth(app);
      
      const _confirmation = await signInWithPhoneNumber(auth, phone.e164);
      setConfirmation(_confirmation);
    } catch (e: any) {
      console.error('Phone auth error:', e);
      console.error('Error code:', e?.code);
      console.error('Error message:', e?.message);
      console.error('Full error object:', JSON.stringify(e, null, 2));
      
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
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const confirmCode = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!confirmation) throw new Error('Missing confirmation');
      const result = await confirmation.confirm(code);
      console.log('Sign in result:', result);
      const auth = getAuth(getApp());
      const idToken = auth.currentUser ? await getIdToken(auth.currentUser, true) : undefined;
      if (idToken) {
        const { data } = await apolloClient.mutate({ mutation: MUTATION_LOGIN_WITH_ID_TOKEN, variables: { idToken } });
        const accessToken = (data as any)?.loginWithIdToken?.accessToken as string | undefined;
        if (accessToken) await saveAccessToken(accessToken);
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to confirm code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.formContainer}>
      {!confirmation ? (
        <>
          <PhoneNumberInput value={phone} onChange={setPhone} showError={showPhoneError} />
          {error ? <Body style={styles.errorText}>{error}</Body> : null}
          <Button title="Send Code" onPress={sendCode} loading={loading} disabled={!phone.valid} />
          <Button title="Back" onPress={onBack} variant="ghost" />
        </>
      ) : (
        <>
          <Input value={code} onChangeText={setCode} placeholder="Code" keyboardType="number-pad" />
          {error ? <Body style={styles.errorText}>{error}</Body> : null}
          <Button title="Confirm" onPress={confirmCode} loading={loading} />
          <Button title="Back" onPress={onBack} variant="ghost" />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  formContainer: { gap: 12 },
  errorText: { color: '#EF4444' },
});
