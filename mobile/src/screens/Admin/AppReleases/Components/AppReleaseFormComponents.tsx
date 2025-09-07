import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, Switch } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../../../../theme/ThemeProvider';
import { Body, Button, Input } from '../../../../components';
import { useAppUpdateGate } from '../../../../update/useAppUpdateGate';

type AppPlatform = 'ios' | 'android';

interface FormData {
  platform?: AppPlatform;
  minVersion: string;
  latestVersion: string;
  enforced: boolean;
  enforceAtFutureDate: boolean;
  forceAt: string;
  message: string;
  storeUrl: string;
  softSnoozeSeconds: number;
  isActive: boolean;
}

interface ActiveRules {
  ios: any;
  android: any;
}

interface AppReleaseFormComponentsProps {
  formData: FormData;
  updateFormData: (field: string, value: any) => void;
  activeRules: ActiveRules;
  selectedDate: Date;
  handleDateChange: (event: any, date?: Date) => void;
}

// Individual component functions (kept for internal use)
const PlatformSelector = ({ formData, updateFormData }: Pick<AppReleaseFormComponentsProps, 'formData' | 'updateFormData'>) => {
  const { colors, layout, typography } = useTheme();

  return (
    <View style={styles.formSection}>
      <Body style={[{ color: colors.text, fontSize: typography.sizes.label, fontWeight: typography.weights.semiBold }, styles.formLabel]}>Platform *</Body>
      <View style={[{ gap: layout.containerGap }, styles.platformButtons]}>
        {(['ios', 'android'] as AppPlatform[]).map((platform) => (
          <Button
            key={platform}
            title={platform.toUpperCase()}
            onPress={() => updateFormData('platform', platform)}
            variant={formData.platform === platform ? 'primary' : 'ghost'}
            style={styles.platformButton}
            icon={platform === 'ios' ? 'apple' : 'android'}
            iconStyle="brand"
          />
        ))}
      </View>
    </View>
  );
};

const PlatformDisplay = ({ formData }: Pick<AppReleaseFormComponentsProps, 'formData'>) => {
  const { colors, layout, typography } = useTheme();

  if (!formData.platform) return null;

  return (
    <View style={styles.formSection}>
      <Body style={[{ color: colors.text, fontSize: typography.sizes.label, fontWeight: typography.weights.semiBold }, styles.formLabel]}>Platform</Body>
      <View style={[{ gap: layout.containerGap }, styles.platformButtons]}>
        <Button
          title={formData.platform.toUpperCase()}
          variant="primary"
          style={styles.platformButton}
          icon={formData.platform === 'ios' ? 'apple' : 'android'}
          iconStyle="brand"
          disabled={true}
        />
      </View>
    </View>
  );
};

const FormToggle = ({ field, label, description, formData, updateFormData }: {
  field: string;
  label: string;
  description?: string;
  formData: FormData;
  updateFormData: (field: string, value: any) => void;
}) => {
  const { colors, typography } = useTheme();

  return (
    <View style={styles.toggleSection}>
      <View style={styles.toggleRow}>
        <View style={styles.toggleInfo}>
          <Body style={[{ color: colors.text, fontSize: typography.sizes.label, fontWeight: typography.weights.semiBold }, styles.toggleLabel]}>{label}</Body>
          {description && (
            <Body style={[{ color: colors.mutedText, fontSize: typography.sizes.caption, lineHeight: typography.lineHeights.tight }, styles.toggleDescription]}>{description}</Body>
          )}
        </View>
        <Switch
          value={formData[field as keyof FormData] as boolean}
          onValueChange={(value) => updateFormData(field, value)}
        />
      </View>
    </View>
  );
};

const MinimumVersionField = ({ formData, updateFormData }: Pick<AppReleaseFormComponentsProps, 'formData' | 'updateFormData'>) => {
  const { colors, typography } = useTheme();

  return (
    <View style={styles.formSection}>
      <Body style={[{ color: colors.text, fontSize: typography.sizes.label, fontWeight: typography.weights.semiBold }, styles.formLabel]}>Minimum Version *</Body>
      <Body style={[{ color: colors.mutedText, fontSize: typography.sizes.caption, lineHeight: typography.lineHeights.tight }, styles.helperText]}>
        The minimum app version required (e.g., 1.0.0)
      </Body>
      <Input
        value={formData.minVersion}
        onChangeText={(text) => updateFormData('minVersion', text)}
        placeholder="1.0.0"
      />
    </View>
  );
};

const LatestVersionField = ({ formData, updateFormData, activeRules }: Pick<AppReleaseFormComponentsProps, 'formData' | 'updateFormData' | 'activeRules'>) => {
  const { colors, typography } = useTheme();

  return (
    <View style={styles.formSection}>
      <Body style={[{ color: colors.text, fontSize: typography.sizes.label, fontWeight: typography.weights.semiBold }, styles.formLabel]}>Latest Version *</Body>
      <Body style={[{ color: colors.mutedText, fontSize: typography.sizes.caption, lineHeight: typography.lineHeights.tight }, styles.helperText]}>
        {(() => {
          if (formData.platform) {
            const activeRule = activeRules[formData.platform];
            if (activeRule) {
              return `The latest available app version (currently active: v${activeRule.latestVersion})`;
            }
          }
          return 'The latest available app version (e.g., 1.2.0)';
        })()}
      </Body>
      <Input
        value={formData.latestVersion}
        onChangeText={(text) => updateFormData('latestVersion', text)}
        placeholder="1.2.0"
      />
    </View>
  );
};

const StoreUrlField = ({ formData, updateFormData }: Pick<AppReleaseFormComponentsProps, 'formData' | 'updateFormData'>) => {
  const { colors, typography } = useTheme();
  const { getCachedSettings } = useAppUpdateGate();
  
  const getDefaultPlaceholder = (platform?: AppPlatform) => {
    if (platform === 'ios') return 'https://apps.apple.com/app/id123456';
    if (platform === 'android') return 'https://play.google.com/store/apps/details?id=com.example.app';
    return 'https://apps.apple.com/app/id123456'; // fallback
  };
  
  const [placeholder, setPlaceholder] = useState(getDefaultPlaceholder(formData.platform));

  useEffect(() => {
    const loadPlaceholder = async () => {
      try {
        const cachedSettings = await getCachedSettings();
        if (cachedSettings?.storeUrl) {
          setPlaceholder(cachedSettings.storeUrl);
        } else {
          setPlaceholder(getDefaultPlaceholder(formData.platform));
        }
      } catch (error) {
        console.warn('Failed to load cached store URL:', error);
        setPlaceholder(getDefaultPlaceholder(formData.platform));
      }
    };
    loadPlaceholder();
  }, [getCachedSettings, formData.platform]);

  return (
    <View style={styles.formSection}>
      <Body style={[{ color: colors.text, fontSize: typography.sizes.label, fontWeight: typography.weights.semiBold }, styles.formLabel]}>Store URL</Body>
      <Body style={[{ color: colors.mutedText, fontSize: typography.sizes.caption, lineHeight: typography.lineHeights.tight }, styles.helperText]}>
        The app store URL for downloading the update
      </Body>
      <Input
        value={formData.storeUrl}
        onChangeText={(text) => updateFormData('storeUrl', text)}
        placeholder={placeholder}
        keyboardType="url"
      />
    </View>
  );
};

const SoftSnoozeField = ({ formData, updateFormData }: Pick<AppReleaseFormComponentsProps, 'formData' | 'updateFormData'>) => {
  const { colors, typography } = useTheme();

  return (
    <View style={styles.formSection}>
      <Body style={[{ color: colors.text, fontSize: typography.sizes.label, fontWeight: typography.weights.semiBold }, styles.formLabel]}>Soft Snooze Duration (seconds)</Body>
      <Body style={[{ color: colors.mutedText, fontSize: typography.sizes.caption, lineHeight: typography.lineHeights.tight }, styles.helperText]}>
        How long to snooze soft update prompts (default: 3600 = 1 hour)
      </Body>
      <Input
        value={formData.softSnoozeSeconds.toString()}
        onChangeText={(text) => {
          const num = parseInt(text, 10);
          if (!isNaN(num) && num >= 0) {
            updateFormData('softSnoozeSeconds', num);
          }
        }}
        placeholder="3600"
        keyboardType="numeric"
      />
    </View>
  );
};

const UpdateMessageField = ({ formData, updateFormData }: Pick<AppReleaseFormComponentsProps, 'formData' | 'updateFormData'>) => {
  const { colors, layout, typography } = useTheme();

  return (
    <View style={styles.formSection}>
      <Body style={[{ color: colors.text, fontSize: typography.sizes.label, fontWeight: typography.weights.semiBold }, styles.formLabel]}>Update Message</Body>
      <Body style={[{ color: colors.mutedText, fontSize: typography.sizes.caption, lineHeight: typography.lineHeights.tight }, styles.helperText]}>
        Optional: Message to show users about this update
      </Body>
      <TextInput
        value={formData.message}
        onChangeText={(text) => updateFormData('message', text)}
        placeholder="Bug fixes and new features"
        multiline
        numberOfLines={3}
        style={[layout.textArea, { 
          borderColor: colors.border, 
          color: colors.text,
          backgroundColor: colors.card,
          fontSize: typography.sizes.body,
        }]}
        placeholderTextColor={colors.mutedText}
      />
    </View>
  );
};

const EnforcementDatePicker = ({ formData, selectedDate, handleDateChange }: Pick<AppReleaseFormComponentsProps, 'formData' | 'selectedDate' | 'handleDateChange'>) => {
  const { colors, typography, isDark } = useTheme();

  if (!formData.enforceAtFutureDate) return null;

  return (
    <View style={styles.toggleSection}>
      <View style={styles.toggleRow}>
        <View style={styles.toggleInfo}>
          <Body style={[{ color: colors.text, fontSize: typography.sizes.label, fontWeight: typography.weights.semiBold }, styles.toggleLabel]}>Enforcement Date</Body>
          <Body style={[{ color: colors.mutedText, fontSize: typography.sizes.caption, lineHeight: typography.lineHeights.tight }, styles.toggleDescription]}>
            Date when the update becomes mandatory
          </Body>
        </View>
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={new Date()}
          style={styles.datePickerInline}
          textColor={colors.text}
          themeVariant={isDark ? 'dark' : 'light'}
        />
      </View>
    </View>
  );
};

// Main form component that combines all fields
export const AppReleaseForm = ({ formData, updateFormData, activeRules, selectedDate: _selectedDate, handleDateChange: _handleDateChange, showPlatformSelector = true, showPlatformDisplay = false }: AppReleaseFormComponentsProps & { showPlatformSelector?: boolean; showPlatformDisplay?: boolean }) => {
  const { layout } = useTheme();

  return (
    <View style={[{ gap: layout.containerGap }, styles.formContainer]}>
      {showPlatformSelector && <PlatformSelector formData={formData} updateFormData={updateFormData} />}
      {showPlatformDisplay && <PlatformDisplay formData={formData} />}
      <MinimumVersionField formData={formData} updateFormData={updateFormData} />
      <LatestVersionField formData={formData} updateFormData={updateFormData} activeRules={activeRules} />
      <StoreUrlField formData={formData} updateFormData={updateFormData} />
      <SoftSnoozeField formData={formData} updateFormData={updateFormData} />
      <UpdateMessageField formData={formData} updateFormData={updateFormData} />
      <FormToggle field="isActive" label="Set as Active" description="Whether this rule should be active immediately" formData={formData} updateFormData={updateFormData} />
    </View>
  );
};

// Enforcement section component
export const AppReleaseEnforcement = ({ formData, updateFormData, selectedDate, handleDateChange }: Pick<AppReleaseFormComponentsProps, 'formData' | 'updateFormData' | 'selectedDate' | 'handleDateChange'>) => {
  const { layout } = useTheme();

  return (
    <View style={[{ gap: layout.containerGap }, styles.enforcementContainer]}>
      <FormToggle field="enforced" label="Enforce Immediately" description="Force users to update immediately when they open the app" formData={formData} updateFormData={updateFormData} />
      {!formData.enforced && (
        <>
          <FormToggle field="enforceAtFutureDate" label="Enforce at Future Date" description="Set a specific date when the update becomes mandatory" formData={formData} updateFormData={updateFormData} />
          <EnforcementDatePicker formData={formData} selectedDate={selectedDate} handleDateChange={handleDateChange} />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  formContainer: {
    // Container for form fields with gap
  },
  enforcementContainer: {
    // Container for enforcement fields with gap
  },
  formSection: {
    // Removed marginBottom - now using gap in container
  },
  formLabel: {
    marginBottom: 4,
  },
  helperText: {
    marginBottom: 8,
  },
  platformButtons: {
    flexDirection: 'row',
  },
  platformButton: {
    flex: 1,
  },
  toggleSection: {
    // Removed marginBottom - now using gap in container
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleInfo: {
    flex: 1,
    marginRight: 16,
  },
  toggleLabel: {
    marginBottom: 4,
  },
  toggleDescription: {
    // fontSize, lineHeight moved to inline style
  },
  datePickerInline: {
    flex: 1,
  },
  enforcementTitle: {
    marginBottom: 8,
  },
});
