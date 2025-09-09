import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { useMutation } from '@apollo/client/react';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NavigationProp, RouteProp } from '@react-navigation/native';
import { useTheme } from '../../../theme/ThemeProvider';
import { Screen, Button } from '../../../components';
import { MUTATION_ADMIN_CREATE_APP_VERSION_RULE, QUERY_ADMIN_LIST_APP_VERSION_RULES } from '../../../graphql/operations';
import type { AppVersionRule } from '../../../generated/graphql';
import {
  AppReleaseForm,
} from './Components';

type AppPlatform = 'ios' | 'android';

type AdminCreateAppReleaseScreenParams = {
  activeRules?: { ios: AppVersionRule | null; android: AppVersionRule | null };
};

export default function AdminCreateAppReleaseScreen() {
  const { layout } = useTheme();
  const navigation = useNavigation<NavigationProp<Record<string, object | undefined>>>();
  const route = useRoute<RouteProp<Record<string, object | undefined>, 'AdminCreateAppRelease'>>();
  const activeRules = (route.params as AdminCreateAppReleaseScreenParams)?.activeRules || { ios: null, android: null };
  
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

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [createSuccess, setCreateSuccess] = useState(false);
  const [createError, setCreateError] = useState(false);

  const [createRule, { loading }] = useMutation(MUTATION_ADMIN_CREATE_APP_VERSION_RULE, {
    refetchQueries: [QUERY_ADMIN_LIST_APP_VERSION_RULES],
  });

  // Check if form is valid for button disabled state
  const isFormValid = formData.minVersion.trim() && formData.latestVersion.trim();

  const handleSubmit = async () => {
    try {
      setCreateError(false);
      await createRule({
        variables: {
          input: {
            platform: formData.platform,
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
      setCreateSuccess(true);
    } catch {
      setCreateError(true);
    }
  };

  const updateFormData = (field: string, value: string | boolean | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (event: unknown, date?: Date) => {
    if (date) {
      setSelectedDate(date);
      const dateString = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      updateFormData('forceAt', dateString);
    }
  };



  return (
    <Screen scroll={true} contentContainerStyle={[{ gap: layout.containerGap }, styles.content]}>
      <AppReleaseForm 
        formData={formData} 
        updateFormData={updateFormData} 
        activeRules={activeRules} 
        selectedDate={selectedDate} 
        handleDateChange={handleDateChange}
        showPlatformSelector={true}
      />

      {/* Create Rule Button - Outside of all cards */}
      <Button
        title="Create Rule"
        onPress={handleSubmit}
        loading={loading}
        disabled={!isFormValid}
        style={styles.createButton}
        success={createSuccess}
        successText="Created!"
        error={createError}
        errorText="Failed to create"
        onSuccessComplete={() => navigation.goBack()}
        onErrorComplete={() => setCreateError(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
  },
  createButton: {
    width: '100%',
  },
});
