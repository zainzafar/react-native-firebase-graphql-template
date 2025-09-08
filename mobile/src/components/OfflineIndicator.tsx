import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useAppSelector } from '../store/hooks';
import { selectIsOnline, selectIsNetworkInitialized } from '../store/offlineSlice';
import { useTheme } from '../theme/ThemeProvider';

type OfflineIndicatorProps = {
  style?: ViewStyle;
};

export function OfflineIndicator({ style }: OfflineIndicatorProps) {
  const isOnline = useAppSelector(selectIsOnline);
  const isNetworkInitialized = useAppSelector(selectIsNetworkInitialized);
  const { colors, borderRadius, typography } = useTheme();

  // Don't show offline indicator until network status has been properly initialized
  if (!isNetworkInitialized || isOnline) return null;

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: colors.danger, // Darker red
        borderRadius: borderRadius.xl,
      },
      style
    ]}>
      <Text style={[
        { 
          color: colors.primaryText,
          fontSize: typography.sizes.bodySmall,
          fontWeight: typography.weights.medium,
        }
      ]}>
        You're offline
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginVertical: 16,
  },
});
