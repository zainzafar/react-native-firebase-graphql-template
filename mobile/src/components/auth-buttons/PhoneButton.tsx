import React from 'react';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import ProviderButton, { ProviderButtonProps } from './ProviderButton';
import { useTheme } from '../../theme/ThemeProvider';
import { getProviderButtonBaseStyles, providerIconSize } from './styles';

type Props = Omit<ProviderButtonProps, 'icon' | 'label'> & { label?: string };

export default function PhoneButton({ label = 'Continue with Phone', ...rest }: Props) {
  const { colors, borderRadius } = useTheme();
  const { containerStyle: style, labelStyle, iconColor } = getProviderButtonBaseStyles(colors, borderRadius);
  return (
    <ProviderButton
      icon={<FontAwesome6 name="phone" iconStyle="solid" size={providerIconSize} color={iconColor} />}
      label={label}
      style={style}
      labelStyle={labelStyle}
      {...rest}
    />
  );
}


