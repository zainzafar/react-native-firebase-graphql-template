import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Body, Card, NavigationCard, Screen, LoadingContainer, UserIdentityRow } from '../../../components';
import { useTheme } from '../../../theme/ThemeProvider';
import { useAppSelector, useAppDispatch } from '../../../store/hooks';
import { selectUserPermissions, selectUser } from '../../../features/auth/selectors';
import { beginImpersonation } from '../../../features/auth/authSlice';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery, useMutation } from '@apollo/client/react';
import { QUERY_ADMIN_GET_USER, MUTATION_START_IMPERSONATION } from '../../../graphql/operations';
import { saveImpersonationToken } from '../../../auth/tokenStorage';
import { apolloClient } from '../../../graphql/client';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';

type User = {
  id: string;
  email?: string;
  displayName?: string;
  phoneNumber?: string;
  photoURL?: string;
  emailVerified?: boolean;
  disabled?: boolean;
  identities?: { providerId: string }[];
  role?: { id: string; name: string };
};

export default function AdminUserDetailScreen() {
  const { colors, layout } = useTheme();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const permissions = useAppSelector(selectUserPermissions) as string[];
  const currentUser = useAppSelector(selectUser);
  
  const userId = route.params?.id as string;
  
  // Permission checks
  const canViewRoles = permissions.includes('ADMIN_ROLES_VIEW');
  const canViewPermissions = permissions.includes('ADMIN_PERMISSIONS_VIEW');
  const canOpenAccess = canViewRoles || canViewPermissions;
  const canDeleteUser = permissions.includes('ADMIN_USERS_DELETE');
  const canUpdateProfile = permissions.includes('ADMIN_USERS_UPDATE_PROFILE');
  const canUpdatePassword = permissions.includes('ADMIN_USERS_UPDATE_PASSWORD');
  const canImpersonateUser = permissions.includes('ADMIN_USERS_IMPERSONATE') && currentUser?.id !== userId;

  // Queries
  const { data: userData, loading: userLoading } = useQuery<{ adminGetUser?: User }>(
    QUERY_ADMIN_GET_USER,
    { 
      variables: { id: userId },
      skip: !userId 
    }
  );

  const [startImpersonation, { loading: impersonationLoading }] = useMutation(MUTATION_START_IMPERSONATION) as any;

  const user = userData?.adminGetUser;
  const providerIds = Array.isArray(user?.identities) ? user!.identities.map((p: any) => p.providerId) : [];
  const hasPasswordProvider = providerIds.includes('password');
  const hasGoogleProvider = providerIds.includes('google.com');
  const hasAppleProvider = providerIds.includes('apple.com');
  const showSecuritySection = hasPasswordProvider || hasGoogleProvider || hasAppleProvider;

  const handleImpersonateUser = () => {
    const displayName = user?.displayName || user?.email || 'this user';
    
    Alert.alert(
      'Impersonate User',
      `Are you sure you want to impersonate ${displayName}? You will be signed in as this user and admin features will be hidden.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Impersonate',
          style: 'destructive',
          onPress: async () => {
            try {
              const { data } = await startImpersonation({
                variables: { userId: user!.id }
              });
              
              if (data?.startImpersonation?.token && data?.startImpersonation?.user) {
                // Save impersonation token
                await saveImpersonationToken(data.startImpersonation.token);
                
                // Update Redux state first
                dispatch(beginImpersonation({
                  token: data.startImpersonation.token,
                  user: data.startImpersonation.user
                }));
                
                // Reset navigation and go to home screen
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Home' }],
                });
                
                // Reset Apollo cache after navigation to prevent admin queries from running
                setTimeout(async () => {
                  await apolloClient.resetStore();
                }, 1000);
              }
            } catch (error) {
              console.error('Failed to start impersonation:', error);
              Alert.alert('Error', 'Failed to start impersonation. Please try again.');
            }
          },
        },
      ]
    );
  };

  if (userLoading) {
    return (
      <Screen>
        <LoadingContainer text="Loading user details..." />
      </Screen>
    );
  }

  if (!user) {
    return (
      <Screen>
        <Card style={styles.errorCard}>
          <Body style={[{ color: colors.mutedText }, styles.centerText]}>User not found</Body>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen scroll={true}>
      {/* User Header */}
      <Card style={styles.headerCard}>
        <Body style={[{ color: colors.text }, styles.userTitle]}>
          {user.displayName || user.email || 'User'}
        </Body>
        <UserIdentityRow 
          email={user.email}
          phoneNumber={user.phoneNumber}
          identities={user.identities}
          style={styles.userIdentity}
        />
        <View style={[{ gap: layout.containerGap }, styles.userStats]}>
          <View style={styles.statItem}>
            <FontAwesome6 name="envelope" iconStyle="solid" size={12} color={colors.mutedText} />
            <Body style={[{ color: colors.mutedText }, styles.statText]}>
              {user.emailVerified ? 'Verified' : 'Unverified'}
            </Body>
          </View>
          {user.role && (
            <View style={styles.statItem}>
              <FontAwesome6 name="user-tag" iconStyle="solid" size={12} color={colors.mutedText} />
              <Body style={[{ color: colors.mutedText }, styles.statText]}>
                {user.role.name}
              </Body>
            </View>
          )}
        </View>
      </Card>

      {/* Navigation Cards */}
      <View style={[{ gap: layout.containerGap }, styles.navigationCards]}>
        {/* Basic Information */}
        {canUpdateProfile && (
          <NavigationCard
            title="Basic Information"
            description="Update email, display name, phone number, and photo"
            icon="user"
            onPress={() => navigation.navigate('AdminEditUserBasicInfo', { id: userId })}
            iconColor={colors.primary}
            iconBackgroundColor={`${colors.primary}20`}
          />
        )}

        {/* Security */}
        {showSecuritySection && canUpdatePassword && (
          <NavigationCard
            title="Security"
            description="Change password and manage authentication settings"
            icon="shield"
            onPress={() => navigation.navigate('AdminEditUserSecurity', { id: userId })}
            disabled={!canUpdatePassword}
            iconColor={colors.primary}
            iconBackgroundColor={`${colors.primary}20`}
          />
        )}

        {/* Roles & Permissions */}
        {canOpenAccess && (
          <NavigationCard
            title="Roles & Permissions"
            description="Manage user roles and direct permissions"
            icon="key"
            onPress={() => navigation.navigate('AdminEditUserAccess', { id: userId })}
            disabled={!canOpenAccess}
            iconColor={colors.primary}
            iconBackgroundColor={`${colors.primary}20`}
          />
        )}

        {/* Impersonate User */}
        {canImpersonateUser && (
          <NavigationCard
            title="Impersonate User"
            description="Sign in as this user to test their experience"
            icon="user-secret"
            onPress={handleImpersonateUser}
            disabled={!canImpersonateUser || impersonationLoading}
            iconColor="#F59E0B"
            iconBackgroundColor="#F59E0B20"
          />
        )}

        {/* Delete User */}
        {canDeleteUser && (
          <NavigationCard
            title="Delete User"
            description="Permanently delete this user and all associated data"
            icon="trash"
            onPress={() => navigation.navigate('AdminDeleteUser', { id: userId })}
            disabled={!canDeleteUser}
            iconColor="#DC2626"
            iconBackgroundColor="#DC262620"
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerCard: { padding: 20, marginBottom: 16 },
  userTitle: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  userIdentity: { marginBottom: 16 },
  userStats: { 
    flexDirection: 'row', 
  },
  statItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6 
  },
  statText: { fontSize: 14 },
  navigationCards: { },
  errorCard: { 
    marginTop: 16, 
    paddingVertical: 16 
  },
  centerText: { textAlign: 'center' },
});


