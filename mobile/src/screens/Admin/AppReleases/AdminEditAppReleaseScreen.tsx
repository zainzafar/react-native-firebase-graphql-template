import React, { useState, useEffect } from 'react';
import { StyleSheet, Alert } from 'react-native';
import { useQuery, useMutation } from '@apollo/client/react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../../theme/ThemeProvider';
import { Screen, Card, Body, Button, LoadingContainer } from '../../../components';
import {
  AppReleaseForm,
} from './Components';
import { 
  QUERY_ADMIN_GET_APP_VERSION_RULE, 
  MUTATION_ADMIN_UPDATE_APP_VERSION_RULE, 
  MUTATION_ADMIN_DELETE_APP_VERSION_RULE,
  QUERY_ADMIN_LIST_APP_VERSION_RULES 
} from '../../../graphql/operations';

type AppPlatform = 'ios' | 'android';

type AppVersionRule = {
  id: string;
  platform: 'ios' | 'android';
  minVersion: string;
  latestVersion: string;
  enforced: boolean;
  forceAt?: string;
  message?: string;
  storeUrl: string;
  softSnoozeSeconds?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function AdminEditAppReleaseScreen() {
  const { colors, layout, typography } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const ruleId = route.params?.ruleId;
  const activeRules = route.params?.activeRules || { ios: null, android: null };
  
  const [formData, setFormData] = useState({
    platform: 'ios' as AppPlatform,
    minVersion: '',
    latestVersion: '',
    enforced: false,
    enforceAtFutureDate: false,
    forceAt: '',
    message: '',
    storeUrl: '',
    softSnoozeSeconds: 3600,
    isActive: false,
  });

  const [originalRule, setOriginalRule] = useState<AppVersionRule | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [deleteError, setDeleteError] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Check if form is valid for button disabled state
  const isFormValid = formData.minVersion.trim() && formData.latestVersion.trim();

  // Query to get the rule
  const { data: ruleData, loading: ruleLoading } = useQuery<{ adminGetAppVersionRule: AppVersionRule }>(
    QUERY_ADMIN_GET_APP_VERSION_RULE,
    { 
      variables: { id: ruleId },
      skip: !ruleId,
    }
  );

  // Mutations
  const [updateRule, { loading: updateLoading }] = useMutation(MUTATION_ADMIN_UPDATE_APP_VERSION_RULE, {
    refetchQueries: [QUERY_ADMIN_LIST_APP_VERSION_RULES],
  });

  const [deleteRule, { loading: deleteLoading }] = useMutation(MUTATION_ADMIN_DELETE_APP_VERSION_RULE, {
    refetchQueries: [QUERY_ADMIN_LIST_APP_VERSION_RULES],
  });


  // Update form data when rule is loaded
  useEffect(() => {
    if (ruleData?.adminGetAppVersionRule) {
      const rule = ruleData.adminGetAppVersionRule;
      setOriginalRule(rule);
      setFormData({
        platform: rule.platform,
        minVersion: rule.minVersion,
        latestVersion: rule.latestVersion,
        enforced: rule.enforced,
        enforceAtFutureDate: !rule.enforced && !!rule.forceAt,
        forceAt: rule.forceAt || '',
        message: rule.message || '',
        storeUrl: rule.storeUrl,
        softSnoozeSeconds: rule.softSnoozeSeconds || 3600,
        isActive: rule.isActive,
      });
      
      // Set selected date if forceAt exists
      if (rule.forceAt) {
        setSelectedDate(new Date(rule.forceAt));
      }
    }
  }, [ruleData]);

  const handleUpdate = async () => {
    try {
      setUpdateError(false);
      await updateRule({
        variables: {
          id: ruleId,
          input: {
            minVersion: formData.minVersion.trim(),
            latestVersion: formData.latestVersion.trim(),
            enforced: formData.enforced,
            forceAt: (formData.enforced || !formData.enforceAtFutureDate) ? null : formData.forceAt.trim() || null,
            message: formData.message.trim() || null,
            storeUrl: formData.storeUrl.trim(),
            softSnoozeSeconds: formData.softSnoozeSeconds,
            isActive: formData.isActive,
          },
        },
      });
      setUpdateSuccess(true);
    } catch (error) {
      setUpdateError(true);
    }
  };

  const handleDelete = async () => {
    if (!originalRule) return;

    if (originalRule.isActive) {
      Alert.alert('Cannot Delete', 'Cannot delete an active rule. Deactivate it first.');
      return;
    }

    Alert.alert(
      'Delete Rule',
      'Are you sure you want to delete this app release rule? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleteError(false);
              await deleteRule({ variables: { id: ruleId } });
              setDeleteSuccess(true);
            } catch (error) {
              setDeleteError(true);
            }
          }
        }
      ]
    );
  };


  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (event: any, date?: Date) => {
    if (date) {
      setSelectedDate(date);
      const dateString = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      updateFormData('forceAt', dateString);
    }
  };



  if (ruleLoading) {
    return (
      <Screen>
        <LoadingContainer text="Loading rule..." />
      </Screen>
    );
  }

  if (!originalRule) {
    return (
      <Screen>
        <Card style={styles.errorCard}>
          <Body style={[{ color: colors.danger, fontSize: typography.sizes.body, fontWeight: typography.weights.medium }, styles.errorText]}>
            Rule not found
          </Body>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen scroll={true} contentContainerStyle={[{ gap: layout.containerGap }, styles.content]}>
      <AppReleaseForm 
        formData={formData} 
        updateFormData={updateFormData} 
        activeRules={activeRules} 
        selectedDate={selectedDate} 
        handleDateChange={handleDateChange}
        showPlatformSelector={false}
        showPlatformDisplay={true}
      />

      {/* Update Rule Button - Outside of all cards */}
      <Button
        title="Update Rule"
        onPress={handleUpdate}
        loading={updateLoading}
        disabled={!isFormValid}
        variant="ghost"
        style={styles.updateButton}
        success={updateSuccess}
        successText="Updated!"
        error={updateError}
        errorText="Failed to update"
        onSuccessComplete={() => navigation.goBack()}
        onErrorComplete={() => setUpdateError(false)}
      />

      {/* Delete Button - Outside of card */}
      <Button
        title="Delete Rule"
        onPress={handleDelete}
        loading={deleteLoading}
        variant="danger"
        style={styles.deleteButton}
        success={deleteSuccess}
        successText="Deleted!"
        error={deleteError}
        errorText="Failed to delete"
        onSuccessComplete={() => navigation.goBack()}
        onErrorComplete={() => setDeleteError(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
  },
  updateButton: {
    width: '100%',
  },
  deleteButton: {
    width: '100%',
  },
  errorCard: {
    alignItems: 'center',
  },
  errorText: {
    // fontSize, fontWeight moved to inline style
  },
});
