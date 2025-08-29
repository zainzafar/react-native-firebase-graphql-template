import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Body, Button, Card, Input } from '../components';
import { useTheme } from '../theme/ThemeProvider';
import { useAuth } from '../auth/AuthProvider';
import { useAppSelector } from '../store/hooks';
import { selectUser } from '../features/auth/selectors';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';

export default function AccountScreen() {
  const { updateUserProfile, updatePassword } = useAuth();
  const user = useAppSelector(selectUser); // Database user for all data
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordValidationError, setPasswordValidationError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const { colors } = useTheme();

  // Initialize name fields from user display name
  useEffect(() => {
    if (user?.displayName) {
      const nameParts = user.displayName.split(' ');
      setFirstName(nameParts[0] || '');
      setLastName(nameParts.slice(1).join(' ') || '');
    }
  }, [user?.displayName]);

  // Check if user has email/password authentication (using database identities)
  const hasEmailPassword = user?.identities?.some((identity: any) => identity.providerId === 'password') || false;
  const hasGoogle = user?.identities?.some((identity: any) => identity.providerId === 'google.com') || false;
  const hasApple = user?.identities?.some((identity: any) => identity.providerId === 'apple.com') || false;
  const hasPhone = user?.identities?.some((identity: any) => identity.providerId === 'phone') || false;

  const getAuthMethods = () => {
    const methods = [];
    if (hasGoogle) methods.push({ type: 'google', text: 'Google' });
    if (hasApple) methods.push({ type: 'apple', text: 'Apple' });
    if (hasPhone) methods.push({ type: 'phone', text: 'Phone Number' });
    return methods;
  };

  const onUpdateProfile = async () => {
    try {
      setProfileLoading(true);
      setProfileError(null);
      setProfileSuccess(false);
      
      const displayName = `${firstName} ${lastName}`.trim();
      if (!displayName) {
        setProfileError('Please enter your name');
        return;
      }
      
      await updateUserProfile(displayName);
      setProfileSuccess(true);
    } catch (e: any) {
      setProfileError(e?.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const onUpdatePassword = async () => {
    try {
      setPasswordLoading(true);
      setPasswordError(null);
      setPasswordValidationError(null);
      setPasswordSuccess(false);
      
      // Local validation
      if (!newPassword.trim()) {
        setPasswordValidationError('Please enter a new password');
        return;
      }
      
      if (newPassword !== confirmPassword) {
        setPasswordValidationError('New passwords do not match');
        return;
      }
      
      if (newPassword.length < 6) {
        setPasswordValidationError('Password must be at least 6 characters long');
        return;
      }

      await updatePassword(newPassword);
      setPasswordSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      setPasswordError(e?.message || 'Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };


  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: 20, paddingBottom: 24 }]}>
        {/* Authentication Method Info - Only show when user doesn't have email/password */}
        {!hasEmailPassword && getAuthMethods().length > 0 && (
          <Card>
            <View style={styles.authInfo}>
              <View style={styles.authMethodRow}>
                {getAuthMethods().map((method, index) => {
                  if (method.type === 'google') {
                    return (
                      <FontAwesome6 
                        key={method.type}
                        name="google"
                        iconStyle="brand"
                        size={20} 
                        color="#EA4335"
                        style={index > 0 ? { marginLeft: 0 } : undefined}
                      />
                    );
                  } else if (method.type === 'apple') {
                    return (
                      <FontAwesome6 
                        key={method.type}
                        name="apple"
                        iconStyle="brand"
                        size={22} 
                        color={colors.text}
                        style={[index > 0 ? { marginLeft: 0 } : undefined, { marginTop: -2}]}
                      />
                    );
                  } else if (method.type === 'phone') {
                    return (
                      <FontAwesome6 
                        key={method.type}
                        name="phone"
                        iconStyle="solid"
                        size={20} 
                        color={colors.text}
                        style={index > 0 ? { marginLeft: 0 } : undefined}
                      />
                    );
                  }
                  return null;
                })}
                <Body style={styles.authValue}>
                  {hasPhone ? user?.phoneNumber || 'Phone Number' : user?.email || 'Email'}
                </Body>
              </View>
            </View>
          </Card>
        )}

        {/* Profile Section */}
        <Card>
          <View style={styles.sectionHeader}>
            <Body style={styles.sectionTitle}>Profile Information</Body>
          </View>
          <View style={styles.form}>
            <Input 
              value={firstName} 
              onChangeText={setFirstName} 
              placeholder="First name" 
            />
            <Input 
              value={lastName} 
              onChangeText={setLastName} 
              placeholder="Last name" 
            />
            <Button 
              title="Update Profile" 
              onPress={onUpdateProfile} 
              loading={profileLoading}
              success={profileSuccess}
              successText="Profile Updated"
              error={!!profileError}
              errorText="Please try again"
              onSuccessComplete={() => {
                setProfileSuccess(false);
                setProfileError(null);
              }}
              variant="ghost"
              style={styles.button}
            />
          </View>
        </Card>

        {/* Password Section - Only show if user has email/password auth */}
        {hasEmailPassword && (
          <Card>
            <View style={styles.sectionHeader}>
              <Body style={styles.sectionTitle}>Change Password</Body>
            </View>
            <View style={styles.form}>
              <Input 
                value={newPassword} 
                onChangeText={setNewPassword} 
                placeholder="New password" 
                secureTextEntry
              />
              <Input 
                value={confirmPassword} 
                onChangeText={setConfirmPassword} 
                placeholder="Confirm new password" 
                secureTextEntry
              />
              {passwordValidationError && (
                <Body style={styles.errorText}>{passwordValidationError}</Body>
              )}
              <Button 
                title="Update Password" 
                onPress={onUpdatePassword} 
                loading={passwordLoading}
                success={passwordSuccess}
                successText="Password Updated"
                error={!!passwordError}
                errorText="Please try again"
                onSuccessComplete={() => {
                  setPasswordSuccess(false);
                  setPasswordError(null);
                  setPasswordValidationError(null);
                }}
                variant="ghost"
                style={styles.button}
              />
            </View>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 16, gap: 20 },

  subtitle: { opacity: 0.7, marginTop: 4 },
  authInfo: { gap: 8 },
  authMethodRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  authValue: { fontSize: 16, fontWeight: '500', marginLeft: 4 },
  sectionHeader: { marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600' },
  form: { gap: 16 },
  button: { marginTop: 12 },
  errorText: { color: '#EF4444', fontSize: 14 },
  successText: { color: '#059669', fontSize: 14 },
});
