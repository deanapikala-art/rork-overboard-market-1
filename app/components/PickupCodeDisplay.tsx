import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';
import Colors from '../../constants/colors';

interface PickupCodeDisplayProps {
  code: string;
  orderNumber: string;
  isPickedUp: boolean;
}

export default function PickupCodeDisplay({ code, orderNumber, isPickedUp }: PickupCodeDisplayProps) {
  if (isPickedUp) {
    return (
      <View style={styles.container}>
        <View style={[styles.card, styles.completedCard]}>
          <View style={styles.header}>
            <ShieldCheck size={24} color="#22C55E" />
            <Text style={styles.completedTitle}>Order Picked Up</Text>
          </View>
          <Text style={styles.completedText}>
            This order has been successfully picked up and confirmed.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <ShieldCheck size={24} color={Colors.nautical.teal} />
          <Text style={styles.title}>Pickup Confirmation Code</Text>
        </View>
        
        <Text style={styles.description}>
          Show this code to the vendor when picking up your order.
        </Text>

        <View style={styles.codeContainer}>
          <Text style={styles.codeLabel}>Your Code</Text>
          <View style={styles.codeBubble}>
            <Text style={styles.code}>{code}</Text>
          </View>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            🛡️ For your safety, only share this code with the vendor at pickup time.
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.instructions}>
          <Text style={styles.instructionsTitle}>Pickup Instructions:</Text>
          <Text style={styles.instructionItem}>1. Arrive at the pickup location</Text>
          <Text style={styles.instructionItem}>2. Verify vendor identity</Text>
          <Text style={styles.instructionItem}>3. Share your 6-digit code</Text>
          <Text style={styles.instructionItem}>4. Receive your order</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: Colors.nautical.teal,
  },
  completedCard: {
    borderColor: '#22C55E',
    backgroundColor: '#F0FDF4',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  completedTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#22C55E',
  },
  description: {
    fontSize: 14,
    color: Colors.light.muted,
    marginBottom: 20,
    lineHeight: 20,
  },
  completedText: {
    fontSize: 14,
    color: '#16A34A',
    lineHeight: 20,
  },
  codeContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  codeLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.light.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  codeBubble: {
    backgroundColor: Colors.nautical.teal,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
  },
  code: {
    fontSize: 36,
    fontWeight: '800' as const,
    color: Colors.white,
    letterSpacing: 8,
    fontFamily: 'monospace' as const,
  },
  infoBox: {
    backgroundColor: Colors.nautical.sandLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 13,
    color: Colors.light.text,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginVertical: 16,
  },
  instructions: {
    gap: 8,
  },
  instructionsTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  instructionItem: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
    paddingLeft: 8,
  },
});
