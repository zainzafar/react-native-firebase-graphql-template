import React from 'react';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import ProviderButton, { ProviderButtonProps } from './ProviderButton';
import { useTheme } from '../../theme/ThemeProvider';

type Props = Omit<ProviderButtonProps, 'icon' | 'label'> & { label?: string };

export default function GoogleButton({ label = 'Continue with Google', ...rest }: Props) {
  const { isDark, colors } = useTheme();
  const style = isDark
    ? { borderRadius: 24, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background, height: 48 }
    : { borderRadius: 24, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF', height: 48 };
  const labelStyle = isDark ? { color: colors.text } : { color: '#111827' };
  return (
    <ProviderButton
      icon={<FontAwesome6 name="google" iconStyle="brand" size={18} color="#EA4335" />}
      label={label}
      style={style}
      labelStyle={labelStyle}
      {...rest}
    />
  );
}


