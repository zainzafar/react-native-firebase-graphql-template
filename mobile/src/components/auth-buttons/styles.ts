import { AppColors } from '../../theme/colors';

export function getProviderButtonBaseStyles(isDark: boolean, colors: AppColors, borderRadius: any) {
  const containerStyle = isDark
    ? {
        borderRadius: borderRadius.xxl,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.background,
        height: 48,
      }
    : {
        borderRadius: borderRadius.xxl,
        borderWidth: 1,
        // Match other provider buttons (slate-300) and soft background
        borderColor: '#CBD5E1',
        backgroundColor: '#F8FAFC',
        height: 48,
      };

  const labelStyle = isDark ? { color: colors.text } : { color: '#111827' };
  const iconColor = isDark ? colors.text : '#111827';

  return { containerStyle, labelStyle, iconColor } as const;
}

export const providerIconSize = 18;


