import React, { useEffect, useRef, useState } from 'react';
import { Alert, View, StyleSheet, LayoutAnimation, Platform, UIManager, Animated, Easing } from 'react-native';
//
import { Card, Heading, Screen } from '../components';
import { useTheme } from '../theme/ThemeProvider';
import { GoogleButton, EmailButton, PhoneButton, AppleButton as AppleSignInButton } from '../components/auth-buttons';
import { useAuth } from '../auth/AuthProvider';
import AppleAuth from '@invertase/react-native-apple-authentication';
import EmailForm from './AuthScreen/EmailForm';
import PhoneForm from './AuthScreen/PhoneForm';

type Mode = 'methods' | 'email' | 'phone';

export default function AuthScreen() {
  const { layout } = useTheme();
  const { signInWithGoogle, signInWithApple } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [mode, setMode] = useState<Mode>('methods');
  const appear = useRef(new Animated.Value(1)).current;
  const appleSupported = AppleAuth?.isSupported === true && Platform.OS === 'ios';

  const goTo = (next: Mode) => {
    if (Platform.OS === 'android') {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setMode(next);
  };

  useEffect(() => {
    if (Platform.OS === 'android' && (UIManager as { setLayoutAnimationEnabledExperimental?: (enabled: boolean) => void })?.setLayoutAnimationEnabledExperimental) {
      try { (UIManager as { setLayoutAnimationEnabledExperimental: (enabled: boolean) => void }).setLayoutAnimationEnabledExperimental(true); } catch {}
    }
  }, []);

  useEffect(() => {
    // Fade/slide in current content so Android gets a smooth transition
    appear.setValue(0);
    Animated.timing(appear, {
      toValue: 1,
      duration: 1000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [mode, appear]);

  const onSignInWithGoogle = async () => {
    try {
      setGoogleLoading(true);
      await signInWithGoogle();
    } catch (e: unknown) {
      // Handle user cancellation gracefully
      const error = e as { code?: string; message?: string };
      if (error?.code === 'SIGN_IN_CANCELLED' || 
          error?.code === 'SIGN_IN_REQUIRED' ||
          error?.message?.includes('cancelled') ||
          error?.message?.includes('canceled') ||
          error?.message?.includes('user_cancelled') ||
          error?.message?.includes('user_canceled')) {
        // User cancelled - this is not an error, do nothing
        return;
      }
      // For other errors, show alert
      const msg = error?.message || 'Google Sign-In failed';
      Alert.alert('Google Sign-In', msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  const onSignInWithApple = async () => {
    try {
      setAppleLoading(true);
      await signInWithApple();
    } catch (e: unknown) {
      // Handle user cancellation gracefully
      const error = e as { code?: number; message?: string };
      if (error?.code === 1001 || error?.message?.includes('1001')) {
        // User cancelled - this is not an error, do nothing
        return;
      }
      // For other errors, show alert
      const msg = error?.message || 'Apple Sign-In failed';
      Alert.alert('Apple Sign-In', msg);
    } finally {
      setAppleLoading(false);
    }
  };

  return (
    <Screen contentContainerStyle={[{ gap: layout.containerGap }, styles.container]}>
      <View style={[{ gap: layout.containerGap }, styles.header]}>
        <Heading>Let's get started…</Heading>
      </View>
      <Card>
        <Animated.View style={{ opacity: appear, transform: [{ translateY: appear.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }}>
          {mode === 'methods' && (
            <View style={styles.buttonGroup}>
              <EmailButton onPress={() => goTo('email')} disabled={googleLoading || appleLoading} />
              <GoogleButton onPress={onSignInWithGoogle} disabled={googleLoading || appleLoading} loading={googleLoading} />
              {appleSupported && (
                <AppleSignInButton onPress={onSignInWithApple} disabled={googleLoading || appleLoading} loading={appleLoading} />
              )}
              <PhoneButton onPress={() => goTo('phone')} disabled={googleLoading || appleLoading} />
            </View>
          )}
          {mode === 'email' && (
            <EmailForm
              onBack={() => goTo('methods')}
              onGoogleSignIn={onSignInWithGoogle}
              googleLoading={googleLoading}
              onAppleSignIn={onSignInWithApple}
              appleLoading={appleLoading}
              appleSupported={appleSupported}
            />
          )}
          {mode === 'phone' && (
            <PhoneForm onBack={() => goTo('methods')} />
          )}
        </Animated.View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { justifyContent: 'center' },
  header: { alignItems: 'center' },
  buttonGroup: { gap: 12 },
});


