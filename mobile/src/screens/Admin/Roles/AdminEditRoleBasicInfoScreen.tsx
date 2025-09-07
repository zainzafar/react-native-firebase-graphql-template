import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TextInput, Animated } from 'react-native';
import { useTheme } from '../../../theme/ThemeProvider';

import { useQuery, useMutation } from '@apollo/client/react';
import { Body, Button, Card, Input, Screen, LoadingContainer } from '../../../components';
import { useRoute } from '@react-navigation/native';
import {
  QUERY_ADMIN_GET_ROLE,
  MUTATION_ADMIN_UPDATE_ROLE,
} from '../../../graphql/operations';

type Role = {
  id: string;
  name: string;
  description?: string;
};

export default function AdminEditRoleBasicInfo() {
  const { colors, layout, borderRadius } = useTheme();
  const route = useRoute<any>();
  
  const roleId = route.params?.roleId;
  

  
  // State
  const [editData, setEditData] = useState({ name: '', description: '' });
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  // Queries
  const { data: roleData, loading: roleLoading } = useQuery<{ adminGetRole: Role }>(
    QUERY_ADMIN_GET_ROLE,
    { 
      variables: { id: roleId },
      skip: !roleId 
    }
  );

  // Mutations
  const [updateRole] = useMutation(MUTATION_ADMIN_UPDATE_ROLE, {
    refetchQueries: [
      { query: QUERY_ADMIN_GET_ROLE, variables: { id: roleId } },
    ],
  });

  const role = roleData?.adminGetRole;

  // Initialize edit data when role data loads
  useEffect(() => {
    if (role) {
      setEditData({
        name: role.name,
        description: role.description || '',
      });
    }
  }, [role]);

  // Animate error messages when they appear
  useEffect(() => {
    if (saveError) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [saveError, fadeAnim, scaleAnim]);

  const handleSaveRole = async () => {
    try {
      setSaveLoading(true);
      setSaveSuccess(false);
      // Reset button state when starting new save attempt
      // Clear error temporarily to reset button state
      setSaveError(null);
      
      await updateRole({ variables: { id: roleId, input: editData } });
      setSaveSuccess(true);
      // Only clear error on successful save
    } catch (error: any) {
      console.error('Failed to update role:', error);
      setSaveError(error?.message || 'Failed to update role');
    } finally {
      setSaveLoading(false);
    }
  };



  if (roleLoading) {
    return (
      <Screen>
        <LoadingContainer text="Loading role details..." />
      </Screen>
    );
  }

  if (!role) {
    return (
      <Screen>
        <Card style={styles.errorCard}>
          <Body style={[{ color: colors.mutedText }, styles.centerText]}>Role not found</Body>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
        <Card>
          <View style={styles.sectionHeader}>
            <Body style={styles.sectionTitle}>Role Information</Body>
          </View>
          <View style={[{ gap: layout.formGap }, styles.form]}>
            <Input 
              value={editData.name} 
              onChangeText={(text) => setEditData(prev => ({ ...prev, name: text }))}
              placeholder="Role name" 
            />
            <TextInput
              value={editData.description}
              onChangeText={(text) => setEditData(prev => ({ ...prev, description: text }))}
              placeholder="Role description"
              multiline
              numberOfLines={3}
              textContentType="none"
              autoComplete="off"
              style={[{ 
                backgroundColor: colors.card, 
                borderColor: colors.border,
                borderRadius: borderRadius.md,
                color: colors.text 
              }, styles.textArea]}
              placeholderTextColor={colors.mutedText}
            />
            <Button 
              title="Save Changes" 
              onPress={handleSaveRole}
              loading={saveLoading}
              success={saveSuccess}
              successText="Role Updated!"
              error={!!saveError}
              errorText="Please try again"


              disabled={!editData.name.trim()}
              variant="ghost"
              style={styles.button}
            />
            {saveError && (
              <Animated.View 
                style={[
                  {
                    opacity: fadeAnim,
                    transform: [{ scale: scaleAnim }],
                  },
                  styles.messageContainer
                ]}
              >
                <Body style={styles.errorText}>{saveError}</Body>
              </Animated.View>
            )}
          </View>
        </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionHeader: { marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600' },
  form: { },
  button: { marginTop: 12 },
  textArea: { 
    paddingVertical: 12, 
    paddingHorizontal: 16, 
    borderWidth: 1, 
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top'
  },
  messageContainer: { 
    alignItems: 'center',
    marginTop: 4,
    minHeight: 20,
  },
  errorText: { 
    color: '#EF4444', 
    fontSize: 14,
    textAlign: 'center',
  },
  errorCard: { marginTop: 32, paddingVertical: 32 },
  centerText: { textAlign: 'center' },
});
