export const typography = {
  // Font sizes
  sizes: {
    // Headers
    h1: 24,
    h2: 20,
    h3: 18,
    
    // Body text
    body: 16,
    bodySmall: 14,
    
    // Labels and form elements
    label: 16,
    labelSmall: 12,
    
    // Captions and helper text
    caption: 12,
    captionSmall: 10,
    
    // Button text
    button: 16,
    buttonSmall: 14,
  },
  
  // Font weights
  weights: {
    light: '300',
    normal: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
  },
  
  // Line heights
  lineHeights: {
    tight: 16,
    normal: 20,
    relaxed: 24,
  },
} as const;

export type Typography = typeof typography;
