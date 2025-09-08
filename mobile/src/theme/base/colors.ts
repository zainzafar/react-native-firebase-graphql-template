export const baseColors = {
  // Base color definitions that are shared across themes
  // These can be overridden by specific themes
  primary: '#2563EB',
  accent: '#22C55E',
  danger: '#EF4444',
  warning: '#F59E0B',
  buttonSuccess: '#059669',
  buttonError: '#DC2626',
} as const;

export type BaseColors = typeof baseColors;

// Generic AppColors interface that all themes must implement
export interface AppColors {
  background: string;
  card: string;
  text: string;
  mutedText: string;
  primary: string;
  primaryText: string;
  border: string;
  cardBorder: string;
  accent: string;
  danger: string;
  warning: string;
  buttonSuccess: string;
  buttonError: string;
  statusBarContent: 'light-content' | 'dark-content';
  datePickerTheme: 'light' | 'dark';
}
