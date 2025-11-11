import { router } from 'expo-router';
import { Shield } from 'lucide-react-native';
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Colors from '@/constants/colors';

export default function AdminFooter() {
  const handleAdminLogin = () => {
    router.push('/admin-auth');
  };
  
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={handleAdminLogin}
        activeOpacity={0.6}
        accessibilityRole="button"
        accessibilityLabel="Admin login"
      >
        <Shield size={12} color={Colors.light.mediumGray} />
        <Text style={styles.text}>Admin</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
  },
  text: {
    fontSize: 10,
    fontWeight: '500' as const,
    color: Colors.light.mediumGray,
  },
});
