import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, TextInput, View, Pressable, RefreshControl } from 'react-native';
import { Body, Card, Screen, InlineLoader, UserIdentityRow } from '../../../components';
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
  const { colors, layout } = useTheme();
  const navigation = useNavigation<any>();
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const debounceRef = useRef<any>(null);

  // Permission checks
  const { canViewUsers, canSearchUsers, canUpdateUserProfile, canUpdateUserPassword, canDeleteUsers, canImpersonateUsers } = usePermissions();
  
  // Show chevron if user has any permission that would show cards on the detail screen
  const canViewUserDetails = canViewUsers || canUpdateUserProfile || canUpdateUserPassword || canDeleteUsers || canImpersonateUsers;

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
      <Card style={[{ gap: layout.formGap }, styles.row]}>
        <Pressable 
          onPress={() => canViewUserDetails && navigation.navigate('AdminUserDetail', { id: u.id })}
          disabled={!canViewUserDetails}
          style={[styles.rowHeader, !canViewUserDetails && styles.disabledRow]}
        >
          <View style={styles.headerLeft}>
            <UserIdentityRow 
              email={u.email} 
              phoneNumber={u.phoneNumber} 
              identities={u.identities}
              style={styles.userIdentity}
            />
          </View>
          <View style={styles.headerRight}>
            {canViewUserDetails && (
              <FontAwesome6 name="chevron-right" iconStyle="solid" size={16} color={colors.mutedText} />
            )}
          </View>
        </Pressable>
        <View style={[{ gap: layout.containerGap }, styles.meta]}>
          {u.displayName ? <Body style={styles.metaText}>{u.displayName}</Body> : null}
          {u.phoneNumber ? <Body style={styles.metaText}>{formatPhone(u.phoneNumber)}</Body> : null}
          <Body style={styles.metaText}>ID: {u.uid}</Body>
          {signupStr ? <Body style={styles.metaText}>Signed up: {signupStr}</Body> : null}
        </View>
      </Card>
    );
  };

  return (
    <Screen>
      {canSearchUsers && (
        <Card style={styles.searchCard}>
          <View style={[{ gap: layout.formGap }, styles.searchRow]}>
            <FontAwesome6 name="magnifying-glass" iconStyle="solid" size={16} color={colors.mutedText} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Enter user email or ID"
              placeholderTextColor={colors.mutedText}
              style={[{ color: colors.text }, styles.searchInput]}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="emailAddress"
              autoComplete="email"
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
          gap: layout.containerGap,
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
        ListEmptyComponent={
          <View style={[{ gap: layout.containerGap }, styles.emptyState]}>
            {loading ? (
              <ActivityIndicator size="large" color={colors.mutedText} />
            ) : (
              <Body style={[{ color: colors.mutedText }, styles.emptyText]}>
                {debounced ? 'No users found matching your search' : 'No users found'}
              </Body>
            )}
          </View>
        }
        ListFooterComponent={loadingMore && hasNextPage ? (
          <View style={styles.footerLoader}>
            <InlineLoader />
          </View>
        ) : null}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchCard: { marginBottom: 16 },
  searchRow: { flexDirection: 'row', alignItems: 'center' },
  searchInput: { flex: 1, paddingVertical: 0 },
  row: { padding: 12 },
  rowHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flexShrink: 1, flex: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  userIdentity: { flexShrink: 1 },
  meta: { },
  metaText: { opacity: 0.7 },
  disabledRow: { opacity: 0.6 },
  headerLoader: { paddingVertical: 0, alignItems: 'center' },
  footerLoader: { paddingVertical: 16, alignItems: 'center' },
  emptyState: { paddingTop: 40, alignItems: 'center' },
  emptyText: { textAlign: 'center', fontSize: 16 },
});


