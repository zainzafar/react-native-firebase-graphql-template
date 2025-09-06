export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  
  // Standardized semantic spacing
  form: 12,               // Standard form spacing
  card: 16,               // Standard card spacing
  menu: 16,               // Standard menu spacing
  section: 20,            // Standard section spacing
  
  // Padding standards
  padding: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 32,
  },
} as const;

export type Spacing = typeof spacing;
