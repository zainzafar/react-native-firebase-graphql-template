import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Body, Card } from '../../components';
import { useTheme } from '../../theme/ThemeProvider';
import { useNavigation } from '@react-navigation/native';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';

export default function AdminHomeScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <Card style={styles.card}> 
        <Pressable onPress={() => navigation.navigate('AdminManageUsers')} style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <FontAwesome6 name="users" iconStyle="solid" size={20} color={colors.text} />
            <Body style={styles.menuItemText}>Manage Users</Body>
          </View>
          <FontAwesome6 name="chevron-right" iconStyle="solid" size={16} color={colors.mutedText} />
        </Pressable>
      </Card>

      <Card style={styles.card}> 
        <Pressable onPress={() => navigation.navigate('AdminDebug')} style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <FontAwesome6 name="wrench" iconStyle="solid" size={20} color={colors.text} />
            <Body style={styles.menuItemText}>Debug</Body>
          </View>
          <FontAwesome6 name="chevron-right" iconStyle="solid" size={16} color={colors.mutedText} />
        </Pressable>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 16, gap: 16 },
  header: { paddingBottom: 8, paddingLeft: 5 },
  card: { padding: 12 },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, paddingHorizontal: 4 },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  menuItemText: { fontSize: 16, fontWeight: '500' },
});


