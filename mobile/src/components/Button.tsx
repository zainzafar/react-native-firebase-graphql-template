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
  variant?: 'primary' | 'ghost';
  disabled?: boolean;
  style?: any;
  icon?: any;
  iconStyle?: 'solid' | 'regular' | 'brand';
  textColor?: string;
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
  variant = 'primary', 
  disabled, 
  style,
  icon,
  iconStyle = 'solid',
  textColor,
}: ButtonProps) {
  const { colors, isDark } = useTheme();
  // Subtle default background for ghost buttons so they look like buttons
  const isGhost = variant !== 'primary';
  const ghostBg = isDark ? 'rgba(255,255,255,0.06)' : colors.card;
  const bg = variant === 'primary' ? colors.primary : ghostBg;
  const text = variant === 'primary' ? colors.primaryText : colors.text;
  const textColorFinal = textColor ?? text;
  const ghostBorder = isDark ? 'rgba(255,255,255,0.14)' : colors.border;
  const borderColor = variant === 'primary' ? colors.primary : ghostBorder;
  
  // Success and error state styling
  const successBg = success ? '#059669' : bg;
  const successBorderColor = success ? '#059669' : borderColor;
  const errorBg = error ? '#DC2626' : bg;
  const errorBorderColor = error ? '#DC2626' : borderColor;
  
  // Determine final background and border color
  const finalBg = error ? errorBg : success ? successBg : bg;
  const finalBorderColor = error ? errorBorderColor : success ? successBorderColor : borderColor;
  
  // Animation for progress bar
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  // Error animation state
  const [errorAnimating, setErrorAnimating] = useState(false);
  
  useEffect(() => {
    if (success) {
      // Reset progress
      progressAnim.setValue(0);
      
      // Animate progress bar from 0 to 1 over successDuration
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: successDuration,
        useNativeDriver: false,
      }).start(() => {
        // Call onSuccessComplete when animation finishes
        onSuccessComplete?.();
      });
    } else {
      // Reset progress when not in success state
      progressAnim.setValue(0);
    }
  }, [success, successDuration, progressAnim, onSuccessComplete]);

  useEffect(() => {
    if (error && !errorAnimating) {
      setErrorAnimating(true);
      
      // Reset progress animation
      progressAnim.setValue(0);
      
      // Animate progress bar from 0 to 1 (red animation)
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 3000, // 3 seconds for error animation
        useNativeDriver: false,
      }).start(() => {
        // Reset error state and call completion callback
        setErrorAnimating(false);
        if (onSuccessComplete) {
          onSuccessComplete();
        }
      });
    }
  }, [error, errorAnimating, progressAnim, onSuccessComplete]);

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
        { backgroundColor: finalBg, borderColor: finalBorderColor },
        // Light shadow/elevation to give subtle button affordance
        !isDark && styles.buttonShadow,
        isGhost && (isDark ? { borderWidth: 1.5 } : styles.ghostEmphasis),
        pressed && (isGhost ? styles.ghostPressed : { opacity: 0.9 }),
        disabled && { opacity: 0.6 },
        style,
      ]}
      disabled={disabled || loading || success || error}
    >
      {loading ? (
        <ActivityIndicator color={textColorFinal} />
      ) : success ? (
        <View style={styles.successContainer}>
          <FontAwesome6 name="check" iconStyle="solid" size={16} color="white" />
          <Text style={[styles.buttonText, { color: 'white', marginLeft: 8 }]} numberOfLines={1} ellipsizeMode="tail" allowFontScaling={false}>
            {successText || title}
          </Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <FontAwesome6 name="triangle-exclamation" iconStyle="solid" size={16} color="white" />
          <Text style={[styles.buttonText, { color: 'white', marginLeft: 8 }]} numberOfLines={1} ellipsizeMode="tail" allowFontScaling={false}>
            {errorText || 'Error occurred'}
          </Text>
        </View>
      ) : (
        <View style={styles.contentContainer}>
          {icon && (
            <FontAwesome6 
              name={icon} 
              iconStyle={iconStyle} 
              size={16} 
              color={textColorFinal} 
              style={styles.icon}
            />
          )}
          <Text style={[styles.buttonText, { color: textColorFinal }]} numberOfLines={1} ellipsizeMode="tail" allowFontScaling={false}>
            {title}
          </Text>
        </View>
      )}
      
      {/* Progress bar overlay */}
      {(success || error) && (
        <View style={styles.progressContainer}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
                backgroundColor: error ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.3)',
              },
            ]}
          />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { borderWidth: 1, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center', overflow: 'hidden' },
  buttonShadow: { shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 0 },
  ghostEmphasis: { borderWidth: 1.5, shadowOpacity: 0.03, shadowRadius: 6, shadowOffset: { width: 0, height: 1 }, elevation: 0.5 },
  ghostPressed: { opacity: 0.95, transform: [{ scale: 0.995 }] },
  buttonText: { fontSize: 16, fontWeight: '600' },
  contentContainer: { flexDirection: 'row', alignItems: 'center' },
  successContainer: { flexDirection: 'row', alignItems: 'center' },
  errorContainer: { flexDirection: 'row', alignItems: 'center' },
  icon: { marginRight: 8 },
  progressContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center' },
  progressBar: { height: '100%', backgroundColor: 'rgba(255,255,255,0.2)' },
});
