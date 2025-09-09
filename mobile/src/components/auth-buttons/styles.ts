import { type AppColors, type BorderRadius } from '../../theme/base';

export function getProviderButtonBaseStyles(colors: AppColors, borderRadius: BorderRadius) {
  const containerStyle = {
    borderRadius: borderRadius.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    height: 48,
  };

  const labelStyle = { color: colors.text };
  const iconColor = colors.text;

  return { containerStyle, labelStyle, iconColor } as const;
}

export const providerIconSize = 18;


