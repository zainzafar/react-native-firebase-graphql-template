import React from 'react';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import ProviderButton, { ProviderButtonProps } from './ProviderButton';
import { useTheme } from '../../theme/ThemeProvider';
import { getProviderButtonBaseStyles, providerIconSize } from './styles';

type Props = Omit<ProviderButtonProps, 'icon' | 'label'> & { label?: string };

export default function EmailButton({ label = 'Continue with Email', ...rest }: Props) {
  const { isDark, colors, borderRadius } = useTheme();
  const { containerStyle: style, labelStyle, iconColor } = getProviderButtonBaseStyles(isDark, colors, borderRadius);
  return (
    <ProviderButton
      icon={<FontAwesome6 name="envelope" iconStyle="regular" size={providerIconSize} color={iconColor} />}
      label={label}
      style={style}
      labelStyle={labelStyle}
      {...rest}
    />
  );
}


