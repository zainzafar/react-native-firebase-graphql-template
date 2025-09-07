import React, { useEffect, useMemo, useState } from 'react';
import { View, Pressable, StyleSheet, Text, Platform, StatusBar, TextInput } from 'react-native';
import { CountryPicker } from 'react-native-country-codes-picker';
import { parsePhoneNumberFromString } from 'libphonenumber-js/mobile';
import { getCountryCallingCode } from 'libphonenumber-js';
import { Body } from './ui';
import { useTheme } from '../theme/ThemeProvider';

export type PhoneNumberValue = {
  e164: string | null;
  countryCode: string; // ISO alpha-2, e.g., US, GB
  callingCode: string; // e.g., +1, +44
  national: string; // user-entered national number
  valid: boolean;
};

type Props = {
  value?: PhoneNumberValue;
  onChange?: (v: PhoneNumberValue) => void;
  placeholder?: string;
  showError?: boolean; // Only show validation error when this is true
};

// Function to get country flag emoji from country code
const getCountryFlag = (countryCode: string): string => {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

export default function PhoneNumberInput({ value, onChange, placeholder = 'Phone', showError = false }: Props) {
  const { colors, layout, borderRadius } = useTheme();
  const [pickerOpen, setPickerOpen] = useState(false);
  const deviceRegion = Intl.DateTimeFormat().resolvedOptions().locale.split('-')[1] || 'US';

  const [countryCode, setCountryCode] = useState<string>(value?.countryCode || deviceRegion);
  const initialDial = useMemo(() => {
    try { return `+${getCountryCallingCode((value?.countryCode || deviceRegion) as any)}`; } catch { return '+1'; }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [callingCode, setCallingCode] = useState<string>(value?.callingCode || initialDial);
  const [national, setNational] = useState<string>(value?.national || '');

  const parsed = useMemo(() => {
    try {
      const full = `${callingCode}${national.replace(/[^0-9]/g, '')}`;
      console.log('Attempting to parse phone number:', full);
      const pn = parsePhoneNumberFromString(full);
      console.log('Parsed result:', pn);
      return pn;
    } catch (error) {
      console.error('Error parsing phone number:', error);
      return undefined;
    }
  }, [callingCode, national]);

  const valid = !!parsed && parsed.isValid();
  const e164 = valid ? parsed!.number : null;

  useEffect(() => {
    const next: PhoneNumberValue = { e164, countryCode, callingCode, national, valid };
    console.log('Phone number parsed:', {
      e164,
      countryCode,
      callingCode,
      national,
      valid,
      parsed: parsed?.number
    });
    if (onChange) onChange(next);
  }, [e164, countryCode, callingCode, national, valid, onChange, parsed]);

  return (
    <View style={[{ gap: layout.formGap }, styles.container]}>
      <View style={[{ borderColor: colors.border, borderRadius: borderRadius.md }, styles.inputContainer]}>
        <Pressable style={styles.ccButton} onPress={() => setPickerOpen(true)}>
          <Text style={styles.flagText}>{getCountryFlag(countryCode)}</Text>
          <Text style={[{ color: colors.text }, styles.ccText]}>{callingCode}</Text>
        </Pressable>
        <View style={styles.separator} />
        <TextInput
          value={national}
          onChangeText={setNational}
          placeholder={placeholder}
          keyboardType="phone-pad"
          placeholderTextColor={colors.mutedText}
          style={[{ color: colors.text }, styles.input]}
        />
      </View>
      {showError && !valid && national.length > 0 ? (
        <Body style={[{ color: colors.danger }, styles.error]}>Invalid phone number</Body>
      ) : null}
      <CountryPicker
        show={pickerOpen}
        pickerButtonOnPress={(item: any) => {
          setCountryCode(item.code);
          setCallingCode(`+${item.dial_code}`.replace('++', '+'));
          setPickerOpen(false);
        }}
        popularCountries={['en', 'ua', 'pl', 'US']}
        onBackdropPress={() => setPickerOpen(false)}
        lang={'en'}
        inputPlaceholder={'Search country'}
        searchMessage={'No country found'}
        style={{
          modal: { 
            height: 500,
          },
          textInput: { marginHorizontal: 12 },
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { },
  inputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderWidth: 1, 
    backgroundColor: 'transparent'
  },
  ccButton: { 
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12, 
    paddingVertical: 10,
    gap: 6
  },
  flagText: { 
    fontSize: 18 
  },
  ccText: { 
    fontSize: 16, 
    fontWeight: '600' 
  },
  separator: { 
    width: 1, 
    height: 20, 
    backgroundColor: '#E5E7EB',
    marginHorizontal: 4
  },
  input: { 
    flex: 1,
    paddingHorizontal: 12, 
    paddingVertical: 10, 
    fontSize: 16 
  },
  error: { marginTop: 6 },
});


