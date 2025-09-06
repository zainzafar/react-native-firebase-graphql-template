import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Button, Card, Input, Body, UserIdentityRow, Screen } from '../../../components';
import { useTheme } from '../../../theme/ThemeProvider';
import { useAppSelector } from '../../../store/hooks';
import { selectUserPermissions } from '../../../features/auth/selectors';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useMutation, useQuery } from '@apollo/client/react';
import { MUTATION_ADMIN_UPDATE_USER, MUTATION_ADMIN_UPDATE_USER_PASSWORD, QUERY_ADMIN_GET_USER, MUTATION_ADMIN_RESET_PASSWORD } from '../../../graphql/operations';

export default function AdminEditUserScreen() {
  const { colors } = useTheme();
  const myPerms = useAppSelector(selectUserPermissions) as string[];
  
  // Check for new simplified permissions
  const canViewRoles = myPerms.includes('ADMIN_ROLES_VIEW');
  const canViewPermissions = myPerms.includes('ADMIN_PERMISSIONS_VIEW');
  const canOpenAccess = canViewRoles || canViewPermissions;
  const canDeleteUser = myPerms.includes('ADMIN_USERS_DELETE');
  const canUpdateProfile = myPerms.includes('ADMIN_USERS_UPDATE_PROFILE');
  const canUpdatePassword = myPerms.includes('ADMIN_USERS_UPDATE_PASSWORD');
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const userId = route.params?.id as string; // we navigate with database id

  // Fetch by database id (source of truth)
  const { data, loading } = useQuery<{ adminGetUser?: any }>(QUERY_ADMIN_GET_USER, { 
    variables: { id: userId },
    fetchPolicy: 'network-only' // Always fetch fresh data when editing a user
  });
  const [mutateProfile, { loading: profileLoading }] = useMutation(MUTATION_ADMIN_UPDATE_USER, {
    update: (cache, { data }: any) => {
      // Update the user in the admin list cache
      const updatedUser = data?.adminUpdateUser;
      if (updatedUser) {
        cache.modify({
          fields: {
            adminListUsers: (existing = {}) => {
              if (existing.edges) {
                const updatedEdges = existing.edges.map((edge: any) => {
                  if (edge.node.id === updatedUser.id) {
                    return { ...edge, node: { ...edge.node, ...updatedUser } };
                  }
                  return edge;
                });
                return { ...existing, edges: updatedEdges };
              }
              return existing;
            },
          },
        });
      }
    },
  });
  const [mutatePassword, { loading: passwordLoading }] = useMutation(MUTATION_ADMIN_UPDATE_USER_PASSWORD);
  const [resetPassword, { loading: resetting }] = useMutation(MUTATION_ADMIN_RESET_PASSWORD);

  const user = data?.adminGetUser;
  const [email, setEmail] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [disabled, setDisabled] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [passwordSaveSuccess, setPasswordSaveSuccess] = useState(false);
  const [passwordSaveError, setPasswordSaveError] = useState<string | null>(null);
  const providerIds = Array.isArray(user?.identities) ? user!.identities.map((p: any) => p.providerId) : [];
  const hasPasswordProvider = providerIds.includes('password');
  const hasGoogleProvider = providerIds.includes('google.com');
  const hasAppleProvider = providerIds.includes('apple.com');
  const showSecuritySection = hasPasswordProvider || hasGoogleProvider || hasAppleProvider;

  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
      setEmailVerified(!!user.emailVerified);
      setDisplayName(user.displayName || '');
      setPhoneNumber(user.phoneNumber || '');
      setPhotoURL(user.photoURL || '');
      setDisabled(!!(user as any).disabled);
    }
  }, [user]);

  const onSave = async () => {
    try {
      setSaveSuccess(false);
      await mutateProfile({ variables: { id: user.id, input: {
        email: email || undefined,
        emailVerified,
        phoneNumber,
        displayName,
        photoURL: photoURL || undefined,
        disabled,
      } } });
      setSaveSuccess(true);
      setPassword('');
      setSaveError(null); // clear error only after a successful save
    } catch (e: any) {
      setSaveError(e?.message || 'Failed to save');
    }
  };

  const onResetPassword = async () => {
    try {
      setResetError(null);
      setResetSuccess(false);
      await resetPassword({ 
        variables: { 
          id: user.id
        } 
      });
      setResetSuccess(true);
    } catch (e: any) {
      setResetError(e?.message || 'Failed to send password reset email');
    }
  };

  const onSavePassword = async () => {
    try {
      setPasswordSaveSuccess(false);
      await mutatePassword({ variables: { id: user.id, input: { password: password } } });
      setPassword('');
      setPasswordSaveSuccess(true);
      setPasswordSaveError(null);
    } catch (e: any) {
      setPasswordSaveError(e?.message || 'Failed to update password');
    }
  };



  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.text} />
      </View>
    );
  }

  return (
    <Screen scroll={true} contentContainerStyle={styles.container}>
      <Card>
        <View style={styles.form}>
          <UserIdentityRow email={user.email} phoneNumber={user.phoneNumber} identities={user.identities} />
        </View>
      </Card>
      <Card>
        <View style={styles.form}> 
          <Input 
            value={email} 
            onChangeText={setEmail} 
            placeholder="Email" 
            editable={canUpdateProfile}
          />
          <Input 
            value={displayName} 
            onChangeText={setDisplayName} 
            placeholder="Display name" 
            editable={canUpdateProfile}
          />
          <Input 
            value={phoneNumber} 
            onChangeText={setPhoneNumber} 
            placeholder="Phone number" 
            editable={canUpdateProfile}
          />
          <Input 
            value={photoURL} 
            onChangeText={setPhotoURL} 
            placeholder="Photo URL" 
            editable={canUpdateProfile}
          />
          {canUpdateProfile && (
            <Button
              title="Save"
              onPress={onSave}
              loading={profileLoading}
              success={!!saveSuccess}
              successText="Saved"
              error={!!saveError}
              errorText="Please try again"
              variant="ghost"
            />
          )}
          {!!saveError && (
            <Body style={{ color: '#DC2626' }}>{saveError}</Body>
          )}
        </View>
      </Card>

      {/* Security section - show if user has password/google/apple and update password permission */}
      {showSecuritySection && canUpdatePassword && (
        <Card>
          <View style={styles.form}> 
            <Input 
              value={password} 
              onChangeText={setPassword} 
              placeholder="New password (optional)" 
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
              <Body style={{ color: '#DC2626' }}>{passwordSaveError}</Body>
            )}
            {hasPasswordProvider && (
              <Button
                title="Send password reset email"
                onPress={onResetPassword}
                loading={resetting}
                success={!!resetSuccess}
                successText="Reset email sent!"
                error={!!resetError}
                errorText="Please try again"
                variant="ghost"
              />
            )}
            {!!resetError && (
              <Body style={{ color: '#DC2626' }}>{resetError}</Body>
            )}
          </View>
        </Card>
      )}
      
      {/* Danger zone: Delete user */}
      {(canOpenAccess || canDeleteUser) && (
        <Card>
          <View style={styles.form}>
            {canOpenAccess && (
              <Button
                title="Roles & Permissions"
                variant="ghost"
                icon="key"
                iconStyle="solid"
                onPress={() => navigation.navigate('AdminEditUserAccess', { id: userId })}
              />
            )}
            {canDeleteUser && (
              <Button
                title="Delete user"
                variant="ghost"
                icon="trash-can"
                iconStyle="regular"
                onPress={() => navigation.navigate('AdminDeleteUser', { id: userId })}
              />
            )}
          </View>
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: 12 },
  container: { gap: 16 },
});


