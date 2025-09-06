export const layout = {
  screenGutter: 20,
  screenPaddingHorizontal: 20,
  screenPaddingVertical: 20,
  
  // Standardized container gaps
  containerGap: 12,        // Standard gap for most containers
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
} as const;

export type Layout = typeof layout;
