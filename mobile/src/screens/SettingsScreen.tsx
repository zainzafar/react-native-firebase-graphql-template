import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, View, Switch } from 'react-native';
import { Body, Button, Card, Screen } from '../components';
import { useTheme } from '../theme/ThemeProvider';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../auth/AuthProvider';
import { usePermissions } from '../features/auth/hooks';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';

export default function SettingsScreen() {
  const { layout } = useTheme();
  const { signOut } = useAuth();
  const { canAccessAdmin } = usePermissions();
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<any>();
  const { isDark, setDarkMode, colors } = useTheme();

  const onLogout = async () => {
    try {
      setLoading(true);
      await signOut();
      // Navigation will automatically change based on Redux state in RootNavigator
    } catch (e: any) {
      Alert.alert('Logout failed', e?.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen contentContainerStyle={[{ gap: layout.menuGap }, styles.scrollContent]}>
      {/* Admin - only visible to users with admin access */}
      {canAccessAdmin && (
        <>
          <Card style={styles.compactCard}>
            <Pressable onPress={() => navigation.navigate('AdminHome' as never)} style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <FontAwesome6 name="shield-halved" iconStyle="solid" size={20} color={colors.text} />
                <Body style={styles.menuItemText}>Admin</Body>
              </View>
              <FontAwesome6 name="chevron-right" iconStyle="solid" size={16} color={colors.mutedText} />
            </Pressable>
          </Card>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
        </>
      )}

      {/* Account */}
      <Card style={styles.compactCard}>
        <Pressable onPress={() => navigation.navigate('Account' as never)} style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <FontAwesome6 name="user" iconStyle="solid" size={20} color={colors.text} />
            <Body style={styles.menuItemText}>Account</Body>
          </View>
          <FontAwesome6 name="chevron-right" iconStyle="solid" size={16} color={colors.mutedText} />
        </Pressable>
      </Card>

      {/* Dark Mode */}
      <Card style={styles.compactCard}>
        <View style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <FontAwesome6 name="moon" iconStyle="solid" size={20} color={colors.text} />
            <Body style={styles.menuItemText}>Dark mode</Body>
          </View>
          <Switch value={isDark} onValueChange={setDarkMode} />
        </View>
      </Card>

      <View style={styles.grow} />

      <Button title="Log out" onPress={onLogout} loading={loading} variant="ghost" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: { },
  compactCard: { padding: 12 },
  menuItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 4
  },
  menuItemLeft: { 
    flexDirection: 'row', 
    alignItems: 'center',
    gap: 10
  },
  menuItemText: { 
    fontSize: 16, 
    fontWeight: '500'
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  grow: { flex: 1 },
});


