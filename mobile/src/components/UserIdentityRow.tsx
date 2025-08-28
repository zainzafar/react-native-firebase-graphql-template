import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

type Provider = { providerId: string };

type UserIdentityRowProps = {
  email?: string | null;
  phoneNumber?: string | null;
  identities?: Provider[] | null;
  style?: any;
};

export function UserIdentityRow({ email, phoneNumber, identities, style }: UserIdentityRowProps) {
  const { colors } = useTheme();

  const formatPhone = (p?: string | null) => {
    if (!p) return null;
    try {
      const parsed = parsePhoneNumberFromString(p);
      return parsed ? parsed.formatInternational() : p;
    } catch {
      return p;
    }
  };

  const value = email || formatPhone(phoneNumber) || '';

  return (
    <View style={[styles.row, style]}>
      <View style={styles.icons}>
        {Array.isArray(identities) && identities.map((id) => {
          if (id.providerId === 'google.com') {
            return <FontAwesome6 key="google" name="google" iconStyle="brand" size={18} color="#EA4335" />;
          }
          if (id.providerId === 'apple.com') {
            return <FontAwesome6 key="apple" name="apple" iconStyle="brand" size={20} color={colors.text} />;
          }
          if (id.providerId === 'password') {
            return <FontAwesome6 key="password" name="key" iconStyle="solid" size={18} color={colors.text} />;
          }
          if (id.providerId === 'phone') {
            return <FontAwesome6 key="phone" name="phone" iconStyle="solid" size={18} color={colors.text} />;
          }
          return null;
        })}
      </View>
      <Text style={[styles.value, { color: colors.text }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  icons: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  value: { fontSize: 16, fontWeight: '600', flexShrink: 1 },
});


