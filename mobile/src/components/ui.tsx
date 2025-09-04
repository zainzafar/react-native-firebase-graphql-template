import React from 'react';
import { StyleSheet, Text, TextInput, View, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';

export { Button } from './Button';

export function useTopInset() {
  const insets = useSafeAreaInsets();
  return Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 20 : insets.top + 20;
}

export function ScreenContainer({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  return <View style={[styles.screen, { backgroundColor: colors.background }]}>{children}</View>;
}

export function Card({ children, style }: { children: React.ReactNode; style?: any }) {
  const { colors } = useTheme();
  return <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }, style]}>{children}</View>;
}

export function Heading({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  return <Text style={[styles.heading, { color: colors.text }]}>{children}</Text>;
}

export function Body({ children, style }: { children: React.ReactNode; style?: any }) {
  const { colors } = useTheme();
  return <Text style={[styles.body, { color: colors.mutedText }, style]}>{children}</Text>;
}

type InputProps = {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: any;
  textContentType?: any;
  autoComplete?: any;
  editable?: boolean;
};

export function Input(props: InputProps) {
  const { colors } = useTheme();
  return (
    <TextInput
      {...props}
      placeholderTextColor={colors.mutedText}
      style={[styles.input, { color: colors.text, borderColor: colors.border }]}
      autoCorrect={false}
      spellCheck={false}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, gap: 16, justifyContent: 'center' },
  card: { borderWidth: 1, borderRadius: 16, padding: 20, gap: 12, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  heading: { fontSize: 24, fontWeight: '700', letterSpacing: 0.3 },
  body: { fontSize: 14 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
});


