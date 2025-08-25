import React from 'react';
import { StyleSheet } from 'react-native';
import ProviderButton, { ProviderButtonProps } from './ProviderButton';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import AppleAuth, { AppleButton as NativeAppleButton } from '@invertase/react-native-apple-authentication';

type Props = Omit<ProviderButtonProps, 'icon' | 'label' | 'style' | 'labelStyle'> & {
  label?: string;
};

export default function AppleButton({ label = 'Sign in with Apple', onPress, disabled }: Props) {
  if (AppleAuth?.isSupported) {
    return (
      <NativeAppleButton
        buttonType={NativeAppleButton.Type.SIGN_IN}
        buttonStyle={NativeAppleButton.Style.BLACK}
        cornerRadius={24}
        style={styles.appleNative}
        onPress={() => { if (onPress) onPress(); }}
      />
    );
  }
  return (
    <ProviderButton
      icon={<FontAwesome6 name="apple" iconStyle="brand" size={18} color="#ffffff" />}
      label={label}
      onPress={onPress}
      disabled={disabled}
      style={styles.appleFallback}
      labelStyle={styles.appleFallbackText}
    />
  );
}

const styles = StyleSheet.create({
  appleNative: { height: 48, width: '100%' },
  appleFallback: { borderRadius: 24, borderWidth: 1, borderColor: '#000000', backgroundColor: '#000000', height: 48 },
  appleFallbackText: { color: '#FFFFFF' },
});


