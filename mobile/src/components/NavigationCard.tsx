import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Body, Card } from './ui';
import { useTheme } from '../theme/ThemeProvider';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';

interface NavigationCardProps {
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
  disabled?: boolean;
  iconColor?: string;
  iconBackgroundColor?: string;
}

export default function NavigationCard({
  title,
  description,
  icon,
  onPress,
  disabled = false,
  iconColor,
  iconBackgroundColor,
}: NavigationCardProps) {
  const { colors } = useTheme();
  
  return (
    <Card style={styles.cardContainer}>
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
            <View style={[
              styles.iconContainer, 
              { backgroundColor: iconBackgroundColor || '#007AFF' + '20' }
            ]}>
              <FontAwesome6 
                name={icon as any} 
                iconStyle="solid" 
                size={20} 
                color={iconColor || '#007AFF'} 
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
}

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: 0,
  },
  navigationPressable: { 
    // No padding needed - Card component already provides it
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
  textContainer: { 
    flex: 1,
    paddingRight: 16 
  },
  navigationTitle: { 
    fontSize: 16, 
    fontWeight: '600', 
    marginBottom: 4,
  },
  navigationDescription: { 
    fontSize: 14, 
    lineHeight: 18,
  },
});
