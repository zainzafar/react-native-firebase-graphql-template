import React from 'react';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import ProviderButton, { ProviderButtonProps } from './ProviderButton';
import { useTheme } from '../../theme/ThemeProvider';

type Props = Omit<ProviderButtonProps, 'icon' | 'label'> & { label?: string };

export default function PhoneButton({ label = 'Continue with Phone', ...rest }: Props) {
  const { isDark, colors } = useTheme();
  const style = isDark
    ? { borderRadius: 24, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background, height: 48 }
    : { borderRadius: 24, borderWidth: 1, borderColor: '#CBD5E1', backgroundColor: '#F8FAFC', height: 48 };
  const iconColor = isDark ? colors.text : '#111827';
  const labelStyle = isDark ? { color: colors.text } : { color: '#111827' };
  return (
    <ProviderButton
      icon={<FontAwesome6 name="phone" iconStyle="solid" size={18} color={iconColor} />}
      label={label}
      style={style}
      labelStyle={labelStyle}
      {...rest}
    />
  );
}


