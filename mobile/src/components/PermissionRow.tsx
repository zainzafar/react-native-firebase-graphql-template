import React from 'react';
import { View, StyleSheet, Switch } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Body } from './ui';

type Permission = {
  id: string;
  name: string;
  description?: string | null;
};

type PermissionRowProps = {
  permission: Permission;
  isSelected: boolean;
  onToggle: (enabled: boolean) => void;
  showDescription?: boolean;
  showName?: boolean;
  helpText?: string;
  canEnable?: boolean;
  canDisable?: boolean;
};

export default function PermissionRow({ 
  permission, 
  isSelected, 
  onToggle, 
  showDescription = true,
  showName = false,
  helpText,
  canEnable = true,
  canDisable = true
}: PermissionRowProps) {
  const { colors, borderRadius } = useTheme();
  

  return (
    <View 
      style={[{ borderRadius: borderRadius.md }, styles.permissionItem]}
    >
      <View style={styles.permissionInfo}>
        {showName && (
          <Body style={[{ color: colors.text }, styles.permissionName]}>
            {permission.name}
          </Body>
        )}
        {showDescription && permission.description && (
          <Body style={[
            { 
              color: showName ? colors.mutedText : colors.text,
              fontStyle: showName ? 'italic' : 'normal',
              fontSize: showName ? 12 : 14
            },
            styles.permissionDescription
          ]}>
            {permission.description}
          </Body>
        )}
        {helpText && (
          <Body style={[{ color: colors.mutedText }, styles.helpText]}>
            {helpText}
          </Body>
        )}
      </View>
              <Switch
          value={isSelected}
          onValueChange={(enabled) => {
            onToggle(enabled);
          }}
          disabled={isSelected ? !canDisable : !canEnable}
        />
    </View>
  );
}

const styles = StyleSheet.create({
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginBottom: 4,
  },
  permissionInfo: {
    flex: 1,
    marginRight: 16,
  },
  permissionName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  permissionDescription: {
    fontSize: 14,
    fontWeight: '400',
  },
  helpText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 2,
  },
});
