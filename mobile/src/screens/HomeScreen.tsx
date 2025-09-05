import React from 'react';
import { Body, Card, Heading, Screen } from '../components';
import { StyleSheet, View } from 'react-native';
import { useAppSelector } from '../store/hooks';
import { selectUser } from '../features/auth/selectors';

export default function HomeScreen() {
  const user = useAppSelector(selectUser);
  const display = (user?.displayName || '').trim();
  const firstToken = display ? display.split(/\s+/)[0] : '';
  const firstName = firstToken ? firstToken.charAt(0).toUpperCase() + firstToken.slice(1) : undefined;
  
  return (
    <Screen contentContainerStyle={styles.content}>
      <View style={styles.header}><Heading>{firstName ? `Hello ${firstName}` : 'Hello'}</Heading></View>
      <Card>
        <Body>Welcome!</Body>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: 20 },
  header: { paddingBottom: 8, paddingLeft: 5 },
});


