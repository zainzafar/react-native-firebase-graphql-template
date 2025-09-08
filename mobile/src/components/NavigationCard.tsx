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
  const { colors, borderRadius } = useTheme();
  
  return (
    <Card style={styles.cardContainer}>
      <Pressable 
        onPress={onPress}
        disabled={disabled}
        style={[
          styles.navigationPressable,
          disabled && styles.disabled
        ]}
      >
        <View style={styles.navigationContent}>
          <View style={styles.navigationLeft}>
            <View style={[
              styles.iconContainer, 
              { backgroundColor: iconBackgroundColor || '#007AFF' + '20', borderRadius: borderRadius.lg }
            ]}>
              <FontAwesome6 
                name={icon as any} 
                iconStyle="solid" 
                size={20} 
                color={iconColor || '#007AFF'} 
              />
            </View>
            <View style={styles.textContainer}>
              <Body style={[{ color: colors.text }, styles.navigationTitle]}>{title}</Body>
              <Body style={[{ color: colors.mutedText }, styles.navigationDescription]}>{description}</Body>
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
  disabled: { opacity: 0.5 },
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
