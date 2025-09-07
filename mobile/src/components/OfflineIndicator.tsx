import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useAppSelector } from '../store/hooks';
import { selectIsOnline } from '../store/offlineSlice';
import { useTheme } from '../theme/ThemeProvider';
import { typography } from '../theme/typography';

type OfflineIndicatorProps = {
  style?: ViewStyle;
};

export function OfflineIndicator({ style }: OfflineIndicatorProps) {
  const isOnline = useAppSelector(selectIsOnline);
  const { colors } = useTheme();

  if (isOnline) return null;

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: colors.danger, // Darker red
      },
      style
    ]}>
      <Text style={[styles.text, { color: colors.primaryText }]}>
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
  },
  text: {
    fontSize: typography.sizes.bodySmall,
    fontWeight: typography.weights.medium,
  },
});
