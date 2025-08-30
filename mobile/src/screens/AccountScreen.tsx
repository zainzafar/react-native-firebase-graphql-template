import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Body, Button, Card, Input, UserIdentityRow } from '../components';
import { useTheme } from '../theme/ThemeProvider';
import { useAuth } from '../auth/AuthProvider';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { selectUser } from '../features/auth/selectors';

import { useMutation } from '@apollo/client/react';
import { MUTATION_UPDATE_PROFILE } from '../graphql/operations';
import { updateUser as updateUserAction } from '../features/auth/authSlice';

export default function AccountScreen() {
  const dispatch = useAppDispatch();
  const { updatePassword } = useAuth();
  const [mutateUpdateProfile] = useMutation(MUTATION_UPDATE_PROFILE);
  const user = useAppSelector(selectUser); // Database user for all data
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordValidationError, setPasswordValidationError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const { colors } = useTheme();

  // Initialize display name from user
  useEffect(() => {
    if (user?.displayName) {
      setDisplayName(user.displayName);
    }
  }, [user?.displayName]);

  // Check if user has email/password authentication (using database identities)
  const hasEmailPassword = user?.identities?.some((identity: any) => identity.providerId === 'password') || false;

  const onUpdateProfile = async () => {
    try {
      setProfileLoading(true);
      setProfileError(null);
      setProfileSuccess(false);
      
      if (!displayName.trim()) {
        setProfileError('Please enter your name');
        return;
      }
      
      const { data } = await mutateUpdateProfile({ variables: { displayName } });
      const updated = (data as any)?.updateProfile;
      if (updated) {
        // Update only changed fields in Redux
        dispatch(updateUserAction({ displayName: updated.displayName, photoURL: updated.photoURL }));
      }
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
        {/* Authentication Method Info - Show for all users */}
        {user && (
          <Card>
            <UserIdentityRow 
              email={user.email}
              phoneNumber={user.phoneNumber}
              identities={user.identities}
            />
          </Card>
        )}

        {/* Profile Section */}
        <Card>
          <View style={styles.sectionHeader}>
            <Body style={styles.sectionTitle}>Profile Information</Body>
          </View>
          <View style={styles.form}>
            <Input 
              value={displayName} 
              onChangeText={setDisplayName} 
              placeholder="Display name" 
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
