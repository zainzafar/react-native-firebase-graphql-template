import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TouchableOpacity, Alert } from 'react-native';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { selectIsImpersonating, selectImpersonatedUser } from '../features/auth/selectors';
import { endImpersonation } from '../features/auth/authSlice';
import { clearImpersonationToken } from '../auth/tokenStorage';
import { apolloClient } from '../graphql/client';
import { useTheme } from '../theme/ThemeProvider';
import { useNavigation } from '@react-navigation/native';

type ImpersonationBannerProps = {
  style?: ViewStyle;
};

export function ImpersonationBanner({ style }: ImpersonationBannerProps) {
  const isImpersonating = useAppSelector(selectIsImpersonating);
  const impersonatedUser = useAppSelector(selectImpersonatedUser);
  const dispatch = useAppDispatch();
  const navigation = useNavigation();
  const { colors, borderRadius, typography } = useTheme();

  // Don't show banner if not impersonating
  if (!isImpersonating || !impersonatedUser) return null;

  const handleEndImpersonation = () => {
    Alert.alert(
      'End Impersonation',
      'Are you sure you want to end impersonation?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'End Impersonation',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear impersonation token first
              await clearImpersonationToken();
              
              // Small delay to ensure token is cleared before cache reset
              await new Promise<void>(resolve => setTimeout(resolve, 100));
              
              // Reset Apollo cache to prevent cross-user data bleed
              await apolloClient.resetStore();
              
              // Update Redux state
              dispatch(endImpersonation());
              
              // Reset navigation and go to home screen
              (navigation as any).reset({
                index: 0,
                routes: [{ name: 'Home' }],
              });
            } catch (error) {
              console.error('Failed to end impersonation:', error);
              // Still dispatch endImpersonation to reset UI state
              dispatch(endImpersonation());
            }
          },
        },
      ]
    );
  };

  const displayName = impersonatedUser.displayName || impersonatedUser.email || 'Unknown User';
  
  // Build helper text with available contact info
  const contactInfo = [];
  if (impersonatedUser.email && impersonatedUser.email !== displayName) {
    contactInfo.push(impersonatedUser.email);
  }
  if (impersonatedUser.phoneNumber) {
    contactInfo.push(impersonatedUser.phoneNumber);
  }
  const helperText = contactInfo.length > 0 ? contactInfo.join(', ') : '';

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: colors.warning, // Orange warning color for impersonation
        borderRadius: borderRadius.xl,
      },
      style
    ]}>
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={[
            styles.text,
            { 
              color: colors.primaryText,
              fontSize: typography.sizes.bodySmall,
              fontWeight: typography.weights.medium,
            }
          ]}>
            Impersonating {displayName}
          </Text>
          {helperText && (
            <Text style={[
              { 
                color: colors.primaryText,
                fontSize: typography.sizes.caption,
                fontWeight: typography.weights.normal,
              },
              styles.helperText
            ]}>
              ({helperText})
            </Text>
          )}
        </View>
        <TouchableOpacity 
          onPress={handleEndImpersonation}
          style={[
            styles.endButton,
            {
              backgroundColor: colors.primaryText,
              borderRadius: borderRadius.sm,
            }
          ]}
        >
          <Text style={[
            styles.endButtonText,
            {
              color: colors.warning,
              fontSize: typography.sizes.bodySmall,
              fontWeight: typography.weights.semiBold,
            }
          ]}>
            End
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginVertical: 16,
    zIndex: 1000, // Higher z-index than offline banner
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  text: {
    // Remove flex and marginRight from here since they're now in textContainer
  },
  helperText: {
    marginTop: 2,
    // marginLeft: -2,
    opacity: 0.8,
  },
  endButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    minWidth: 60,
    alignItems: 'center',
  },
  endButtonText: {
    textAlign: 'center',
  },
});
