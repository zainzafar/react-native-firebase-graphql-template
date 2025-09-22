import React from 'react';
import { StyleSheet, Text, TextInput, View, Platform, StatusBar, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';

export { Button } from './Button';

export function useTopInset() {
  const insets = useSafeAreaInsets();
  return Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : insets.top;
}

export function ScreenContainer({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  return <View style={[{ backgroundColor: colors.background }, styles.screen]}>{children}</View>;
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle | ViewStyle[] }) {
  const { colors, borderRadius } = useTheme();
  return <View style={[{ backgroundColor: colors.card, borderColor: colors.cardBorder, borderRadius: borderRadius.xl }, styles.card, style]}>{children}</View>;
}

export function Heading({ children, style }: { children: React.ReactNode; style?: TextStyle | TextStyle[] }) {
  const { colors } = useTheme();
  return <Text style={[{ color: colors.text }, styles.heading, style]}>{children}</Text>;
}

export function Body({ children, style }: { children: React.ReactNode; style?: TextStyle | TextStyle[] }) {
  const { colors } = useTheme();
  return <Text style={[{ color: colors.mutedText }, styles.body, style]}>{children}</Text>;
}

type InputProps = {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'number-pad' | 'decimal-pad' | 'url';
  textContentType?: 'none' | 'URL' | 'addressCity' | 'addressCityAndState' | 'addressState' | 'countryName' | 'creditCardNumber' | 'emailAddress' | 'familyName' | 'fullStreetAddress' | 'givenName' | 'jobTitle' | 'location' | 'middleName' | 'name' | 'namePrefix' | 'nameSuffix' | 'nickname' | 'organizationName' | 'postalCode' | 'streetAddressLine1' | 'streetAddressLine2' | 'sublocality' | 'telephoneNumber' | 'username' | 'password' | 'newPassword' | 'oneTimeCode';
  autoComplete?: 'off' | 'username' | 'password' | 'email' | 'name' | 'tel' | 'street-address' | 'postal-code' | 'cc-number' | 'cc-csc' | 'cc-exp' | 'cc-exp-month' | 'cc-exp-year' | 'new-password' | 'given-name' | 'family-name' | 'sms-otp';
  editable?: boolean;
  style?: TextStyle | TextStyle[];
};

export function Input(props: InputProps) {
  const { colors, borderRadius } = useTheme();
  const { style, ...otherProps } = props;
  return (
    <TextInput
      {...otherProps}
      placeholderTextColor={colors.mutedText}
      style={[{ color: colors.text, borderColor: colors.border, borderRadius: borderRadius.md }, styles.input, style]}
      autoCorrect={false}
      spellCheck={false}
    />
  );
}

// Standardized Loading Components
export function LoadingContainer({ children, text }: { children?: React.ReactNode; text?: string }) {
  const { colors, layout } = useTheme();
  return (
    <View style={[layout.loadingContainer, { backgroundColor: colors.background }]}>
      {children || <ActivityIndicator size="large" color={colors.mutedText} />}
      {text && <Text style={[{ color: colors.mutedText }, styles.loadingText]}>{text}</Text>}
    </View>
  );
}

export function InlineLoader({ text }: { text?: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.inlineLoader}>
      <ActivityIndicator size="small" color={colors.mutedText} />
      {text && <Text style={[{ color: colors.mutedText }, styles.inlineLoadingText]}>{text}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, justifyContent: 'center' },
  card: { borderWidth: 1, padding: 20, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 1, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  heading: { fontSize: 24, fontWeight: '700', letterSpacing: 0.3 },
  body: { fontSize: 14 },
  input: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
  loadingText: { fontSize: 16, textAlign: 'center', marginTop: 8 },
  inlineLoader: { flexDirection: 'row', alignItems: 'center' },
  inlineLoadingText: { fontSize: 14, fontStyle: 'italic' },
});


