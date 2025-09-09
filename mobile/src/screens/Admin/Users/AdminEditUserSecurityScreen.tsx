import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Card, Input, Body, UserIdentityRow, Screen, LoadingContainer } from '../../../components';
import { useTheme } from '../../../theme/ThemeProvider';
import { useAppSelector } from '../../../store/hooks';
import { selectUserPermissions } from '../../../features/auth/selectors';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useMutation, useQuery } from '@apollo/client/react';
import { MUTATION_ADMIN_UPDATE_USER_PASSWORD, QUERY_ADMIN_GET_USER } from '../../../graphql/operations';
import { getAuth, sendPasswordResetEmail } from '@react-native-firebase/auth';

type User = {
  id: string;
  email?: string;
  phoneNumber?: string;
  identities?: { providerId: string }[];
};

type AdminEditUserSecurityScreenParams = {
  id?: string;
};

export default function AdminEditUserSecurityScreen() {
  const { layout } = useTheme();
  const myPerms = useAppSelector(selectUserPermissions) as string[];
  const canUpdatePassword = myPerms.includes('ADMIN_USERS_UPDATE_PASSWORD');
  
  const route = useRoute<RouteProp<Record<string, object | undefined>, 'AdminEditUserSecurity'>>();
  const userId = (route.params as AdminEditUserSecurityScreenParams)?.id as string;

  // Fetch user data
  const { data, loading } = useQuery<{ adminGetUser?: User }>(QUERY_ADMIN_GET_USER, { 
    variables: { id: userId },
    fetchPolicy: 'network-only'
  });

  const [mutatePassword, { loading: passwordLoading }] = useMutation(MUTATION_ADMIN_UPDATE_USER_PASSWORD);

  const user = data?.adminGetUser;
  const [password, setPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [passwordSaveSuccess, setPasswordSaveSuccess] = useState(false);
  const [passwordSaveError, setPasswordSaveError] = useState<string | null>(null);

  const providerIds = Array.isArray(user?.identities) ? user!.identities.map((p: { providerId: string }) => p.providerId) : [];
  const hasPasswordProvider = providerIds.includes('password');
  const hasGoogleProvider = providerIds.includes('google.com');
  const hasAppleProvider = providerIds.includes('apple.com');
  const showSecuritySection = hasPasswordProvider || hasGoogleProvider || hasAppleProvider;

  const onResetPassword = async () => {
    try {
      setResetLoading(true);
      setResetError(null);
      setResetSuccess(false);
      
      if (!user?.email) {
        setResetError('User does not have an email address to send reset email to');
        return;
      }
      
      const auth = getAuth();
      await sendPasswordResetEmail(auth, user.email);
      setResetSuccess(true);
    } catch (e: unknown) {
      console.error('Password reset error:', e);
      let errorMessage = 'Failed to send password reset email';
      
      if ((e as { code?: string })?.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address';
      } else if ((e as { code?: string })?.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if ((e as { code?: string })?.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please try again later';
      } else if ((e as { message?: string })?.message) {
        errorMessage = (e as { message: string }).message;
      }
      
      setResetError(errorMessage);
    } finally {
      setResetLoading(false);
    }
  };

  const onSavePassword = async () => {
    try {
      setPasswordSaveSuccess(false);
      await mutatePassword({ variables: { id: user!.id, input: { password: password } } });
      setPassword('');
      setPasswordSaveSuccess(true);
      setPasswordSaveError(null);
    } catch (e: unknown) {
      setPasswordSaveError((e as Error)?.message || 'Failed to update password');
    }
  };

  if (loading) {
    return (
      <Screen>
        <LoadingContainer text="Loading user details..." />
      </Screen>
    );
  }

  if (!user) {
    return (
      <Screen>
        <Card>
          <Body style={styles.errorText}>User not found</Body>
        </Card>
      </Screen>
    );
  }

  if (!showSecuritySection || !canUpdatePassword) {
    return (
      <Screen>
        <Card>
          <UserIdentityRow email={user.email} phoneNumber={user.phoneNumber} identities={user.identities} />
        </Card>
        <Card>
          <Body style={styles.infoText}>
            This user does not have password-based authentication or you don't have permission to manage security settings.
          </Body>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen scroll={true} contentContainerStyle={[{ gap: layout.containerGap }, styles.container]}>
      <Card>
        <UserIdentityRow email={user.email} phoneNumber={user.phoneNumber} identities={user.identities} />
      </Card>

      <Card>
        <View style={[{ gap: layout.formGap }, styles.form]}>
          <Body style={styles.sectionTitle}>Direct Password Change</Body>
          <Body style={styles.sectionDescription}>
            Set a new password directly for this user.
          </Body>
          <Input 
            value={password} 
            onChangeText={setPassword} 
            placeholder="New password" 
            secureTextEntry
            textContentType="newPassword"
            autoComplete="new-password"
            editable={canUpdatePassword}
          />
          <Button
            title="Save password"
            onPress={onSavePassword}
            loading={passwordLoading}
            success={!!passwordSaveSuccess}
            successText="Saved"
            error={!!passwordSaveError}
            errorText="Please try again"
            disabled={!password.trim()}
            variant="ghost"
          />
          {!!passwordSaveError && (
            <Body style={styles.errorText}>{passwordSaveError}</Body>
          )}
        </View>
      </Card>

      {hasPasswordProvider && (
        <Card>
          <View style={[{ gap: layout.formGap }, styles.form]}>
            <Body style={styles.sectionTitle}>Password Reset</Body>
            <Body style={styles.sectionDescription}>
              Send a password reset email to the user. They will receive instructions to reset their password.
            </Body>
            <Button
              title="Send password reset email"
              onPress={onResetPassword}
              loading={resetLoading}
              success={!!resetSuccess}
              successText="Reset email sent!"
              error={!!resetError}
              errorText="Please try again"
              variant="ghost"
            />
            {!!resetError && (
              <Body style={styles.errorText}>{resetError}</Body>
            )}
          </View>
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { },
  container: { },
  errorText: { color: '#DC2626' },
  infoText: { color: '#6B7280', textAlign: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '600' },
  sectionDescription: { fontSize: 14, color: '#6B7280', lineHeight: 20 },
});
