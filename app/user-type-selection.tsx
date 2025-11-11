import { router, Stack } from 'expo-router';
import { ShoppingBag, Store, ArrowLeft } from 'lucide-react-native';
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import Colors from '@/constants/colors';

export default function UserTypeSelectionScreen() {
  const handleSelectShopper = () => {
    router.push('/customer-auth');
  };

  const handleSelectVendor = () => {
    router.push('/vendor-auth');
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/login');
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={[Colors.nautical.oceanDeep, Colors.nautical.teal, Colors.nautical.sandLight]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <ArrowLeft size={24} color={Colors.white} />
            </TouchableOpacity>

            <View style={styles.header}>
              <Text style={styles.title}>I want to&hellip;</Text>
              <Text style={styles.subtitle}>Choose how you&apos;ll use Overboard North</Text>
            </View>

            <View style={styles.cardsContainer}>
              <TouchableOpacity
                style={styles.card}
                onPress={handleSelectShopper}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Sign up as a Shopper"
              >
                <View style={styles.cardIconContainer}>
                  <ShoppingBag size={64} color={Colors.nautical.teal} strokeWidth={2.5} />
                </View>
                <Text style={styles.cardTitle}>Shop</Text>
                <Text style={styles.cardDescription}>
                  Browse booths, discover unique items, and support local makers
                </Text>
                <View style={styles.cardButton}>
                  <LinearGradient
                    colors={[Colors.nautical.teal, Colors.nautical.tealDark]}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.buttonText}>Continue as Shopper</Text>
                  </LinearGradient>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.card}
                onPress={handleSelectVendor}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Sign up as a Vendor"
              >
                <View style={styles.cardIconContainer}>
                  <Store size={64} color={Colors.light.terracotta} strokeWidth={2.5} />
                </View>
                <Text style={styles.cardTitle}>Sell</Text>
                <Text style={styles.cardDescription}>
                  Open your booth, manage listings, and sell at the market
                </Text>
                <View style={styles.cardButton}>
                  <LinearGradient
                    colors={[Colors.light.terracotta, Colors.light.terracottaDark]}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.buttonText}>Continue as Vendor</Text>
                  </LinearGradient>
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 36,
    fontWeight: '800' as const,
    color: Colors.nautical.sandLight,
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: Colors.nautical.oceanFoam,
    textAlign: 'center',
    lineHeight: 22,
  },
  cardsContainer: {
    gap: 20,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
    alignItems: 'center',
  },
  cardIconContainer: {
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.light.charcoal,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  cardDescription: {
    fontSize: 16,
    color: Colors.light.mediumGray,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  cardButton: {
    borderRadius: 12,
    overflow: 'hidden',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
});
