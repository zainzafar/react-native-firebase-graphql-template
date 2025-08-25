import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet } from 'react-native';
import { Body, Button, Card, Heading, ScreenContainer } from '../components/ui';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../auth/AuthProvider';

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<any>();

  const onLogout = async () => {
    try {
      setLoading(true);
      await signOut();
      try {
        navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
      } catch {}
    } catch (e: any) {
      Alert.alert('Logout failed', e?.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <Card>
        <Heading>Settings</Heading>
        <Body>Manage your account</Body>
        <Button title="Log out" onPress={onLogout} loading={loading} variant="ghost" />
      </Card>
      <Pressable style={styles.debugLink} onPress={() => navigation.navigate('Debug')} hitSlop={8}>
        <Body style={styles.debugText}>Debug</Body>
      </Pressable>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  debugLink: { position: 'absolute', bottom: 24, left: 0, right: 0, alignItems: 'center' },
  debugText: { textAlign: 'center' },
});


