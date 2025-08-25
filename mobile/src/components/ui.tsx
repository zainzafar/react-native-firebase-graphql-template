import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export function ScreenContainer({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  return <View style={[styles.screen, { backgroundColor: colors.background }]}>{children}</View>;
}

export function Card({ children, style }: { children: React.ReactNode; style?: any }) {
  const { colors } = useTheme();
  return <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, style]}>{children}</View>;
}

export function Heading({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  return <Text style={[styles.heading, { color: colors.text }]}>{children}</Text>;
}

export function Body({ children, style }: { children: React.ReactNode; style?: any }) {
  const { colors } = useTheme();
  return <Text style={[styles.body, { color: colors.mutedText }, style]}>{children}</Text>;
}

type ButtonProps = {
  title: string;
  onPress?: () => void;
  loading?: boolean;
  variant?: 'primary' | 'ghost';
  disabled?: boolean;
  style?: any;
};

export function Button({ title, onPress, loading, variant = 'primary', disabled, style }: ButtonProps) {
  const { colors } = useTheme();
  const bg = variant === 'primary' ? colors.primary : 'transparent';
  const text = variant === 'primary' ? colors.primaryText : colors.text;
  const borderColor = variant === 'primary' ? colors.primary : colors.border;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, borderColor },
        pressed && { opacity: 0.9 },
        disabled && { opacity: 0.6 },
        style,
      ]}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={text} />
      ) : (
        <Text style={[styles.buttonText, { color: text }]}>{title}</Text>
      )}
    </Pressable>
  );
}

type InputProps = {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: any;
};

export function Input(props: InputProps) {
  const { colors } = useTheme();
  return (
    <TextInput
      {...props}
      placeholderTextColor={colors.mutedText}
      style={[styles.input, { color: colors.text, borderColor: colors.border }]}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, gap: 16, justifyContent: 'center' },
  card: { borderWidth: 1, borderRadius: 16, padding: 20, gap: 12, shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  heading: { fontSize: 24, fontWeight: '700', letterSpacing: 0.3 },
  body: { fontSize: 14 },
  button: { borderWidth: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  buttonText: { fontSize: 16, fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
});


