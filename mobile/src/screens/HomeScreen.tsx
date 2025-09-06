import React from 'react';
import { Body, Card, Heading, Screen } from '../components';
import { useTheme } from '../theme/ThemeProvider';
import { StyleSheet, View } from 'react-native';
import { useAppSelector } from '../store/hooks';
import { selectUser } from '../features/auth/selectors';

export default function HomeScreen() {
  const { layout } = useTheme();
  const user = useAppSelector(selectUser);
  const display = (user?.displayName || '').trim();
  const firstToken = display ? display.split(/\s+/)[0] : '';
  const firstName = firstToken ? firstToken.charAt(0).toUpperCase() + firstToken.slice(1) : undefined;
  
  return (
    <Screen contentContainerStyle={[styles.content, { gap: layout.containerGap }]}>
      <View style={styles.header}><Heading>{firstName ? `Hello ${firstName}` : 'Hello'}</Heading></View>
      <Card>
        <Body>Welcome!</Body>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { },
  header: { paddingBottom: 8, paddingLeft: 5 },
});


