import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../../../theme/ThemeProvider';

import { useQuery } from '@apollo/client/react';
import { Body, Card, UserIdentityRow, Screen } from '../../../components';
import { useRoute, useNavigation } from '@react-navigation/native';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import {
  QUERY_ADMIN_GET_ROLE,
} from '../../../graphql/operations';

type Role = {
  id: string;
  name: string;
  users: { 
    id: string; 
    email: string; 
    displayName?: string;
    phoneNumber?: string;
    identities?: { providerId: string }[];
  }[];
};

export default function AdminViewRoleUsers() {
  const { colors } = useTheme();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const roleId = route.params?.roleId;
  

  
  // Queries
  const { data: roleData, loading: roleLoading } = useQuery<{ adminGetRole: Role }>(
    QUERY_ADMIN_GET_ROLE,
    { 
      variables: { id: roleId },
      skip: !roleId 
    }
  );

  const role = roleData?.adminGetRole;

  if (roleLoading) {
    return (
      <Screen>
        <Card style={styles.loadingCard}>
          <Body style={[styles.centerText, { color: colors.mutedText }]}>Loading role users...</Body>
        </Card>
      </Screen>
    );
  }

  if (!role) {
    return (
      <Screen>
        <Card style={styles.errorCard}>
          <Body style={[styles.centerText, { color: colors.mutedText }]}>Role not found</Body>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen contentContainerStyle={styles.content}>
      {role.users.length === 0 ? (
        <Card style={styles.emptyCard}>
          <View style={styles.emptyContainer}>
            <Body style={[styles.emptyText, { color: colors.mutedText }]}>
              No users are currently assigned to this role
            </Body>
          </View>
        </Card>
      ) : (
        <Card style={styles.usersCard}>
          <View style={styles.usersContainer}>
            {role.users.map((user) => (
              <Pressable 
                key={user.id}
                onPress={() => navigation.navigate('AdminEditUserAccess', { id: user.id })}
                style={styles.userRow}
              >
                <View style={styles.userInfo}>
                  <UserIdentityRow 
                    email={user.email}
                    phoneNumber={user.phoneNumber}
                    identities={user.identities}
                  />
                </View>
                <FontAwesome6 name="chevron-right" iconStyle="solid" size={16} color={colors.mutedText} />
              </Pressable>
            ))}
          </View>
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1 },
  emptyCard: { marginBottom: 16 },
  emptyContainer: { padding: 32, alignItems: 'center' },
  emptyText: { fontSize: 16, textAlign: 'center' },
  usersCard: { marginBottom: 16 },
  usersContainer: {
    flexDirection: 'column',
    gap: 16
  },
  userRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    padding: 8
  },
  userInfo: { flex: 1 },
  loadingCard: { marginTop: 32, paddingVertical: 32 },
  errorCard: { marginTop: 32, paddingVertical: 32 },
  centerText: { textAlign: 'center' },
});
