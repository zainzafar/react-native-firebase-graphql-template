import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useQuery } from '@apollo/client/react';
import { useNavigation } from '@react-navigation/native';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { useTheme } from '../../../theme/ThemeProvider';
import { usePermissions } from '../../../features/auth/hooks';
import { Screen, Card, Body, Button, LoadingContainer } from '../../../components';
import { QUERY_ADMIN_LIST_APP_VERSION_RULES } from '../../../graphql/operations';

type AppVersionRule = {
  id: string;
  platform: 'ios' | 'android';
  minVersion: string;
  latestVersion: string;
  enforced: boolean;
  forceAt?: string;
  message?: string;
  storeUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type PlatformFilter = 'all' | 'ios' | 'android';

export default function AdminAppReleasesScreen() {
  const { colors, layout, typography, borderRadius } = useTheme();
  const navigation = useNavigation<any>();
  const { canManageAppReleases } = usePermissions();
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>('all');

  // Queries
  const { data: rulesData, loading: rulesLoading } = useQuery<{ adminListAppVersionRules: AppVersionRule[] }>(
    QUERY_ADMIN_LIST_APP_VERSION_RULES,
    { 
      variables: { platform: platformFilter === 'all' ? undefined : platformFilter },
      fetchPolicy: 'cache-and-network'
    }
  );

  const rules = rulesData?.adminListAppVersionRules ?? [];
  
  // Find active rules for each platform
  const activeRules = {
    ios: rules.find(rule => rule.platform === 'ios' && rule.isActive),
    android: rules.find(rule => rule.platform === 'android' && rule.isActive),
  };

  const renderRuleCard = (rule: AppVersionRule) => (
    <Card key={rule.id} style={styles.ruleCard}>
      <Pressable 
        onPress={() => canManageAppReleases ? navigation.navigate('AdminEditAppRelease', { ruleId: rule.id, activeRules }) : undefined}
        style={styles.ruleCardPressable}
      >
        <View style={styles.ruleHeader}>
          <View style={styles.ruleInfo}>
            <View style={[{ gap: layout.containerGap }, styles.ruleTitleRow]}>
              <View style={styles.platformTitleContainer}>
                <FontAwesome6 
                  name={rule.platform === 'ios' ? "apple" : "android"} 
                  iconStyle="brand" 
                  size={16} 
                  color={colors.text} 
                  style={styles.platformIcon}
                />
                <Body style={[{ color: colors.text, fontSize: typography.sizes.body, fontWeight: typography.weights.semiBold }, styles.ruleTitle]}>
                  {rule.platform.toUpperCase()} v{rule.latestVersion}
                </Body>
              </View>
              {rule.isActive && (
                <View style={[{ backgroundColor: colors.primary, borderRadius: borderRadius.sm }, styles.activeBadge]}>
                  <Body style={[{ color: colors.card, fontSize: typography.sizes.captionSmall, fontWeight: typography.weights.semiBold }, styles.activeBadgeText]}>ACTIVE</Body>
                </View>
              )}
            </View>
            {rule.message && (
              <Body style={[{ color: colors.mutedText, fontSize: typography.sizes.bodySmall, lineHeight: typography.lineHeights.normal }, styles.ruleMessage]}>
                {rule.message}
              </Body>
            )}
          </View>
          {canManageAppReleases && (
            <FontAwesome6 name="chevron-right" iconStyle="solid" size={16} color={colors.mutedText} />
          )}
        </View>
        
        <View style={[{ gap: layout.containerGap }, styles.ruleStats]}>
          <View style={styles.ruleStatRow}>
            <Body style={[{ color: colors.mutedText, fontSize: typography.sizes.bodySmall }, styles.ruleStatLabel]}>Min Version:</Body>
            <Body style={[{ color: colors.text, fontSize: typography.sizes.bodySmall, fontWeight: typography.weights.medium }, styles.ruleStatValue]}>{rule.minVersion}</Body>
          </View>
          <View style={styles.ruleStatRow}>
            <Body style={[{ color: colors.mutedText, fontSize: typography.sizes.bodySmall }, styles.ruleStatLabel]}>Enforced:</Body>
            <View style={styles.enforcedIconContainer}>
              <FontAwesome6 
                name={rule.enforced ? "check" : "xmark"} 
                iconStyle="solid" 
                size={16} 
                color={rule.enforced ? colors.accent : colors.danger} 
              />
            </View>
          </View>
          {rule.forceAt && (
            <View style={styles.ruleStatRow}>
              <Body style={[{ color: colors.mutedText, fontSize: typography.sizes.bodySmall }, styles.ruleStatLabel]}>Force At:</Body>
              <Body style={[{ color: colors.text, fontSize: typography.sizes.bodySmall, fontWeight: typography.weights.medium }, styles.ruleStatValue]}>
                {new Date(rule.forceAt).toLocaleDateString()}
              </Body>
            </View>
          )}
        </View>
      </Pressable>
    </Card>
  );

  const renderEmptyState = () => {
    return (
      <Card style={[layout.emptyCard, styles.emptyCard]}>
        <View style={[{ gap: layout.containerGap }, styles.emptyContent]}>
          <FontAwesome6 name="mobile-screen" iconStyle="solid" size={32} color={colors.mutedText} />
          <Body style={[{ color: colors.text, fontSize: typography.sizes.h3, fontWeight: typography.weights.semiBold }, styles.emptyTitle]}>No Release Rules Yet</Body>
          <Body style={[{ color: colors.mutedText, fontSize: typography.sizes.bodySmall, lineHeight: typography.lineHeights.normal }, styles.emptyDescription]}>
            {canManageAppReleases 
              ? 'Create your first app release rule to start managing app updates.'
              : 'You don\'t have permission to create app release rules.'
            }
          </Body>
        </View>
      </Card>
    );
  };

  const renderPlatformFilter = () => (
    <View style={[{ marginBottom: layout.containerGap }, styles.filterContainer]}>
      <View style={[{ gap: layout.containerGap }, styles.filterButtons]}>
        {(['all', 'ios', 'android'] as PlatformFilter[]).map((platform) => (
          <Pressable
            key={platform}
            onPress={() => setPlatformFilter(platform)}
            style={[
              { borderColor: colors.border, borderRadius: borderRadius.md },
              platformFilter === platform && { backgroundColor: colors.primary, borderColor: colors.primary },
              styles.filterButton
            ]}
          >
            <Body style={[
              styles.filterButtonText,
              { color: platformFilter === platform ? colors.card : colors.text }
            ]}>
              {platform === 'all' ? 'All' : platform.toUpperCase()}
            </Body>
          </Pressable>
        ))}
      </View>
    </View>
  );

  return (
    <Screen scroll={true} contentContainerStyle={[{ gap: layout.containerGap }, styles.content]}>
      {/* Platform Filter */}
      {renderPlatformFilter()}

      {/* Create Rule Button */}
      {canManageAppReleases && (
        <View style={[{ marginBottom: layout.containerGap }, styles.addButtonContainer]}>
          <Button
            title="Create Release Rule"
            onPress={() => navigation.navigate('AdminCreateAppRelease', { activeRules })}
            icon="plus"
            iconStyle="solid"
          />
        </View>
      )}

      {/* Content */}
      {rulesLoading ? (
        <LoadingContainer text="Loading release rules..." />
      ) : rules.length > 0 ? (
        rules.map(renderRuleCard)
      ) : (
        renderEmptyState()
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
  },
  filterContainer: {
  },
  filterButtons: {
    flexDirection: 'row',
  },
  filterButton: {
    flex: 1,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  filterButtonText: {
    // fontSize, fontWeight moved to inline style
  },
  addButtonContainer: {
  },
  ruleCard: {
    // Card component already has padding
  },
  ruleCardPressable: {
    width: '100%',
  },
  ruleHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  ruleInfo: {
    flex: 1,
  },
  ruleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  platformTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  platformIcon: {
    marginRight: 8,
  },
  ruleTitle: {
    // fontSize, fontWeight moved to inline style
  },
  activeBadge: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  activeBadgeText: {
    // fontSize, fontWeight moved to inline style
  },
  ruleMessage: {
    // fontSize, lineHeight moved to inline style
  },
  ruleStats: {
    marginTop: 8,
  },
  ruleStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ruleStatLabel: {
    // fontSize moved to inline style
  },
  ruleStatValue: {
    // fontSize, fontWeight moved to inline style
  },
  enforcedIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    padding: 32,
  },
  emptyContent: {
    alignItems: 'center',
  },
  emptyTitle: {
    textAlign: 'center',
  },
  emptyDescription: {
    textAlign: 'center',
  },
});
