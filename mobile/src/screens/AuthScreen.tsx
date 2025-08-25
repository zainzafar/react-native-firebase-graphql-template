import React, { useState, useEffect } from 'react';
import { Alert, View, Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Body, Button, Card, Heading, Input, ScreenContainer } from '../components/ui';
import { useAuth } from '../auth/AuthProvider';
import { googleWebClientId } from '../config/firebase';
import Config from 'react-native-config';

export default function AuthScreen() {
  const { signInWithEmail, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    const debugAppInfo = async () => {
      // Log package name and bundle identifier
      console.log('Platform:', Platform.OS);
      console.log('Platform Constants:', Platform.constants);
      
      // Detailed package information
      console.log('Bundle ID:', DeviceInfo.getBundleId());
      console.log('App Version:', DeviceInfo.getVersion());
      console.log('Build Number:', DeviceInfo.getBuildNumber());
      console.log('App Name:', Config.APP_NAME || Config.APP_DISPLAY_NAME || DeviceInfo.getApplicationName());
      console.log('Device ID:', DeviceInfo.getDeviceId());
      console.log('System Version:', DeviceInfo.getSystemVersion());
      
      // Google Sign-In configuration debugging
      console.log('=== Google Sign-In Debug Info ===');
      console.log('🔍 Google Web Client ID from env:', googleWebClientId);
      console.log('🔍 Raw GOOGLE_WEB_CLIENT_ID env var:', Config.GOOGLE_WEB_CLIENT_ID);
      console.log(`Config.API_URL: ${Config.API_URL}`);
      
      // Full Config dump
      console.log('=== Full Config Dump ===');
      
      try {
        // Check if Google Sign-In is properly configured
        const hasPlayServices = await GoogleSignin.hasPlayServices();
        console.log('Play Services available:', hasPlayServices);
        
        // Check if user is signed in
        const user = await GoogleSignin.getCurrentUser();
        console.log('Current user:', user ? 'Signed in' : 'Not signed in');
      } catch (error) {
        console.log('Google Sign-In error:', error);
      }
    };
    
    debugAppInfo();
  }, []);

  const onSignIn = async () => {
    try {
      setLoading(true);
      await signInWithEmail(email, password);
    } catch (e: any) {
      const msg = e?.message || 'Failed to sign in';
      Alert.alert('Sign In Error', msg);
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <ScreenContainer>
      <Card>
        <Heading>Welcome back</Heading>
        <Body>Please sign in to continue</Body>
        <Input value={email} onChangeText={setEmail} placeholder="Email" autoCapitalize="none" keyboardType="email-address" />
        <Input value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry />
        <Button title="Sign In" onPress={onSignIn} loading={loading} />
        <View style={{ height: 8 }} />
        <Button title="Continue with Google" onPress={onSignInWithGoogle} loading={googleLoading} variant="ghost" />
      </Card>
    </ScreenContainer>
  );
}


