import React from 'react';
import { Body, Card, Heading } from '../components/ui';
import { SafeAreaView, ScrollView, StyleSheet, View, StatusBar, Platform } from 'react-native';
import { useAuth } from '../auth/AuthProvider';
import { useTheme } from '../theme/ThemeProvider';

export default function HomeScreen() {
  const { user } = useAuth();
  const display = (user?.displayName || '').trim();
  const firstToken = display ? display.split(/\s+/)[0] : '';
  const firstName = firstToken ? firstToken.charAt(0).toUpperCase() + firstToken.slice(1) : undefined;
  const { colors } = useTheme();

  const topInset = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 8 : 8;
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}> 
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: topInset, paddingBottom: 24 }]}> 
        <View style={styles.header}><Heading>{firstName ? `Hello ${firstName}` : 'Hello'}</Heading></View>
        <Card>
          <Body>Welcome!</Body>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 16, gap: 12 },
  header: { paddingBottom: 8, paddingLeft: 5 },
});


