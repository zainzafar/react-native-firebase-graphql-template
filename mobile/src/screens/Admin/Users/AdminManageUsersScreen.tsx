import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, View, Pressable, RefreshControl } from 'react-native';
import { Body, Button, Card } from '../../../components';
import { useTheme } from '../../../theme/ThemeProvider';
import { useQuery } from '@apollo/client/react';
import { QUERY_ADMIN_LIST_USERS } from '../../../graphql/operations';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { useNavigation } from '@react-navigation/native';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

import { usePermissions } from '../../../features/auth/hooks';

type Edge = { cursor: string; node: { id: string; uid: string; email?: string; phoneNumber?: string; displayName?: string; lastLoginProvider?: string; createdAt?: string; identities?: { providerId: string }[] } };
type AdminListUsersQuery = {
  adminListUsers?: {
    edges: Edge[];
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
  };
};

const USERS_PER_PAGE = 20;

export default function AdminManageUsersScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const debounceRef = useRef<any>(null);

  // Permission checks
  const { canUpdateUserProfile, canUpdateUserPassword, canDeleteUsers, canImpersonateUsers, canSearchUsers } = usePermissions();
  
  // Show edit button if user can update profile or password
  const canEditUsers = canUpdateUserProfile || canUpdateUserPassword;

  const { data, loading, fetchMore, refetch } = useQuery<AdminListUsersQuery>(QUERY_ADMIN_LIST_USERS, {
    variables: { query: debounced || undefined, first: USERS_PER_PAGE, after: null },
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'network-only', // Always fetch fresh data when managing users
  });

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebounced(search.trim()), 400);
    return () => debounceRef.current && clearTimeout(debounceRef.current);
  }, [search]);

  const edges: Edge[] = useMemo(() => data?.adminListUsers?.edges ?? [], [data]);
  const hasNextPage = data?.adminListUsers?.pageInfo?.hasNextPage ?? false;
  const endCursor = data?.adminListUsers?.pageInfo?.endCursor ?? null;

  const onEndReached = useCallback(() => {
    if (loading || loadingMore || !hasNextPage) return;
    setLoadingMore(true);
    fetchMore({ variables: { query: debounced || undefined, first: USERS_PER_PAGE, after: endCursor } })
      .finally(() => setLoadingMore(false));
  }, [loading, loadingMore, hasNextPage, fetchMore, debounced, endCursor]);

  const onRefresh = useCallback(() => {
    if (refreshing) return;
    setRefreshing(true);
    refetch({ query: debounced || undefined, first: USERS_PER_PAGE, after: null })
      .finally(() => setRefreshing(false));
  }, [refetch, debounced, refreshing]);

  const renderItem = ({ item }: { item: Edge }) => {
    const u = item.node;
    const formatTimestamp = (ts?: number | string | null) => {
      if (ts === null || ts === undefined) return null;
      const n = typeof ts === 'number' ? ts : Number(ts);
      const d = new Date(n);
      if (isNaN(d.getTime())) return null;
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    };
    const formatPhone = (p?: string | null) => {
      if (!p) return null;
      try {
        const parsed = parsePhoneNumberFromString(p);
        return parsed ? parsed.formatInternational() : p;
      } catch {
        return p;
      }
    };
    const signupStr = formatTimestamp((u as any).createdAt);
    return (
      <Card style={styles.row}>
        <View style={styles.rowHeader}>
          <View style={styles.headerLeft}>
            <View style={styles.providersRow}>
              {Array.isArray(u.identities) && u.identities.map((id) => {
                if (id.providerId === 'google.com') {
                  return <FontAwesome6 key="google" name="google" iconStyle="brand" size={14} color="#EA4335" />;
                }
                if (id.providerId === 'apple.com') {
                  return <FontAwesome6 key="apple" name="apple" iconStyle="brand" size={16} color={colors.text} />;
                }
                if (id.providerId === 'password') {
                  return <FontAwesome6 key="password" name="key" iconStyle="solid" size={14} color={colors.text} />;
                }
                if (id.providerId === 'phone') {
                  return <FontAwesome6 key="phone" name="phone" iconStyle="solid" size={14} color={colors.text} />;
                }
                return null;
              })}
            </View>
            <Text style={[styles.email, { color: colors.text }]} numberOfLines={1}>
              {u.email || formatPhone(u.phoneNumber) || u.uid}
            </Text>
          </View>
          {canDeleteUsers && (
            <Pressable onPress={() => navigation.navigate('AdminDeleteUser', { id: u.uid })} hitSlop={8} style={styles.deleteIconButton}>
              <FontAwesome6 name="trash-can" iconStyle="regular" size={16} color="#EF4444" />
            </Pressable>
          )}
        </View>
        <View style={styles.meta}>
          {u.displayName ? <Body style={styles.metaText}>{u.displayName}</Body> : null}
          {u.phoneNumber ? <Body style={styles.metaText}>{formatPhone(u.phoneNumber)}</Body> : null}
          <Body style={styles.metaText}>ID: {u.uid}</Body>
          {signupStr ? <Body style={styles.metaText}>Signed up: {signupStr}</Body> : null}
        </View>
        <View style={styles.rowActions}>
          {[
            ...(canImpersonateUsers ? [{ key: 'imp', title: 'Impersonate', onPress: () => {} }] : []),
            ...(canEditUsers ? [{ key: 'edit', title: 'Edit', onPress: () => navigation.navigate('AdminEditUser', { id: u.id }) }] : []),
          ].map((action) => (
            <View key={action.key} style={styles.actionCol}>
              <Button
                title={action.title}
                variant="ghost"
                onPress={action.onPress}
                style={[styles.compactButton, styles.actionButton]}
              />
            </View>
          ))}
        </View>
      </Card>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      {canSearchUsers && (
        <Card style={styles.searchCard}>
          <View style={styles.searchRow}>
            <FontAwesome6 name="magnifying-glass" iconStyle="solid" size={16} color={colors.mutedText} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Enter user email or ID"
              placeholderTextColor={colors.mutedText}
              style={[styles.searchInput, { color: colors.text }]}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {search.length > 0 ? (
              <Pressable onPress={() => setSearch('')} hitSlop={8}>
                <FontAwesome6 name="circle-xmark" iconStyle="regular" size={18} color={colors.mutedText} />
              </Pressable>
            ) : null}
          </View>
        </Card>
      )}

      <FlatList
        data={edges}
        keyExtractor={(e) => e.cursor}
        renderItem={renderItem}
        contentContainerStyle={{ 
          padding: 16, 
          paddingTop: canSearchUsers ? 0 : 16, // Add top padding when search is hidden
          gap: 12 
        }}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.text}
            titleColor={colors.text}
            colors={[colors.text]}
            progressBackgroundColor="transparent"
          />
        }
        ListEmptyComponent={loading ? (
          <View style={styles.initialLoader}> 
            <ActivityIndicator color={colors.mutedText} />
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Body style={[styles.emptyText, { color: colors.mutedText }]}>
              {debounced ? 'No users found matching your search' : 'No users found'}
            </Body>
          </View>
        )}
        ListFooterComponent={loadingMore && hasNextPage ? (
          <View style={styles.footerLoader}>
            <ActivityIndicator color={colors.mutedText} />
          </View>
        ) : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchCard: { marginVertical: 16, marginHorizontal: 16 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchInput: { flex: 1, paddingVertical: 0 },
  row: { padding: 12, gap: 12 },
  rowHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  email: { fontSize: 16, fontWeight: '600', flexShrink: 1 },
  meta: { gap: 2 },
  metaText: { opacity: 0.7 },
  providersRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  deleteIconButton: { padding: 6 },
  rowActions: { flexDirection: 'row', alignItems: 'stretch', marginTop: 4 },
  actionCol: { flex: 1, paddingHorizontal: 4 },
  actionButton: { width: '100%' },
  compactButton: { paddingVertical: 8, paddingHorizontal: 10 },
  initialLoader: { paddingTop: 10, alignItems: 'center' },
  headerLoader: { paddingVertical: 0, alignItems: 'center' },
  footerLoader: { paddingVertical: 16, alignItems: 'center' },
  emptyState: { paddingTop: 40, alignItems: 'center', gap: 16 },
  emptyText: { textAlign: 'center', fontSize: 16 },
});


