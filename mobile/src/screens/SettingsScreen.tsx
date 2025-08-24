import React, { useState } from 'react';
import { Alert } from 'react-native';
import { Body, Button, Card, Heading, ScreenContainer } from '../components/ui';
import { useAuth } from '../auth/AuthProvider';

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const [loading, setLoading] = useState(false);

  const onLogout = async () => {
    try {
      setLoading(true);
      await signOut();
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
    </ScreenContainer>
  );
}


