import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Body, Button, Input } from '../../components';
import { useTheme } from '../../theme/ThemeProvider';
import PhoneNumberInput, { PhoneNumberValue } from '../../components/PhoneNumberInput';
import { useAuth } from '../../auth/AuthProvider';

type PhoneFormProps = {
  onBack: () => void;
};

export default function PhoneForm({ onBack }: PhoneFormProps) {
  const { layout } = useTheme();
  const { signInWithPhone, confirmPhoneCode } = useAuth();
  const [phone, setPhone] = useState<PhoneNumberValue>({ e164: null, countryCode: 'US', callingCode: '+1', national: '', valid: false });
  const [code, setCode] = useState('');
  const [confirmation, setConfirmation] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPhoneError, setShowPhoneError] = useState(false);

  const getErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case 'auth/invalid-phone-number':
        return 'Please enter a valid phone number.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection and try again.';
      case 'auth/operation-not-allowed':
        return 'Phone sign-in is not enabled. Please contact support.';
      case 'auth/invalid-verification-code':
        return 'Invalid verification code. Please try again.';
      case 'auth/invalid-verification-id':
        return 'Invalid verification session. Please try again.';
      case 'auth/code-expired':
        return 'Verification code has expired. Please request a new one.';
      case 'auth/session-expired':
        return 'Verification session has expired. Please try again.';
      case 'auth/missing-verification-code':
        return 'Please enter the verification code.';
      case 'auth/missing-verification-id':
        return 'Verification session is missing. Please try again.';
      case 'auth/quota-exceeded':
        return 'SMS quota exceeded. Please try again later.';
      case 'auth/captcha-check-failed':
        return 'Verification failed. Please try again.';
      default:
        return 'Something went wrong. Please try again.';
    }
  };

  const sendCode = async () => {
    try {
      setLoading(true);
      setError(null);
      setShowPhoneError(true);
      if (!phone.valid || !phone.e164) {
        setError('Please enter a valid phone number');
        return;
      }
      
      const _confirmation = await signInWithPhone(phone.e164);
      setConfirmation(_confirmation);
    } catch (e: unknown) {
      const errorMessage = getErrorMessage((e as { code?: string; message?: string })?.code || (e as { code?: string; message?: string })?.message || '');
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
      await confirmPhoneCode(confirmation as { confirm: (code: string) => Promise<unknown> }, code);
    } catch (e: unknown) {
      const errorMessage = getErrorMessage((e as { code?: string; message?: string })?.code || (e as { code?: string; message?: string })?.message || '');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[{ gap: layout.formGap }, styles.formContainer]}>
      {!confirmation ? (
        <>
          <PhoneNumberInput value={phone} onChange={setPhone} showError={showPhoneError} />
          {error ? <Body style={styles.errorText}>{error}</Body> : null}
          <Button title="Send Code" onPress={sendCode} loading={loading} disabled={!phone.valid} />
          <Button title="Back" onPress={onBack} variant="ghost" />
        </>
      ) : (
        <>
          <Input value={code} onChangeText={setCode} placeholder="Code" keyboardType="number-pad" textContentType="oneTimeCode" autoComplete="sms-otp" />
          {error ? <Body style={styles.errorText}>{error}</Body> : null}
          <Button title="Confirm" onPress={confirmCode} loading={loading} />
          <Button title="Back" onPress={onBack} variant="ghost" />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  formContainer: { },
  errorText: { color: '#EF4444' },
});
