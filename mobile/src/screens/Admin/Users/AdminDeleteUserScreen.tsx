import React from 'react';
import { Alert, View, StyleSheet, ScrollView } from 'react-native';
import { Body, Button, Card, UserIdentityRow } from '../../../components';
import { useTheme } from '../../../theme/ThemeProvider';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useMutation, useQuery } from '@apollo/client/react';
import { MUTATION_ADMIN_DELETE_USER, QUERY_ADMIN_GET_USER } from '../../../graphql/operations';

export default function AdminDeleteUserScreen() {
  const { colors } = useTheme();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const id = route.params?.id as string;
  const { data } = useQuery<{ adminGetUser?: any }>(QUERY_ADMIN_GET_USER, { variables: { id: id } });
  const user = data?.adminGetUser;
  const [mutate, { loading }] = useMutation(MUTATION_ADMIN_DELETE_USER, {
    update: (cache, { data }: any) => {
      // Remove the user from the admin list cache
      // The mutation returns true on success, so we use the uid from the mutation variables
      if (data?.adminDeleteUser) {
        cache.modify({
          fields: {
            adminListUsers: (existing = {}) => {
              if (existing.edges) {
                const filteredEdges = existing.edges.filter((edge: any) => edge.node.id !== id);
                return { ...existing, edges: filteredEdges };
              }
              return existing;
            },
          },
        });
      }
    },
  });

  const onDelete = () => {
    const identifier = user?.email || user?.phoneNumber || user?.uid || 'this user';
    Alert.alert(
      'Confirm deletion',
      `Are you sure you want to delete ${identifier}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await mutate({ variables: { id: id } });
              Alert.alert('Deleted', 'User has been deleted.');
              try { navigation.goBack(); } catch {}
            } catch (e: any) {
              Alert.alert('Delete failed', e?.message || 'Unknown error');
            }
          },
        },
      ],
    );
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      contentInsetAdjustmentBehavior="automatic"
    > 
      <Card>
        <View style={styles.list}> 
          <UserIdentityRow email={user?.email} phoneNumber={user?.phoneNumber} identities={user?.identities} style={{ marginBottom: 8 }} />
          <Body>• This is a destructive action.</Body>
          <Body>• The user and related data will be permanently removed.</Body>
          <Body>• This cannot be undone.</Body>
        </View>
        <Button
          title="Permanently Delete"
          onPress={onDelete}
          loading={loading}
          variant="ghost"
          icon="trash-can"
          iconStyle="regular"
          style={{ backgroundColor: '#DC2626', borderColor: '#DC2626' }}
          textColor="#FFFFFF"
        />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  list: { marginVertical: 12, gap: 6 },
});


