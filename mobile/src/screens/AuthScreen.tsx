import React, { useEffect, useRef, useState } from 'react';
import { Alert, View, Pressable, StyleSheet, LayoutAnimation, Platform, UIManager, Animated, Easing } from 'react-native';
//
import { Body, Card, Heading, ScreenContainer } from '../components/ui';
import { GoogleButton, EmailButton, PhoneButton, AppleButton as AppleSignInButton } from '../components/buttons';
import { useAuth } from '../auth/AuthProvider';
import { useNavigation } from '@react-navigation/native';
import AppleAuth from '@invertase/react-native-apple-authentication';
import EmailForm from './AuthScreen/EmailForm';
import PhoneForm from './AuthScreen/PhoneForm';

type Mode = 'methods' | 'email' | 'phone';

export default function AuthScreen() {
  const { signInWithGoogle, signInWithApple } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const navigation = useNavigation<any>();
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
    if (Platform.OS === 'android' && (UIManager as any)?.setLayoutAnimationEnabledExperimental) {
      try { (UIManager as any).setLayoutAnimationEnabledExperimental(true); } catch {}
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
    } catch (e: any) {
      const msg = e?.message || 'Google Sign-In failed';
      Alert.alert('Google Sign-In', msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  const onSignInWithApple = async () => {
    try {
      setAppleLoading(true);
      await signInWithApple();
    } catch (e: any) {
      const msg = e?.message || 'Apple Sign-In failed';
      Alert.alert('Apple Sign-In', msg);
    } finally {
      setAppleLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Heading>Let’s get started…</Heading>
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
      <Pressable style={styles.debugLink} onPress={() => navigation.navigate('Debug')} hitSlop={8}>
        <Body style={styles.debugText}>Debug</Body>
      </Pressable>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', gap: 6 },
  subheading: { textAlign: 'center' },
  debugLink: { position: 'absolute', bottom: 24, left: 0, right: 0, alignItems: 'center' },
  debugText: { textAlign: 'center' },
  buttonGroup: { gap: 12 },
});


