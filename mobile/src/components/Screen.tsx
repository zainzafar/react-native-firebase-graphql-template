import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useTheme } from '../theme/ThemeProvider';
import { useAppSelector } from '../store/hooks';
import { selectIsOnline } from '../store/offlineSlice';
import { selectIsImpersonating } from '../features/auth/selectors';
import { OfflineIndicator } from './OfflineIndicator';
import { ImpersonationBanner } from './ImpersonationBanner';
import { useTopInset } from './ui';

// Debug flag to control border visibility
const DEBUG_BORDERS = __DEV__ && false; // Set to true to enable debug borders

// Custom hook to safely get bottom tab bar height
function useSafeBottomTabBarHeight() {
  try {
    return useBottomTabBarHeight();
  } catch {
    return 0;
  }
}

type ScreenProps = {
  children: React.ReactNode;
  /** Use a ScrollView (true) or a static View (false). Defaults to true. */
  scroll?: boolean;
  /** Extra style for the outer SafeAreaView container. */
  style?: StyleProp<ViewStyle>;
  /** Extra style for the inner content container (ScrollView contentContainerStyle or static View). */
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** Which safe-area edges to apply; if omitted we auto-detect based on header presence. */
  edges?: Edge[];
  /** Show vertical scroll indicator; defaults to false. */
  showScrollIndicator?: boolean;
  /** Add vertical padding in static mode; defaults to true. */
  paddedStatic?: boolean;
};

export function Screen({
  children,
  scroll = false,
  style,
  contentContainerStyle,
  edges,
  showScrollIndicator = false,
  paddedStatic = true,
}: ScreenProps) {
  const { colors, layout } = useTheme();
  const headerHeight = useHeaderHeight();
  const bottomTabBarHeight = useSafeBottomTabBarHeight();
  const hasHeader = headerHeight > 0;
  const hasBottomTabBar = bottomTabBarHeight > 0;
  
  // Check if banners are visible
  const isOnline = useAppSelector(selectIsOnline);
  const isImpersonating = useAppSelector(selectIsImpersonating);
  const hasOfflineBanner = !isOnline;
  const hasImpersonationBanner = isImpersonating;
  const topInset = useTopInset();

  // If caller provides edges, use them; otherwise: dynamically determine edges
  // based on header, bottom tab bar, and banner presence
  const safeAreaEdges: Edge[] = useMemo(() => {
    if (edges) return edges;
    
    const result: Edge[] = [];
    // Don't add top edge if there's a header OR any banner (both handle safe area)
    if (!hasHeader && !hasOfflineBanner && !hasImpersonationBanner) result.push('top');
    if (!hasBottomTabBar) result.push('bottom');
    return result;
  }, [edges, hasHeader, hasBottomTabBar, hasOfflineBanner, hasImpersonationBanner]);

  // The outer container should handle horizontal gutter only.
  const containerStyle: StyleProp<ViewStyle> = [
    styles.flex,
    { 
      backgroundColor: colors.background, 
      paddingHorizontal: layout.screenGutter,
      paddingVertical: layout.screenGutter,
      ...(DEBUG_BORDERS ? {
        borderWidth: 2,
        borderColor: '#FF0000', // Red border for SafeAreaView container
      } : {}),
    },
    style,
  ];

  // Keep a comfortable top and bottom padding in both modes.
  const baseContentPadding: ViewStyle = {
    paddingTop: 0,
    paddingBottom: 0,
    margin: 0,
  };

  const scrollContent: StyleProp<ViewStyle> = [
    styles.scrollContentGrow,
    baseContentPadding,
    ...(DEBUG_BORDERS ? [{
      borderWidth: 2,
      borderColor: '#00FF00', // Green border for ScrollView content
      backgroundColor: 'rgba(0, 255, 0, 0.1)', // Light green background for ScrollView
    }] : []),
    contentContainerStyle,
  ];

  const staticContent: StyleProp<ViewStyle> = [
    styles.flex,
    paddedStatic ? baseContentPadding : null,
    ...(DEBUG_BORDERS ? [{
      borderWidth: 2,
      borderColor: '#0000FF', // Blue border for static content
      backgroundColor: 'rgba(0, 0, 255, 0.1)', // Light blue background for static content
    }] : []),
    contentContainerStyle,
  ];

  const impersonationBannerStyle: ViewStyle = { marginTop: !hasHeader ? topInset : 0 };
  const offlineBannerStyle: ViewStyle = { marginTop: 0 }; // No top margin when impersonation banner is present
  return (
    <SafeAreaView style={containerStyle} edges={safeAreaEdges}>
      {/* Impersonation banner renders above offline banner */}
      <ImpersonationBanner style={impersonationBannerStyle} />
      <OfflineIndicator style={hasImpersonationBanner ? offlineBannerStyle : impersonationBannerStyle} />
      {scroll ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={scrollContent}
          showsVerticalScrollIndicator={showScrollIndicator}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentInsetAdjustmentBehavior="never"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={staticContent}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flex: 1 },
  scrollContentGrow: { flexGrow: 1 },
});