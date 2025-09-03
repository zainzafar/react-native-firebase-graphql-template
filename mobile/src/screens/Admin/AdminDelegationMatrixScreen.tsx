import React from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { useAppSelector } from '../../store/hooks';
import { selectUserPermissions } from '../../features/auth/selectors';
import { useNavigation } from '@react-navigation/native';
import { Body, Card } from '../../components';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';

export default function AdminDelegationMatrixScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const permissions = useAppSelector(selectUserPermissions) as string[];
  
  // Permission checks
  const canViewRoleGrants = permissions.includes('ADMIN_ROLE_GRANT_RULES_VIEW');
  const canViewPermissionGrants = permissions.includes('ADMIN_PERMISSION_GRANT_RULES_VIEW');

  const renderNavigationCard = (
    title: string,
    description: string,
    icon: string,
    onPress: () => void,
    disabled: boolean = false
  ) => (
    <Card style={styles.navigationCard}>
      <Pressable 
        onPress={onPress}
        disabled={disabled}
        style={[
          styles.navigationPressable,
          disabled && { opacity: 0.5 }
        ]}
      >
        <View style={styles.navigationContent}>
          <View style={styles.navigationLeft}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
              <FontAwesome6 
                name={icon as any} 
                iconStyle="solid" 
                size={20} 
                color={colors.primary} 
              />
            </View>
            <View style={styles.textContainer}>
              <Body style={[styles.navigationTitle, { color: colors.text }]}>{title}</Body>
              <Body style={[styles.navigationDescription, { color: colors.mutedText }]}>{description}</Body>
            </View>
          </View>
          <FontAwesome6 
            name="chevron-right" 
            iconStyle="solid" 
            size={16} 
            color={colors.mutedText} 
          />
        </View>
      </Pressable>
    </Card>
  );

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
          {renderNavigationCard(
            'Role Grants',
            'Define which roles can assign other roles to users',
            'users',
            () => navigation.navigate('AdminRoleGrants'),
            !canViewRoleGrants
          )}

          {renderNavigationCard(
            'Permission Grants',
            'Define which roles can assign permissions to users',
            'key',
            () => navigation.navigate('AdminPermissionGrants'),
            !canViewPermissionGrants
          )}
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
  navigationCard: { marginBottom: 0 },
  navigationPressable: { 
    paddingVertical: 16, 
    paddingHorizontal: 20 
  },
  navigationContent: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between' 
  },
  navigationLeft: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    flex: 1 
  },
  iconContainer: { 
    width: 48, 
    height: 48, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: 16 
  },
  textContainer: { flex: 1 },
  navigationTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  navigationDescription: { fontSize: 14, lineHeight: 18 },
  noAccessCard: { marginTop: 32 },
  noAccessContent: { 
    alignItems: 'center', 
    paddingVertical: 32, 
    gap: 12 
  },
  noAccessTitle: { fontSize: 18, fontWeight: '500' },
  noAccessDescription: { fontSize: 14, textAlign: 'center', paddingHorizontal: 16 },
});
