import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, Animated } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';

type ButtonProps = {
  title: string;
  onPress?: () => void | Promise<void>;
  loading?: boolean;
  success?: boolean;
  successText?: string;
  successDuration?: number;
  onSuccessComplete?: () => void;
  error?: boolean;
  errorText?: string;
  errorDuration?: number;
  onErrorComplete?: () => void;
  variant?: 'primary' | 'ghost' | 'danger';
  disabled?: boolean;
  style?: any;
  icon?: any;
  iconStyle?: 'solid' | 'regular' | 'brand';
  textColor?: string;
  iconRight?: boolean;
};

export function Button({ 
  title, 
  onPress, 
  loading, 
  success, 
  successText, 
  successDuration = 3000,
  onSuccessComplete,
  error,
  errorText,
  errorDuration = 3000,
  onErrorComplete,
  variant = 'primary', 
  disabled, 
  style,
  icon,
  iconStyle = 'solid',
  textColor,
  iconRight,
}: ButtonProps) {
  const { colors, borderRadius } = useTheme();
  
  // Internal state to track animation completion
  const [internalSuccess, setInternalSuccess] = useState(false);
  const [internalError, setInternalError] = useState(false);
  
  // Subtle default background for ghost buttons so they look like buttons
  const isGhost = variant === 'ghost';
  const isDanger = variant === 'danger';
  const ghostBg = colors.card;
  const bg = variant === 'primary' ? colors.primary : ghostBg;
  const text = variant === 'primary' ? colors.primaryText : isDanger ? colors.danger : colors.text;
  const textColorFinal = textColor ?? text;
  const ghostBorder = colors.border;
  const borderColor = variant === 'primary' ? colors.primary : isDanger ? colors.danger : ghostBorder;
  
  // Success and error state styling
  const successBg = internalSuccess ? colors.buttonSuccess : bg;
  const successBorderColor = internalSuccess ? colors.buttonSuccess : borderColor;
  const errorBg = internalError ? colors.buttonError : bg;
  const errorBorderColor = internalError ? colors.buttonError : borderColor;
  
  // Determine final background and border color
  const finalBg = internalError ? errorBg : internalSuccess ? successBg : bg;
  const finalBorderColor = internalError ? errorBorderColor : internalSuccess ? successBorderColor : borderColor;
  
  // Animation for progress bar
  const progressAnim = useRef(new Animated.Value(0)).current;
  

  
  useEffect(() => {
    if (success) {
      setInternalSuccess(true);
      // Reset progress
      progressAnim.setValue(0);
      
      // Animate progress bar from 0 to 1 over successDuration
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: successDuration,
        useNativeDriver: false,
      }).start(() => {
        // Stop animation and call completion callback
        progressAnim.stopAnimation();
        onSuccessComplete?.();
        
        // Reset internal state after animation completes
        setInternalSuccess(false);
      });
    } else {
      // Reset progress when not in success state
      progressAnim.setValue(0);
      setInternalSuccess(false);
    }
  }, [success, successDuration, progressAnim, onSuccessComplete]);

  useEffect(() => {
    if (error) {
      setInternalError(true);
      // Reset progress animation
      progressAnim.setValue(0);
      
      // Animate progress bar from 0 to 1 (red animation)
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: errorDuration,
        useNativeDriver: false,
      }).start(() => {
        // Stop animation and call completion callback
        progressAnim.stopAnimation();
        onErrorComplete?.();
        
        // Reset internal state after animation completes
        setInternalError(false);
      });
    } else {
      setInternalError(false);
    }
  }, [error, progressAnim, onErrorComplete, errorDuration]);

  const handlePress = async () => {
    if (onPress) {
      try {
        await onPress();
      } catch (error) {
        // Error handling can be done by the parent component
        console.error('Button press error:', error);
      }
    }
  };
  
  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: finalBg, borderColor: finalBorderColor, borderRadius: borderRadius.lg },
        // Light shadow/elevation to give subtle button affordance
        styles.buttonShadow,
        (isGhost || isDanger) && styles.ghostEmphasis,
        pressed && (isGhost ? styles.ghostPressed : { opacity: 0.9 }),
        disabled && { opacity: 0.6 },
        style,
      ]}
      disabled={disabled || loading || internalSuccess || internalError}
    >
      {loading ? (
        <ActivityIndicator color={textColorFinal} />
      ) : internalSuccess ? (
        <View style={styles.successContainer}>
          <FontAwesome6 name="check" iconStyle="solid" size={16} color="white" />
          <Text style={[{ color: 'white', marginLeft: 8 }, styles.buttonText]} numberOfLines={1} ellipsizeMode="tail" allowFontScaling={false}>
            {successText || title}
          </Text>
        </View>
      ) : internalError ? (
        <View style={styles.errorContainer}>
          <FontAwesome6 name="triangle-exclamation" iconStyle="solid" size={16} color="white" />
          <Text style={[{ color: 'white', marginLeft: 8 }, styles.buttonText]} numberOfLines={1} ellipsizeMode="tail" allowFontScaling={false}>
            {errorText || 'Error occurred'}
          </Text>
        </View>
      ) : (
        <View style={styles.contentContainer}>
          {icon && !iconRight && (
            <FontAwesome6 
              name={icon} 
              iconStyle={iconStyle} 
              size={16} 
              color={textColorFinal} 
              style={styles.iconLeft}
            />
          )}
          <Text style={[{ color: textColorFinal }, styles.buttonText]} numberOfLines={1} ellipsizeMode="tail" allowFontScaling={false}>
            {title}
          </Text>
          {icon && iconRight && (
            <FontAwesome6 
              name={icon} 
              iconStyle={iconStyle} 
              size={16} 
              color={textColorFinal} 
              style={styles.iconRight}
            />
          )}
        </View>
      )}
      
      {/* Progress bar overlay */}
      {(internalSuccess || internalError) && (
        <View style={styles.progressContainer}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
                backgroundColor: internalError ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.3)',
              },
            ]}
          />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { borderWidth: 1, paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center', overflow: 'hidden' },
  buttonShadow: { shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 0 },
  ghostEmphasis: { borderWidth: 1.5, shadowOpacity: 0.03, shadowRadius: 6, shadowOffset: { width: 0, height: 1 }, elevation: 0.5 },
  ghostPressed: { opacity: 0.95, transform: [{ scale: 0.995 }] },
  buttonText: { fontSize: 16, fontWeight: '600' },
  contentContainer: { flexDirection: 'row', alignItems: 'center' },
  successContainer: { flexDirection: 'row', alignItems: 'center' },
  errorContainer: { flexDirection: 'row', alignItems: 'center' },
  iconLeft: { marginRight: 8 },
  iconRight: { marginLeft: 8 },
  progressContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center' },
  progressBar: { height: '100%', backgroundColor: 'rgba(255,255,255,0.2)' },
});

