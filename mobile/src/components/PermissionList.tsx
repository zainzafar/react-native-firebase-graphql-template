import React from 'react';
import { View, StyleSheet } from 'react-native';

import { Body } from './ui';
import { useTheme } from '../theme/ThemeProvider';

import PermissionRow from './PermissionRow';

type Permission = {
  id: string;
  name: string;
  description?: string | null;
};

type PermissionListProps = {
  permissions: Permission[];
  selectedPermissions: string[];
  onPermissionToggle: (permissionId: string, enabled: boolean) => void;
  showDescriptions?: boolean;
  showNames?: boolean;
  helpTexts?: { [permissionId: string]: string | undefined };
  canEnable?: { [permissionId: string]: boolean };
  canDisable?: { [permissionId: string]: boolean };
};

export default function PermissionList({ 
  permissions, 
  selectedPermissions, 
  onPermissionToggle, 
  showDescriptions = true,
  showNames = false,
  helpTexts = {},
  canEnable = {},
  canDisable = {}
}: PermissionListProps) {
  const { layout } = useTheme();


  // Smart grouping logic (exactly like AdminCreateRoleScreen.tsx)
  const groupPermissions = (permissionList: Permission[]) => {
    const userManagement: Permission[] = [];
    const system: Permission[] = [];
    
    permissionList.forEach(p => {
      if (p.name.startsWith('ADMIN_DEBUG') || 
          p.name.includes('ROLE') || 
          p.name.includes('PERMISSION')) {
        system.push(p);
      } else {
        userManagement.push(p);
      }
    });
    
    return { userManagement, system };
  };

  const { userManagement, system } = groupPermissions(permissions);

    const renderPermissionSection = (title: string, permissionList: Permission[]) => {
    if (permissionList.length === 0) return null;
    
    return (
      <View style={styles.permissionSection}>
        <Body style={styles.sectionTitle}>{title}</Body>
        <View style={styles.sectionDivider} />
        <View style={styles.permissionsContainer}>
          {permissionList.map((permission) => (
            <PermissionRow
              key={permission.id}
              permission={permission}
              isSelected={selectedPermissions.includes(permission.id)}
              onToggle={(enabled) => onPermissionToggle(permission.id, enabled)}
              showDescription={showDescriptions}
              showName={showNames}
              helpText={helpTexts[permission.id]}
              canEnable={canEnable[permission.id] ?? true}
              canDisable={canDisable[permission.id] ?? true}
            />
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={[{ gap: layout.sectionGap }, styles.container]}>
      {renderPermissionSection('User Management', userManagement)}
      {renderPermissionSection('System', system)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { },
  sectionTitle: { 
    fontSize: 16, 
    fontWeight: '700', 
    marginBottom: 8,
    color: '#9CA3AF' // lighter mutedText for better visibility
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#374151', // dark gray divider
    marginBottom: 12,
  },
  permissionSection: { marginBottom: 0 },
  permissionsContainer: { gap: 0 },
});

