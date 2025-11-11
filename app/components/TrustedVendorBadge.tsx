import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Shield, CheckCircle, Award, Info } from 'lucide-react-native';

interface TrustedVendorBadgeProps {
  trustScore: number;
  trustTier: string;
  verifiedVendor: boolean;
  compact?: boolean;
  showTooltip?: boolean;
  onPress?: () => void;
}

export default function TrustedVendorBadge({
  trustScore,
  trustTier,
  verifiedVendor,
  compact = false,
  showTooltip = false,
  onPress,
}: TrustedVendorBadgeProps) {
  const getTierData = () => {
    switch (trustTier) {
      case 'Trusted Vendor':
        return {
          color: '#4C7D7C',
          icon: <Award size={compact ? 14 : 16} color="#FFF" />,
          text: 'Trusted Vendor',
          tooltip:
            'High reliability, excellent reviews, and verified compliance with Overboard Market safety policies.',
        };
      case 'Verified & Reliable':
        return {
          color: '#10B981',
          icon: <CheckCircle size={compact ? 14 : 16} color="#FFF" />,
          text: 'Verified & Reliable',
          tooltip: 'Consistently meets expectations and follows marketplace guidelines.',
        };
      case 'New or Improving':
        return {
          color: '#F59E0B',
          icon: <Shield size={compact ? 14 : 16} color="#FFF" />,
          text: 'New Vendor',
          tooltip: 'Building reputation on Overboard Market.',
        };
      case 'Under Review':
        return {
          color: '#EE6E56',
          icon: <Info size={compact ? 14 : 16} color="#FFF" />,
          text: 'Under Review',
          tooltip: 'Currently being reviewed by Overboard Market team.',
        };
      default:
        return {
          color: '#6B7280',
          icon: <Shield size={compact ? 14 : 16} color="#FFF" />,
          text: 'Vendor',
          tooltip: '',
        };
    }
  };

  const tierData = getTierData();

  if (trustScore < 50 && !verifiedVendor) {
    return null;
  }

  const BadgeContent = (
    <View style={[styles.badge, { backgroundColor: tierData.color }, compact && styles.badgeCompact]}>
      {tierData.icon}
      <Text style={[styles.badgeText, compact && styles.badgeTextCompact]}>{tierData.text}</Text>
    </View>
  );

  if (onPress || showTooltip) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {BadgeContent}
        {showTooltip && tierData.tooltip && (
          <View style={styles.tooltip}>
            <Text style={styles.tooltipText}>{tierData.tooltip}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return BadgeContent;
}

export function VendorTrustInfo({
  trustScore,
  ordersFulfilled,
  disputesCount,
  acknowledgedLatestPolicies,
}: {
  trustScore: number;
  ordersFulfilled: number;
  disputesCount: number;
  acknowledgedLatestPolicies: boolean;
}) {
  const totalOrders = Math.max(ordersFulfilled, 1);
  const fulfillmentRate = Math.round((ordersFulfilled / totalOrders) * 100);
  const disputeCount = disputesCount;

  return (
    <View style={styles.infoCard}>
      <Text style={styles.infoTitle}>Vendor Trust Info</Text>
      
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Trust Score</Text>
        <Text style={styles.infoValue}>{trustScore} / 100</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Orders fulfilled</Text>
        <Text style={styles.infoValue}>{fulfillmentRate}%</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Disputes (last 90 days)</Text>
        <Text style={styles.infoValue}>{disputeCount}</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Policy Compliant</Text>
        <Text style={styles.infoValue}>{acknowledgedLatestPolicies ? 'Yes' : 'No'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    gap: 6,
  },
  badgeCompact: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    gap: 4,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#FFF',
  },
  badgeTextCompact: {
    fontSize: 11,
  },
  tooltip: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#2B3440',
    borderRadius: 8,
    maxWidth: 280,
  },
  tooltipText: {
    fontSize: 12,
    color: '#FFF',
    lineHeight: 18,
  },
  infoCard: {
    padding: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#2B3440',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#2B3440',
  },
});
