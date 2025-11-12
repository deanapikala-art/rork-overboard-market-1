import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Tag } from 'lucide-react-native';
import Colors from '@/app/constants/colors';
import { VendorSale } from '@/app/contexts/VendorSalesContext';

interface SaleBadgeProps {
  sale: VendorSale;
  size?: 'small' | 'medium' | 'large';
}

export function SaleBadge({ sale, size = 'medium' }: SaleBadgeProps) {
  const getDiscountLabel = (): string => {
    if (sale.discount_type === 'percentage') {
      return `${sale.discount_value}% OFF`;
    } else if (sale.discount_type === 'flat') {
      return `$${sale.discount_value} OFF`;
    } else if (sale.discount_type === 'bogo') {
      return `BUY ${sale.buy_qty} GET ${sale.get_qty}`;
    }
    return '';
  };

  const sizeStyles = {
    small: { fontSize: 10, padding: 4, paddingHorizontal: 8, iconSize: 12 },
    medium: { fontSize: 12, padding: 6, paddingHorizontal: 10, iconSize: 14 },
    large: { fontSize: 14, padding: 8, paddingHorizontal: 12, iconSize: 16 },
  };

  const current = sizeStyles[size];

  return (
    <View
      style={[
        styles.badge,
        {
          paddingVertical: current.padding,
          paddingHorizontal: current.paddingHorizontal,
        },
      ]}
    >
      <Tag size={current.iconSize} color="#fff" />
      <Text
        style={[
          styles.badgeText,
          {
            fontSize: current.fontSize,
          },
        ]}
      >
        {getDiscountLabel()}
      </Text>
    </View>
  );
}

interface PriceWithSaleProps {
  originalPriceCents: number;
  sale?: VendorSale;
  size?: 'small' | 'medium' | 'large';
}

export function PriceWithSale({ originalPriceCents, sale, size = 'medium' }: PriceWithSaleProps) {
  const calculateSalePrice = (): number => {
    if (!sale || !sale.active) return originalPriceCents;

    if (sale.discount_type === 'percentage' && sale.discount_value) {
      return Math.floor(originalPriceCents * (1 - sale.discount_value / 100));
    } else if (sale.discount_type === 'flat' && sale.discount_value) {
      return Math.max(0, originalPriceCents - Math.floor(sale.discount_value * 100));
    }

    return originalPriceCents;
  };

  const salePrice = calculateSalePrice();
  const hasSale = sale && sale.active && salePrice < originalPriceCents && sale.discount_type !== 'bogo';

  const sizeStyles = {
    small: { originalSize: 12, saleSize: 14 },
    medium: { originalSize: 14, saleSize: 18 },
    large: { originalSize: 16, saleSize: 22 },
  };

  const current = sizeStyles[size];

  return (
    <View style={styles.priceContainer}>
      {hasSale ? (
        <>
          <Text
            style={[
              styles.salePrice,
              {
                fontSize: current.saleSize,
              },
            ]}
          >
            ${(salePrice / 100).toFixed(2)}
          </Text>
          <Text
            style={[
              styles.originalPrice,
              {
                fontSize: current.originalSize,
              },
            ]}
          >
            ${(originalPriceCents / 100).toFixed(2)}
          </Text>
        </>
      ) : (
        <Text
          style={[
            styles.regularPrice,
            {
              fontSize: current.saleSize,
            },
          ]}
        >
          ${(originalPriceCents / 100).toFixed(2)}
        </Text>
      )}
    </View>
  );
}

export default SaleBadge;

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ef4444',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: '#fff',
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  salePrice: {
    fontWeight: '700' as const,
    color: '#ef4444',
  },
  originalPrice: {
    fontWeight: '600' as const,
    color: Colors.light.tabIconDefault,
    textDecorationLine: 'line-through',
  },
  regularPrice: {
    fontWeight: '700' as const,
    color: Colors.dark.text,
  },
});
