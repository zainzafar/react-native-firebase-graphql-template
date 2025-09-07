import React, { useState, useEffect } from 'react';
import { Alert, Pressable, StyleSheet, View, Switch } from 'react-native';
import { Body, Button, Card, Screen } from '../components';
import { useTheme } from '../theme/ThemeProvider';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../auth/AuthProvider';
import { usePermissions } from '../features/auth/hooks';
import { useAppUpdateGate } from '../update/useAppUpdateGate';
import DeviceInfo from 'react-native-device-info';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';

export default function SettingsScreen() {
  const { layout } = useTheme();
  const { signOut } = useAuth();
  const { canAccessAdmin } = usePermissions();
  const { gate, openStore } = useAppUpdateGate();
  const [loading, setLoading] = useState(false);
  const [appVersion, setAppVersion] = useState<string>('');
  const [buildNumber, setBuildNumber] = useState<string>('');
  const navigation = useNavigation<any>();
  const { isDark, setDarkMode, colors, borderRadius } = useTheme();

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

  const handleUpdatePress = () => {
    openStore();
  };

  useEffect(() => {
    const fetchAppInfo = async () => {
      try {
        const version = await DeviceInfo.getVersion();
        const build = await DeviceInfo.getBuildNumber();
        setAppVersion(version);
        setBuildNumber(build);
      } catch (error) {
        console.warn('Failed to get app version info:', error);
      }
    };

    fetchAppInfo();
  }, []);

  return (
    <Screen contentContainerStyle={[{ gap: layout.menuGap }, styles.scrollContent]}>
      {/* App Update - only visible when update is available */}
      {(gate.hard || gate.soft) && (
        <>
          <Card style={styles.compactCard}>
            <View style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <FontAwesome6 
                  name={gate.hard ? "triangle-exclamation" : "arrow-up"} 
                  iconStyle="solid" 
                  size={20} 
                  color={gate.hard ? "#ff6b6b" : colors.text} 
                />
                <View style={styles.updateInfo}>
                  <Body style={styles.menuItemText}>
                    App update available
                  </Body>
                </View>
              </View>
              <View style={styles.updateActions}>
                <Pressable onPress={handleUpdatePress} style={[{ borderRadius: borderRadius.sm }, styles.updateButton, styles.updateButtonPrimary]}>
                  <Body style={styles.updateButtonTextPrimary}>Update</Body>
                </Pressable>
              </View>
            </View>
          </Card>
        </>
      )}

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
          <View style={[{ backgroundColor: colors.border }, styles.divider]} />
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

      {/* App Version Info */}
      {(appVersion || buildNumber) && (
        <View style={styles.versionInfo}>
          <Body style={[{ color: colors.mutedText }, styles.versionText]}>
            {appVersion && `Version ${appVersion}`}
            {appVersion && buildNumber && ' • '}
            {buildNumber && `Build ${buildNumber}`}
          </Body>
        </View>
      )}

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
    gap: 10,
    flex: 1
  },
  menuItemText: { 
    fontSize: 16, 
    fontWeight: '500'
  },
  updateInfo: {
    flex: 1,
  },
  versionText: {
    fontSize: 12,
    marginTop: 2,
    textAlign: 'center',
  },
  updateActions: {
    flexDirection: 'row',
    gap: 8,
  },
  updateButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  updateButtonPrimary: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  updateButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  updateButtonTextPrimary: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  updateButtonTextSecondary: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93', // Default muted text color
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  grow: { flex: 1 },
  versionInfo: {
    alignItems: 'center',
    paddingVertical: 16,
  }
});