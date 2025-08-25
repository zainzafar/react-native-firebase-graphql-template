import React from 'react';
import ProviderButton, { ProviderButtonProps } from './ProviderButton';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { useTheme } from '../../theme/ThemeProvider';
import { getProviderButtonBaseStyles, providerIconSize } from './styles';

type Props = Omit<ProviderButtonProps, 'icon' | 'label' | 'style' | 'labelStyle'> & {
  label?: string;
};

export default function AppleButton({ label = 'Sign in with Apple', onPress, disabled, loading }: Props) {
  const { isDark } = useTheme();
  const { containerStyle, labelStyle, iconColor } = getProviderButtonBaseStyles(isDark, ({} as any));
  return (
    <ProviderButton
      icon={<FontAwesome6 name="apple" iconStyle="brand" size={providerIconSize} color={iconColor} />}
      label={label}
      onPress={onPress}
      disabled={disabled || loading}
      loading={loading}
      style={containerStyle}
      labelStyle={labelStyle}
    />
  );
}