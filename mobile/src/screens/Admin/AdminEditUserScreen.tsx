import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Card, Input, Body, UserIdentityRow } from '../../components';
import { useTheme } from '../../theme/ThemeProvider';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useMutation, useQuery } from '@apollo/client/react';
import { MUTATION_ADMIN_UPDATE_USER, QUERY_ADMIN_GET_USER, MUTATION_ADMIN_RESET_PASSWORD } from '../../graphql/operations';

export default function AdminEditUserScreen() {
  const { colors } = useTheme();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const uid = route.params?.id as string; // we navigate with uid

  // Fetch by uid (source of truth)
  const { data } = useQuery<{ adminGetUser?: any }>(QUERY_ADMIN_GET_USER, { variables: { uid } });
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
                  if (edge.node.uid === updatedUser.uid) {
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
  const [mutatePassword, { loading: passwordLoading }] = useMutation(MUTATION_ADMIN_UPDATE_USER);
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
  const [saveErrorFlash, setSaveErrorFlash] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetErrorFlash, setResetErrorFlash] = useState(false);
  const [passwordSaveSuccess, setPasswordSaveSuccess] = useState(false);
  const [passwordSaveError, setPasswordSaveError] = useState<string | null>(null);
  const [passwordSaveErrorFlash, setPasswordSaveErrorFlash] = useState(false);
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
      await mutateProfile({ variables: { uid: user?.uid, input: {
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
      setSaveErrorFlash(true);
    }
  };

  const onResetPassword = async () => {
    try {
      setResetError(null);
      setResetSuccess(false);
      await resetPassword({ variables: { uid: user?.uid } });
      setResetSuccess(true);
    } catch (e: any) {
      setResetError(e?.message || 'Failed to send reset');
      setResetErrorFlash(true);
    }
  };

  const onSavePassword = async () => {
    try {
      setPasswordSaveSuccess(false);
      await mutatePassword({ variables: { uid: user?.uid, input: { password: password || undefined } } });
      setPassword('');
      setPasswordSaveSuccess(true);
      setPasswordSaveError(null);
    } catch (e: any) {
      setPasswordSaveError(e?.message || 'Failed to update password');
      setPasswordSaveErrorFlash(true);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <Card style={styles.card}>
        <View style={styles.form}>
          <UserIdentityRow email={user?.email} phoneNumber={user?.phoneNumber} identities={user?.identities} />
        </View>
      </Card>
      <Card style={styles.card}>
        <View style={styles.form}> 
          <Input value={email} onChangeText={setEmail} placeholder="Email" />
          <Input value={displayName} onChangeText={setDisplayName} placeholder="Display name" />
          <Input value={phoneNumber} onChangeText={setPhoneNumber} placeholder="Phone number" />
          <Input value={photoURL} onChangeText={setPhotoURL} placeholder="Photo URL" />
          <Button
            title="Save"
            onPress={onSave}
            loading={profileLoading}
            success={saveSuccess}
            successText="Saved"
            error={saveErrorFlash}
            errorText="Please try again"
            onSuccessComplete={() => { setSaveSuccess(false); setSaveErrorFlash(false); }}
            variant="ghost"
          />
          {!!saveError && (
            <Body style={{ color: '#DC2626' }}>{saveError}</Body>
          )}
        </View>
      </Card>

      {/* Security section - show if user has password/google/apple */}
      {showSecuritySection && (
        <Card style={styles.card}>
          <View style={styles.form}> 
            <Input value={password} onChangeText={setPassword} placeholder="New password (optional)" />
            <Button
              title="Save password"
              onPress={onSavePassword}
              loading={passwordLoading}
              success={passwordSaveSuccess}
              successText="Saved"
              error={passwordSaveErrorFlash}
              errorText="Please try again"
              onSuccessComplete={() => { setPasswordSaveSuccess(false); setPasswordSaveErrorFlash(false); }}
              disabled={!password.trim()}
              variant="ghost"
            />
            {!!passwordSaveError && (
              <Body style={{ color: '#DC2626' }}>{passwordSaveError}</Body>
            )}
            {hasPasswordProvider && (
              <Button
                title="Send password reset"
                onPress={onResetPassword}
                loading={resetting}
                success={resetSuccess}
                successText="Email sent"
                error={resetErrorFlash}
                errorText="Please try again"
                onSuccessComplete={() => { setResetSuccess(false); setResetErrorFlash(false); }}
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
      <Card style={styles.card}>
        <View style={styles.form}>
          <Button
            title="Delete user"
            variant="ghost"
            icon="trash-can"
            iconStyle="regular"
            onPress={() => navigation.navigate('AdminDeleteUser', { id: uid })}
          />
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  form: { gap: 12 },
  card: { marginBottom: 16 },
});


