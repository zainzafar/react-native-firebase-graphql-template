import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Body, Card, NavigationCard, Screen, LoadingContainer } from '../../../components';
import { useTheme } from '../../../theme/ThemeProvider';
import { useAppSelector } from '../../../store/hooks';
import { selectUserPermissions } from '../../../features/auth/selectors';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery } from '@apollo/client/react';
import { QUERY_ADMIN_GET_USER } from '../../../graphql/operations';
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
  const permissions = useAppSelector(selectUserPermissions) as string[];
  
  const userId = route.params?.id as string;
  
  // Permission checks
  const canViewRoles = permissions.includes('ADMIN_ROLES_VIEW');
  const canViewPermissions = permissions.includes('ADMIN_PERMISSIONS_VIEW');
  const canOpenAccess = canViewRoles || canViewPermissions;
  const canDeleteUser = permissions.includes('ADMIN_USERS_DELETE');
  const canUpdateProfile = permissions.includes('ADMIN_USERS_UPDATE_PROFILE');
  const canUpdatePassword = permissions.includes('ADMIN_USERS_UPDATE_PASSWORD');
  const canImpersonateUser = permissions.includes('ADMIN_USERS_IMPERSONATE');

  // Queries
  const { data: userData, loading: userLoading } = useQuery<{ adminGetUser?: User }>(
    QUERY_ADMIN_GET_USER,
    { 
      variables: { id: userId },
      skip: !userId 
    }
  );

  const user = userData?.adminGetUser;
  const providerIds = Array.isArray(user?.identities) ? user!.identities.map((p: any) => p.providerId) : [];
  const hasPasswordProvider = providerIds.includes('password');
  const hasGoogleProvider = providerIds.includes('google.com');
  const hasAppleProvider = providerIds.includes('apple.com');
  const showSecuritySection = hasPasswordProvider || hasGoogleProvider || hasAppleProvider;

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
        {user.email && (
          <Body style={[{ color: colors.mutedText }, styles.userEmail]}>
            {user.email}
          </Body>
        )}
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
            onPress={() => {
              // TODO: Implement impersonation functionality
              console.log('Impersonate user:', userId);
            }}
            disabled={!canImpersonateUser}
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
  userEmail: { fontSize: 16, lineHeight: 22, marginBottom: 16 },
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


