export const darkColors = {
  background: '#0B1220',
  card: '#111827',
  text: '#E5E7EB',
  mutedText: '#9CA3AF',
  primary: '#60A5FA',
  primaryText: '#0B1220',
  border: '#1F2937',
  cardBorder: '#1F2937',
  accent: '#34D399',
  danger: '#F87171',
  buttonSuccess: '#059669',
  buttonError: '#DC2626',
  statusBarContent: 'light-content' as const,
  datePickerTheme: 'dark' as const,
} as const;

export type DarkColors = typeof darkColors;
