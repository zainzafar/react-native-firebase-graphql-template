import React from 'react';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import ProviderButton, { ProviderButtonProps } from './ProviderButton';
import { useTheme } from '../../theme/ThemeProvider';
import { getProviderButtonBaseStyles, providerIconSize } from './styles';

type Props = Omit<ProviderButtonProps, 'icon' | 'label'> & { label?: string };

export default function GoogleButton({ label = 'Continue with Google', ...rest }: Props) {
  const { isDark, colors } = useTheme();
  const { containerStyle: style, labelStyle } = getProviderButtonBaseStyles(isDark, colors);
  return (
    <ProviderButton
      icon={<FontAwesome6 name="google" iconStyle="brand" size={providerIconSize} color="#EA4335" />}
      label={label}
      style={style}
      labelStyle={labelStyle}
      {...rest}
    />
  );
}


