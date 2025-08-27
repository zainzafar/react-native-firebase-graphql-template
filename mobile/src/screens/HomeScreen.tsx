import React from 'react';
import { Body, Card, Heading, useTopInset } from '../components';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useAppSelector } from '../store/hooks';
import { selectAuth } from '../features/auth/selectors';
import { useTheme } from '../theme/ThemeProvider';

export default function HomeScreen() {
  const authState = useAppSelector(selectAuth);
  const display = (authState.user?.displayName || '').trim();
  const firstToken = display ? display.split(/\s+/)[0] : '';
  const firstName = firstToken ? firstToken.charAt(0).toUpperCase() + firstToken.slice(1) : undefined;
  const { colors } = useTheme();
  const topInset = useTopInset();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: topInset, paddingBottom: 24 }]}> 
        <View style={styles.header}><Heading>{firstName ? `Hello ${firstName}` : 'Hello'}</Heading></View>
        <Card>
          <Body>Welcome!</Body>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 16, gap: 20 },
  header: { paddingBottom: 8, paddingLeft: 5 },
});


