import { router, Stack } from 'expo-router';
import { HelpCircle, ShoppingBag, Package, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Colors from '@/app/constants/colors';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  title: string;
  icon: typeof ShoppingBag;
  color: string;
  items: FAQItem[];
}

const faqData: FAQCategory[] = [
  {
    title: 'For Shoppers',
    icon: ShoppingBag,
    color: Colors.nautical.teal,
    items: [
      {
        question: 'What is Overboard Market?',
        answer: 'An online vendor fair and shopping hub where small businesses, makers, and boutiques connect with customers nationwide. Shop directly with vendors, discover unique products, and join live shopping events from your phone or computer.',
      },
      {
        question: 'Do I need an account to shop?',
        answer: 'You can browse freely. A free account is needed to join live events, favorite vendors, or access exclusive deals.',
      },
      {
        question: 'How do I buy from vendors?',
        answer: 'Purchases are made directly through each vendor&apos;s linked shop (Etsy, Shopify, Square, PayPal, etc.). Vendors handle their own orders, payments, shipping, and returns.',
      },
      {
        question: 'Can I shop from multiple vendors at once?',
        answer: 'Not yet. Each checkout is completed with the vendor directly, keeping your purchase simple and secure.',
      },
      {
        question: 'How do I know if a vendor is live?',
        answer: 'Look for the "Live Now" banner or red dot next to their name. Vendors can go live on Facebook, Instagram, TikTok, or YouTube.',
      },
      {
        question: 'What happens during live fairs?',
        answer: 'Vendors showcase products, offer limited-time deals, and chat directly with shoppers. It&apos;s like walking through a craft fair—without leaving your home!',
      },
      {
        question: 'Can I shop local?',
        answer: 'Yes! Use filters to find vendors by state or region. Perfect for local pickup or same-day delivery options.',
      },
      {
        question: 'Who do I contact about an order?',
        answer: 'Message the vendor directly through their shop profile. Each vendor manages their own sales and customer service.',
      },
    ],
  },
  {
    title: 'For Vendors',
    icon: Package,
    color: Colors.light.terracotta,
    items: [
      {
        question: 'What is Overboard Market?',
        answer: 'A nationwide online vendor fair and marketplace that helps small shops reach new customers and grow their audience. Sell directly, go live, and promote your business with low monthly costs.',
      },
      {
        question: 'How much does it cost?',
        answer: 'Marketplace access: $10/month. Live vendor fair events: $15 per event. No hidden fees or complex tiers—what you see is what you pay.',
      },
      {
        question: 'How do customers pay?',
        answer: 'Customers purchase through your linked shop or checkout (Etsy, Shopify, Square, PayPal, etc.). Overboard Market does not process payments—you maintain full control of your transactions.',
      },
      {
        question: 'What are live events?',
        answer: 'Monthly themed fairs promoted across social media. Vendors can showcase products live, run giveaways, and engage with shoppers in real time.',
      },
      {
        question: 'Can I go live anytime?',
        answer: 'Yes! Vendors can go live whenever they&apos;d like. Your profile will automatically display a "Live Now" badge during your broadcast.',
      },
      {
        question: 'How do I join as a vendor?',
        answer: 'Complete vendor registration. Add your business info, upload your shop links, and set your first event preference. You&apos;ll be added to the Marketplace once approved.',
      },
      {
        question: 'Do I need to ship nationwide?',
        answer: 'No. You can offer local pickup, delivery, or shipping—whatever fits your business model. Just note your fulfillment options clearly in your vendor profile.',
      },
      {
        question: 'Are there rules or requirements?',
        answer: 'Represent your brand professionally. Fulfill orders promptly. Comply with all legal and community guidelines for selling products.',
      },
    ],
  },
];

export default function FAQScreen() {
  const [expandedItems, setExpandedItems] = useState<{ [key: string]: boolean }>({});

  const toggleItem = (categoryIndex: number, itemIndex: number) => {
    const key = `${categoryIndex}-${itemIndex}`;
    setExpandedItems(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen 
        options={{ 
          headerShown: false,
        }} 
      />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={24} color={Colors.nautical.oceanDeep} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <HelpCircle size={28} color={Colors.nautical.teal} />
          <Text style={styles.headerTitle}>About / FAQ</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.intro}>
          <Text style={styles.introText}>
            Everything you need to know about shopping, selling, and using Overboard Market.
          </Text>
        </View>

        {faqData.map((category, categoryIndex) => {
          const IconComponent = category.icon;
          
          return (
            <View key={categoryIndex} style={styles.categorySection}>
              <View style={styles.categoryHeader}>
                <View style={[styles.categoryIconContainer, { backgroundColor: `${category.color}15` }]}>
                  <IconComponent size={24} color={category.color} />
                </View>
                <Text style={styles.categoryTitle}>{category.title}</Text>
              </View>

              <View style={styles.categoryContent}>
                {category.items.map((item, itemIndex) => {
                  const key = `${categoryIndex}-${itemIndex}`;
                  const isExpanded = expandedItems[key];

                  return (
                    <View key={itemIndex} style={styles.faqItem}>
                      <TouchableOpacity
                        style={styles.questionContainer}
                        onPress={() => toggleItem(categoryIndex, itemIndex)}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel={`${isExpanded ? 'Collapse' : 'Expand'} ${item.question}`}
                      >
                        <View style={styles.bulletContainer}>
                          <View style={[styles.bullet, { backgroundColor: category.color }]} />
                        </View>
                        <Text style={styles.question}>{item.question}</Text>
                        {isExpanded ? (
                          <ChevronUp size={20} color={Colors.light.mediumGray} />
                        ) : (
                          <ChevronDown size={20} color={Colors.light.mediumGray} />
                        )}
                      </TouchableOpacity>

                      {isExpanded && (
                        <View style={styles.answerContainer}>
                          <Text style={styles.answer}>{item.answer}</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}

        <View style={styles.footerNote}>
          <Text style={styles.footerNoteText}>
            Have questions or need help? Visit the Support section from the menu for assistance.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.light.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.nautical.oceanDeep,
    letterSpacing: 0.3,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  intro: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: Colors.light.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  introText: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.light.darkGray,
    textAlign: 'center',
  },
  categorySection: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  categoryIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.light.charcoal,
    letterSpacing: 0.3,
  },
  categoryContent: {
    gap: 12,
  },
  faqItem: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: 'hidden',
  },
  questionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  bulletContainer: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  question: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.charcoal,
    lineHeight: 22,
  },
  answerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingLeft: 48,
  },
  answer: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.light.darkGray,
  },
  footerNote: {
    marginTop: 24,
    marginHorizontal: 20,
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: `${Colors.nautical.teal}10`,
    borderRadius: 12,
  },
  footerNoteText: {
    fontSize: 13,
    color: Colors.light.mediumGray,
    textAlign: 'center',
    lineHeight: 20,
  },
});
