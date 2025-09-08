import React from 'react';
import { Alert, View, StyleSheet } from 'react-native';
import { Body, Button, Card, UserIdentityRow, Screen } from '../../../components';
import { useTheme } from '../../../theme/ThemeProvider';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useMutation, useQuery } from '@apollo/client/react';
import { MUTATION_ADMIN_DELETE_USER, QUERY_ADMIN_GET_USER } from '../../../graphql/operations';

export default function AdminDeleteUserScreen() {
  const { layout } = useTheme();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const id = route.params?.id as string;
  const { data } = useQuery<{ adminGetUser?: any }>(QUERY_ADMIN_GET_USER, { variables: { id: id } });
  const user = data?.adminGetUser;
  const [mutate, { loading }] = useMutation(MUTATION_ADMIN_DELETE_USER, {
    update: (cache, { data: mutationResult }: any) => {
      // Remove the user from the admin list cache
      // The mutation returns true on success, so we use the uid from the mutation variables
      if (mutationResult?.adminDeleteUser) {
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
    <Screen>
      <Card>
        <View style={[{ gap: layout.containerGap }, styles.list]}> 
          <UserIdentityRow email={user?.email} phoneNumber={user?.phoneNumber} identities={user?.identities} style={styles.mb8} />
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
          style={styles.deleteButton}
          textColor="#FFFFFF"
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { marginVertical: 12 },
  mb8: { marginBottom: 8 },
  deleteButton: { backgroundColor: '#DC2626', borderColor: '#DC2626' },
});


