import { router, Stack } from 'expo-router';
import { Compass, ShoppingBag, Store, Info, X, Shield } from 'lucide-react-native';
import { Image } from 'expo-image';
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Modal,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import Colors from '@/constants/colors';

export default function WelcomeScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 8000,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [fadeAnim, slideAnim, rotateAnim, scaleAnim]);

  const handleCustomerSignIn = () => {
    router.push('/customer-auth');
  };

  const handleVendorSignIn = () => {
    router.push('/vendor-auth');
  };

  const handleLearnMore = () => {
    setIsModalVisible(true);
  };



  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={[Colors.nautical.oceanDeep, '#5A9A9C', Colors.nautical.sandLight]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
            <Animated.View
              style={[
                styles.heroSection,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <Animated.View
                style={[
                  styles.logoContainer,
                  {
                    transform: [{ scale: scaleAnim }],
                  },
                ]}
              >
                <Image
                  source="https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/2xy6wz02y7785e8tudlx0"
                  style={styles.logo}
                  contentFit="contain"
                />
              </Animated.View>

              <Text style={styles.tagline}>Where small shops set sail.</Text>

              <TouchableOpacity
                style={styles.learnMoreButtonTop}
                onPress={handleLearnMore}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Learn more about Overboard Market"
              >
                <Info size={16} color="rgba(255, 255, 255, 0.8)" />
                <Text style={styles.learnMoreTextTop}>What is Overboard Market?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.faqLinkTop}
                onPress={() => router.push('/faq')}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="View FAQ"
              >
                <Text style={styles.faqLinkTopText}>Questions? Visit our FAQ</Text>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View
              style={[
                styles.cardsSection,
                {
                  opacity: fadeAnim,
                },
              ]}
            >
              <View style={styles.authButtonsContainer}>
                <TouchableOpacity
                  style={styles.authButton}
                  onPress={handleCustomerSignIn}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Shop the Market"
                >
                  <LinearGradient
                    colors={[Colors.nautical.teal, Colors.nautical.tealDark]}
                    style={styles.authButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <View style={styles.authButtonContent}>
                      <View style={styles.authButtonIcon}>
                        <ShoppingBag size={24} color={Colors.white} strokeWidth={2} />
                      </View>
                      <View style={styles.authButtonTextContainer}>
                        <Text style={styles.authButtonText}>Shop the Market</Text>
                        <Text style={styles.authButtonSubtext}>Discover handmade treasures, cozy goods, and local favorites from small shops</Text>
                      </View>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.authButton}
                  onPress={handleVendorSignIn}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Vendor Dashboard"
                >
                  <LinearGradient
                    colors={[Colors.light.terracotta, Colors.light.terracottaDark]}
                    style={styles.authButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <View style={styles.authButtonContent}>
                      <View style={styles.authButtonIcon}>
                        <Store size={24} color={Colors.white} strokeWidth={2} />
                      </View>
                      <View style={styles.authButtonTextContainer}>
                        <Text style={styles.authButtonText}>Vendor Dashboard</Text>
                        <Text style={styles.authButtonSubtext}>Open your digital booth and start selling in minutes</Text>
                      </View>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              <View style={styles.footerNote}>
                <Text style={styles.footerNoteText}>Powered by Overboard North</Text>
              </View>

              <TouchableOpacity
                style={styles.adminButton}
                onPress={() => router.push('/login')}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Admin Login"
              >
                <Shield size={16} color={Colors.light.mediumGray} />
                <Text style={styles.adminButtonText}>Admin</Text>
              </TouchableOpacity>
            </Animated.View>
        </SafeAreaView>
      </LinearGradient>

      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Compass size={24} color={Colors.nautical.teal} />
                <Text style={styles.modalTitle}>What is Overboard Market?</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsModalVisible(false)}
                style={styles.modalCloseButton}
                accessibilityRole="button"
                accessibilityLabel="Close modal"
              >
                <X size={24} color={Colors.light.mediumGray} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.modalText}>
                Overboard Market is a virtual vendor fair — an online space where shoppers can explore small shops, handmade treasures, and local favorites all in one place.
              </Text>

              <Text style={styles.modalText}>
                Each vendor has their own booth, their own story, and their own products — just like a hometown market, but online.
              </Text>

              <Text style={styles.modalText}>
                Grab your coffee, browse new makers, and discover something special while supporting small businesses from near and far.
              </Text>

              <Text style={styles.modalText}>
                Whether you&apos;re here to shop or to set up your own booth, Overboard Market is where small shops set sail.
              </Text>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setIsModalVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="Got it"
              >
                <LinearGradient
                  colors={[Colors.nautical.teal, Colors.nautical.tealDark]}
                  style={styles.modalButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.modalButtonText}>Got it!</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    justifyContent: 'space-between',
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 12,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logo: {
    width: 170,
    height: 170,
  },

  title: {
    fontSize: 42,
    fontWeight: '900' as const,
    color: Colors.white,
    textAlign: 'center',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '300' as const,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    letterSpacing: 3,
    marginTop: 8,
    textTransform: 'uppercase' as const,
  },
  tagline: {
    fontSize: 16,
    fontWeight: '300' as const,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
    fontStyle: 'italic' as const,
    lineHeight: 22,
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  taglineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    gap: 12,
    paddingHorizontal: 20,
  },
  fairStatusBadge: {
    marginTop: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  fairStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fairStatusItem: {
    flex: 1,
    alignItems: 'center',
  },
  fairStatusLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: 'rgba(255, 255, 255, 0.7)',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  fairStatusValue: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.white,
    letterSpacing: 0.3,
  },
  fairStatusDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  cardsSection: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  eventBanner: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  eventBannerEmoji: {
    fontSize: 18,
  },
  eventBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.white,
    letterSpacing: 0.2,
    lineHeight: 16,
  },
  pathHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  pathHeaderContainerSpacing: {
    marginTop: 40,
  },
  pathHeaderEmoji: {
    fontSize: 22,
  },
  pathHeaderText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
  },

  primaryCard: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  cardGradient: {
    padding: 24,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  cardIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(74, 124, 126, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.nautical.oceanDeep,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  cardDescription: {
    fontSize: 14,
    color: Colors.light.mediumGray,
    lineHeight: 20,
  },
  cardArrow: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(74, 124, 126, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600' as const,
  },
  authButtonsContainer: {
    gap: 12,
  },
  authButton: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },

  authButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  authButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  authButtonIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authButtonTextContainer: {
    flex: 1,
  },
  authButtonText: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  authButtonSubtext: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    fontWeight: '500' as const,
    letterSpacing: 0.2,
    lineHeight: 16,
  },
  learnMoreButtonTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  learnMoreTextTop: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '600' as const,
    letterSpacing: 0.2,
  },
  faqLinkTop: {
    alignItems: 'center',
    marginTop: 6,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  faqLinkTopText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600' as const,
    letterSpacing: 0.2,
    textDecorationLine: 'underline' as const,
  },

  footer: {
    alignItems: 'center',
    marginTop: 48,
    gap: 8,
  },
  footerText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontWeight: '500' as const,
    letterSpacing: 0.5,
  },
  footerSubtext: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 18,
  },
  continueCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
    marginBottom: 16,
  },
  continueCardGradient: {
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  continueCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  continueCardIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueCardText: {
    flex: 1,
  },
  continueCardTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.white,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  continueCardSubtitle: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  continueCardArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.nautical.oceanDeep,
    letterSpacing: 0.3,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.softGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScrollView: {
    maxHeight: 400,
  },
  modalContent: {
    padding: 20,
    paddingBottom: 24,
  },
  modalText: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.light.darkGray,
    fontWeight: '400' as const,
    marginBottom: 16,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  modalButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  modalButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  faqLink: {
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  faqLinkText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '600' as const,
    letterSpacing: 0.3,
  },
  footerNote: {
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
  },
  footerNoteText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
    letterSpacing: 0.8,
    fontWeight: '500' as const,
  },
  adminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    marginBottom: 4,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'center',
  },
  adminButtonText: {
    fontSize: 13,
    color: Colors.light.mediumGray,
    fontWeight: '600' as const,
    letterSpacing: 0.3,
  },
});
