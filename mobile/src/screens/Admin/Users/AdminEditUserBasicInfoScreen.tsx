import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Card, Input, Body, UserIdentityRow, Screen, LoadingContainer } from '../../../components';
import { useTheme } from '../../../theme/ThemeProvider';
import { useAppSelector } from '../../../store/hooks';
import { selectUserPermissions } from '../../../features/auth/selectors';
import { useRoute } from '@react-navigation/native';
import { useMutation, useQuery } from '@apollo/client/react';
import { MUTATION_ADMIN_UPDATE_USER, QUERY_ADMIN_GET_USER } from '../../../graphql/operations';

type User = {
  id: string;
  email?: string;
  displayName?: string;
  phoneNumber?: string;
  photoURL?: string;
  emailVerified?: boolean;
  disabled?: boolean;
  identities?: { providerId: string }[];
};

export default function AdminEditUserBasicInfoScreen() {
  const { layout } = useTheme();
  const myPerms = useAppSelector(selectUserPermissions) as string[];
  const canUpdateProfile = myPerms.includes('ADMIN_USERS_UPDATE_PROFILE');
  
  const route = useRoute<any>();
  const userId = route.params?.id as string;

  // Fetch user data
  const { data, loading } = useQuery<{ adminGetUser?: User }>(QUERY_ADMIN_GET_USER, { 
    variables: { id: userId },
    fetchPolicy: 'network-only'
  });

  const [mutateProfile, { loading: profileLoading }] = useMutation(MUTATION_ADMIN_UPDATE_USER, {
    update: (cache, { data: mutationResult }: any) => {
      // Update the user in the admin list cache
      const updatedUser = mutationResult?.adminUpdateUser;
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

  const user = data?.adminGetUser;
  const [email, setEmail] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [disabled, setDisabled] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
      setEmailVerified(!!user.emailVerified);
      setDisplayName(user.displayName || '');
      setPhoneNumber(user.phoneNumber || '');
      setPhotoURL(user.photoURL || '');
      setDisabled(!!user.disabled);
    }
  }, [user]);

  const onSave = async () => {
    try {
      setSaveSuccess(false);
      await mutateProfile({ variables: { id: user!.id, input: {
        email: email || undefined,
        emailVerified,
        phoneNumber,
        displayName,
        photoURL: photoURL || undefined,
        disabled,
      } } });
      setSaveSuccess(true);
      setSaveError(null);
    } catch (e: any) {
      setSaveError(e?.message || 'Failed to save');
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

  return (
    <Screen scroll={true} contentContainerStyle={[{ gap: layout.containerGap }, styles.container]}>
      <Card>
        <UserIdentityRow email={user.email} phoneNumber={user.phoneNumber} identities={user.identities} />
      </Card>
      
      <Card>
        <View style={[{ gap: layout.formGap }, styles.form]}> 
          <Input 
            value={email} 
            onChangeText={setEmail} 
            placeholder="Email" 
            keyboardType="email-address"
            autoCapitalize="none"
            textContentType="emailAddress"
            autoComplete="email"
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
            keyboardType="phone-pad"
            textContentType="telephoneNumber"
            autoComplete="tel"
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
            <Body style={styles.errorText}>{saveError}</Body>
          )}
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { },
  container: { },
  errorText: { color: '#DC2626' },
});
