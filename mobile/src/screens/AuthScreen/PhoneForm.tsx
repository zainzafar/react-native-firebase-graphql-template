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
      
      const _confirmation = await signInWithPhone(phone.e164);
      setConfirmation(_confirmation);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const confirmCode = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!confirmation) throw new Error('Missing confirmation');
      await confirmPhoneCode(confirmation, code);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.formContainer, { gap: layout.formGap }]}>
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
  formContainer: { },
  errorText: { color: '#EF4444' },
});
