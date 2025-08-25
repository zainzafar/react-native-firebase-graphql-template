import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, View, Switch, SafeAreaView, ScrollView, StatusBar, Platform } from 'react-native';
import { Body, Button, Card, Heading } from '../components/ui';
import { useTheme } from '../theme/ThemeProvider';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../auth/AuthProvider';

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<any>();
  const { isDark, setDarkMode, colors } = useTheme();

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

  const topInset = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 8 : 8;
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}> 
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: topInset, paddingBottom: 24 }]}> 
        <View style={styles.header}><Heading>Settings</Heading></View>

        <Card>
          <View style={styles.row}>
            <Body style={styles.rowLabel}>Dark mode</Body>
            <Switch value={isDark} onValueChange={setDarkMode} />
          </View>
        </Card>

        <View style={styles.grow} />

        <Button title="Log out" onPress={onLogout} loading={loading} variant="ghost" />

        <Pressable onPress={() => navigation.navigate('Debug')} hitSlop={8}>
          <Body style={styles.debugText}>Debug</Body>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 16, gap: 12 },
  header: { paddingBottom: 8, paddingLeft: 5 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowLabel: { },
  grow: { flex: 1 },
  debugText: { textAlign: 'center', marginTop: 8 },
});


