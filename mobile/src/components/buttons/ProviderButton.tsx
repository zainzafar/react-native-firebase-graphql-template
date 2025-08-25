import React from 'react';
import { Pressable, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

export type ProviderButtonProps = {
  icon: React.ReactNode;
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  style?: any;
  labelStyle?: any;
  loading?: boolean;
};

export default function ProviderButton({ icon, label, onPress, disabled, style, labelStyle, loading }: ProviderButtonProps) {
  const { colors } = useTheme();
  const spinnerColor = (labelStyle && labelStyle.color) || colors.text;
  return (
    <Pressable onPress={onPress} disabled={disabled || loading} style={({ pressed }) => [styles.rowBtn, style, pressed && styles.pressed, (disabled || loading) && styles.disabled]}>
      <View style={styles.iconWrap}>{icon}</View>
      {loading ? (
        <ActivityIndicator color={spinnerColor} />
      ) : (
        <Text style={[styles.btnLabel, labelStyle]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  rowBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 24, borderWidth: 1, height: 48 },
  pressed: { opacity: 0.9 },
  disabled: { opacity: 0.6 },
  iconWrap: { width: 22, alignItems: 'center', marginRight: 8 },
  btnLabel: { fontSize: 16, fontWeight: '600', textAlign: 'center' },
});


