export const lightColors = {
  background: '#F8FAFC',
  card: '#FFFFFF',
  text: '#0F172A',
  mutedText: '#475569',
  primary: '#2563EB',
  primaryText: '#FFFFFF',
  border: '#E2E8F0',
  cardBorder: '#E2E8F0',
  accent: '#22C55E',
  danger: '#EF4444',
  buttonSuccess: '#059669',
  buttonError: '#DC2626',
  statusBarContent: 'dark-content' as const,
  datePickerTheme: 'light' as const,
} as const;

export type LightColors = typeof lightColors;
