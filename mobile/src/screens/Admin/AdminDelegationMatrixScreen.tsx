import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { useAppSelector } from '../../store/hooks';
import { selectUserPermissions } from '../../features/auth/selectors';
import { useNavigation } from '@react-navigation/native';
import { Body, Card, NavigationCard } from '../../components';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';

export default function AdminDelegationMatrixScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const permissions = useAppSelector(selectUserPermissions) as string[];
  
  // Permission checks
  const canViewRoleGrants = permissions.includes('ADMIN_ROLE_GRANT_RULES_VIEW');
  const canViewPermissionGrants = permissions.includes('ADMIN_PERMISSION_GRANT_RULES_VIEW');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Body style={[styles.sectionTitle, { color: colors.text }]}>Delegation Management</Body>
          <Body style={[styles.sectionDescription, { color: colors.mutedText }]}>
            Manage who can grant roles and permissions to users
          </Body>
        </View>

        <View style={styles.cardsContainer}>
          <NavigationCard
            title="Role Grants"
            description="Define which roles can assign other roles to users"
            icon="users"
            onPress={() => navigation.navigate('AdminRoleGrants')}
            disabled={!canViewRoleGrants}
            iconColor={colors.primary}
            iconBackgroundColor={colors.primary + '20'}
          />

          <NavigationCard
            title="Permission Grants"
            description="Define which roles can assign permissions to users"
            icon="key"
            onPress={() => navigation.navigate('AdminPermissionGrants')}
            disabled={!canViewPermissionGrants}
            iconColor={colors.primary}
            iconBackgroundColor={colors.primary + '20'}
          />
        </View>

        {!canViewRoleGrants && !canViewPermissionGrants && (
          <Card style={styles.noAccessCard}>
            <View style={styles.noAccessContent}>
              <FontAwesome6 name="shield-halved" iconStyle="solid" size={32} color={colors.mutedText} />
              <Body style={[styles.noAccessTitle, { color: colors.text }]}>No Access</Body>
              <Body style={[styles.noAccessDescription, { color: colors.mutedText }]}>
                You don't have permission to manage delegation rules.
              </Body>
            </View>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 16 },
  section: { paddingVertical: 20, paddingBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '600', marginBottom: 8 },
  sectionDescription: { fontSize: 14, lineHeight: 20 },
  cardsContainer: { gap: 12 },
  noAccessCard: { marginTop: 32 },
  noAccessContent: { 
    alignItems: 'center', 
    paddingVertical: 32, 
    gap: 12 
  },
  noAccessTitle: { fontSize: 18, fontWeight: '500' },
  noAccessDescription: { fontSize: 14, textAlign: 'center', paddingHorizontal: 16 },
});
