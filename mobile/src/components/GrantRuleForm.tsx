import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Switch, Alert } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Body, Button, Card, BottomSheet } from './index';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';

type GrantRuleFormProps = {
  type: 'role' | 'permission';
  items: Array<{ id: string; name: string; description?: string }>;
  granterRoleName?: string;
  showAllOption?: boolean;
  onSubmit: (input: {
    scope: 'ALL' | 'SPECIFIC';
    itemId?: string;
    canAssign: boolean;
    canRevoke: boolean;
    canManage?: boolean;
  }) => void;
};

export default function GrantRuleForm({ type, items, granterRoleName = 'Admin', showAllOption = true, onSubmit }: GrantRuleFormProps) {
  const { colors, layout, borderRadius } = useTheme();
  const [scope, setScope] = useState<'ALL' | 'SPECIFIC'>('SPECIFIC');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [canAssign, setCanAssign] = useState(true);
  const [canRevoke, setCanRevoke] = useState(true);
  const [canManage, setCanManage] = useState(false);
  const [isBottomSheetVisible, setIsBottomSheetVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  

  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setSubmitError(false);
    setErrorMessage('');
    
    try {
      // Check if we need confirmation for global manage
      if (scope === 'ALL' && canManage && type === 'role') {
        Alert.alert(
          `Make ${granterRoleName} a global role governor?`,
          `This rule lets users with ${granterRoleName} change delegation rules for **all roles** (assign, revoke, and manage capabilities across the system). This is a powerful setting intended for super-admins and should be tightly controlled.\n\n• Applies to every role, present and future\n• Enables editing of delegation rules (governance)\n• Consider using a specific role instead if possible`,
          [
            {
              text: 'Go Back',
              style: 'cancel',
              onPress: () => {
                setIsSubmitting(false);
              }
            },
            {
              text: 'Create Global Grant Rule',
              style: 'destructive',
              onPress: async () => {
                try {
                  await onSubmit({
                    scope,
                    itemId: selectedItemId,
                    canAssign,
                    canRevoke,
                    canManage: type === 'role' ? canManage : undefined,
                  });
                  setSubmitSuccess(true);
                } catch (error) {
                  setSubmitError(true);
                  setErrorMessage(error instanceof Error ? error.message : 'Failed to create grant rule');
                } finally {
                  setIsSubmitting(false);
                }
              }
            }
          ]
        );
      } else {
        try {
          await onSubmit({
            scope,
            itemId: selectedItemId,
            canAssign,
            canRevoke,
            canManage: type === 'role' ? canManage : undefined,
          });
          setSubmitSuccess(true);
        } catch (error) {
          setSubmitError(true);
          setErrorMessage(error instanceof Error ? error.message : 'Failed to create grant rule');
        } finally {
          setIsSubmitting(false);
        }
      }
    } catch (error) {
      setSubmitError(true);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to create grant rule');
      setIsSubmitting(false);
    }
  };

  const isFormValid = (scope === 'ALL' || (scope === 'SPECIFIC' && selectedItemId)) && (canAssign || canRevoke || (type === 'role' ? canManage : true));

  const formatItemName = (item: any) => {
    if (type === 'role') {
      return item.name;
    }
    return item.name.replace(/^ADMIN_/, '').replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
  };

  const selectedOption = scope === 'ALL' 
    ? { name: `All ${type === 'role' ? 'roles' : 'permissions'} (global)`, description: 'Applies across the entire system. Use only when truly necessary.' }
    : (() => {
        const found = items.find(it => it.id === selectedItemId);
        return found ? { ...found, name: formatItemName(found) } : null;
      })();

  const selectOption = (optionValue: string) => {
    if (optionValue === 'ALL') {
      setScope('ALL');
      setSelectedItemId('');
    } else {
      setScope('SPECIFIC');
      setSelectedItemId(optionValue);
    }
    setIsBottomSheetVisible(false);
  };

  return (
    <View style={[{ gap: layout.formGap }, styles.formContainer]}>
      {/* Header */}
      <Card>
        <View style={styles.headerSection}>
          <Body style={[{ color: colors.text }, styles.headerTitle]}>
            {granterRoleName} Role
          </Body>
          <Body style={[{ color: colors.text }, styles.headerText]}>
            This rule defines what members of the <Body style={styles.boldText}>{granterRoleName}</Body> role are allowed to do to other roles in the system.
          </Body>
        </View>
      </Card>

      {/* Scope Selection */}
      <Card>
        <View style={[{ gap: layout.formGap }, styles.formSection]}>
          <Body style={[{ color: colors.text }, styles.formLabel]}>Scope</Body>
          <Body style={[{ color: colors.mutedText }, styles.helperText]}>
            Choose which {type === 'role' ? 'roles' : 'permissions'} this grant rule targets.
          </Body>
          
          {/* Scope Selection Button */}
          <Pressable
            style={[{ borderColor: colors.border, borderRadius: borderRadius.md }, styles.scopeButton]}
            onPress={() => setIsBottomSheetVisible(true)}
          >
            <View style={styles.selectedOptionContent}>
              <Body style={[{ color: colors.text }, styles.selectedOptionLabel]}>
                {selectedOption?.name || 'Select...'}
              </Body>
              {selectedOption?.description && (
                <Body style={[{ color: colors.mutedText }, styles.selectedOptionDescription]}>
                  {selectedOption.description}
                </Body>
              )}
            </View>
            <FontAwesome6
              name="chevron-down"
              iconStyle="solid"
              size={16} 
              color={colors.mutedText} 
            />
          </Pressable>
          
          {/* Global Scope Warning */}
          {scope === 'ALL' && (
            <View style={[{ backgroundColor: colors.danger + '10', borderColor: colors.danger + '30', borderRadius: borderRadius.md }, styles.warningBox]}>
              <FontAwesome6 name="triangle-exclamation" iconStyle="solid" size={16} color={colors.danger} />
              <Body style={[{ color: colors.danger }, styles.warningText]}>
                This grants {granterRoleName} power over every {type === 'role' ? 'role' : 'permission'} in the system.
              </Body>
            </View>
          )}
        </View>
      </Card>

      {/* Actions Section */}
      <Card>
        <View style={[{ gap: layout.formGap }, styles.formSection]}>
          <Body style={[{ color: colors.text }, styles.formLabel]}>Actions</Body>
          <Body style={[{ color: colors.mutedText }, styles.helperText]}>
            Enable what users with {granterRoleName} can do on the targeted role(s).
          </Body>
          <View style={[{ gap: layout.formGap }, styles.togglesContainer]}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleLabelContainer}>
                <Body style={[{ color: colors.text }, styles.toggleLabel]}>Can Assign</Body>
                <Body style={[{ color: colors.mutedText }, styles.toggleHelp]}>
                  Allow users with {granterRoleName} to assign the targeted role(s) to users.
                </Body>
              </View>
              <Switch
                value={canAssign}
                onValueChange={setCanAssign}
              />
            </View>

            <View style={styles.toggleRow}>
              <View style={styles.toggleLabelContainer}>
                <Body style={[{ color: colors.text }, styles.toggleLabel]}>Can Revoke</Body>
                <Body style={[{ color: colors.mutedText }, styles.toggleHelp]}>
                  Allow users with {granterRoleName} to remove the targeted role(s) from users.
                </Body>
              </View>
              <Switch
                value={canRevoke}
                onValueChange={setCanRevoke}
              />
            </View>

            {type === 'role' && (
              <View style={styles.toggleRow}>
                <View style={styles.toggleLabelContainer}>
                  <Body style={[{ color: colors.text }, styles.toggleLabel]}>Can Manage</Body>
                  <Body style={[{ color: colors.mutedText }, styles.toggleHelp]}>
                    Allow users with {granterRoleName} to modify or delete delegation rules where {granterRoleName} is the granter (governance power). Use sparingly.
                  </Body>
                </View>
                <Switch
                  value={canManage}
                  onValueChange={setCanManage}
                />
              </View>
            )}
          </View>
          
                  {/* Validation Error */}
        {!canAssign && !canRevoke && (type === 'role' ? !canManage : false) && (
          <View style={[{ backgroundColor: colors.danger + '10', borderColor: colors.danger + '30', borderRadius: borderRadius.md }, styles.errorBox]}>
            <Body style={[{ color: colors.danger }, styles.errorText]}>
              At least one action (Assign, Revoke{type === 'role' ? ', or Manage' : ''}) must be enabled.
            </Body>
          </View>
        )}
        </View>
      </Card>


      {/* Form Actions */}
      <View style={styles.formActions}>
        <Button 
          title="Create Grant Rule" 
          onPress={handleSubmit}
          loading={isSubmitting}
          success={submitSuccess}
          successText="Grant Rule Created!"
          error={submitError}
          errorText={errorMessage}
          disabled={!isFormValid || isSubmitting}
          style={styles.fullWidthButton}
          onSuccessComplete={() => {
            setSubmitSuccess(false);
          }}
          onErrorComplete={() => {
            setSubmitError(false);
            setErrorMessage('');
          }}
        />
      </View>

      {/* Bottom Sheet */}
      <BottomSheet
        visible={isBottomSheetVisible}
        onClose={() => setIsBottomSheetVisible(false)}
      >
        {/* All Roles Option */}
        {showAllOption && (
          <Pressable
            accessibilityRole="button"
            onPress={() => selectOption('ALL')}
            style={styles.optionRow}
          >
            <View style={styles.optionText}>
              <Body style={styles.optionTitle}>All {type === 'role' ? 'roles' : 'permissions'} (global)</Body>
              <Body style={styles.optionDesc}>Applies across the entire system. Use only when truly necessary.</Body>
            </View>
            {scope === 'ALL' && (
              <FontAwesome6 name="check" iconStyle="solid" size={18} color="#22C55E" />
            )}
          </Pressable>
        )}
        
        {/* Individual Roles */}
        {items.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            onPress={() => selectOption(item.id)}
            style={styles.optionRow}
          >
            <View style={styles.optionText}>
              <Body style={styles.optionTitle}>
                {formatItemName(item)}
              </Body>
              <Body style={styles.optionDesc}>
                {item.description || `Applies only to this ${type === 'role' ? 'role' : 'permission'}.`}
              </Body>
            </View>
            {selectedItemId === item.id && (
              <FontAwesome6 name="check" iconStyle="solid" size={18} color="#22C55E" />
            )}
          </Pressable>
        ))}
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  formContainer: { },
  headerSection: {
    gap: 8
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24
  },
  headerText: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20
  },
  boldText: {
    fontWeight: 'bold'
  },
  formSection: { position: 'relative' },
  formLabel: { fontSize: 14, fontWeight: '500', marginBottom: 4 },
  helperText: { 
    fontSize: 12, 
    marginBottom: 8,
    lineHeight: 16
  },
  warningBox: {
    padding: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 8
  },
  warningText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 16
  },
  errorBox: {
    padding: 12,
    borderWidth: 1,
    marginTop: 8
  },
  errorText: {
    fontSize: 12,
    lineHeight: 16
  },
  scopeButton: { 
    borderWidth: 1, 
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  selectedOptionContent: { flex: 1 },
  selectedOptionLabel: { fontSize: 14, fontWeight: '500', marginBottom: 2 },
  selectedOptionDescription: { fontSize: 12 },
  optionRow: { 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between' 
  },
  optionTitle: { fontWeight: '600' },
  optionDesc: { opacity: 0.7, marginTop: 2 },
  optionText: { flex: 1, paddingRight: 12 },
  togglesContainer: { },
  toggleRow: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    justifyContent: 'space-between',
    gap: 12
  },
  toggleLabelContainer: { flex: 1 },
  toggleLabel: { fontSize: 14, fontWeight: '500', marginBottom: 4 },
  toggleHelp: { fontSize: 12, lineHeight: 16 },
  formActions: { 
    marginTop: 8 
  },
  fullWidthButton: {
    width: '100%'
  },
});
