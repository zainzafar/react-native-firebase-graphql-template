export const borderRadius = {
  xs: 2,                  // Very small elements, dividers
  sm: 4,                  // Small badges, tags
  md: 8,                  // Standard inputs, small cards
  lg: 12,                 // Buttons, medium cards
  xl: 16,                 // Large cards, containers
  xxl: 24,                // Auth buttons, special rounded elements
} as const;

export const layout = {
  screenGutter: 20,
  screenPaddingHorizontal: 20,
  screenPaddingVertical: 20,
  
  // Standardized container gaps
  containerGap: 12,        // Standard gap for most containers
  containerGapSmall: 8,    // Smaller gap for compact containers
  cardGap: 16,            // Standard gap for card content
  formGap: 12,            // Standard gap for forms
  menuGap: 16,            // Standard gap for menu items
  sectionGap: 20,         // Standard gap for sections
  
  // Loading states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  
  // Common containers
  formContainer: { gap: 12 },
  cardContainer: { gap: 16 },
  menuContainer: { gap: 16 },
  sectionContainer: { gap: 20 },
  
  // Empty states
  emptyCard: { marginTop: 16 },
  
  // Text input styling
  textArea: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: 12,
    textAlignVertical: 'top',
    minHeight: 80,
  },
} as const;

export type BorderRadius = typeof borderRadius;
export type Layout = typeof layout;
