import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Shield, FileText, Users, ChevronDown, ChevronUp, CheckCircle, LogOut } from 'lucide-react-native';
import Colors from '@/app/constants/colors';
import { usePolicyAcknowledgment, PolicyType } from '@app/contexts/PolicyAcknowledgmentContext';
import { supabase } from '@/lib/supabase';

type PolicyTab = 'privacy' | 'terms' | 'conduct' | 'safety';

interface PolicySection {
  id: string;
  title: string;
  content: string | { subtitle: string; text: string }[];
}

const privacyPolicySections: PolicySection[] = [
  {
    id: 'who-we-are',
    title: '🧭 1. Who We Are',
    content: 'Overboard Market is part of the Overboard North brand. We connect vendors and shoppers through a digital marketplace for handmade, small business, and craft goods.',
  },
  {
    id: 'what-we-collect',
    title: '🧾 2. What We Collect',
    content: [
      {
        subtitle: 'Account Information',
        text: 'Name, email, password — to create and secure your account.',
      },
      {
        subtitle: 'Vendor Details',
        text: 'Shop name, ZIP code, product listings — to display your store and calculate shipping.',
      },
      {
        subtitle: 'Transaction Info',
        text: 'Payment method type (PayPal, Venmo, etc.), timestamps — for order history and Trust & Safety tracking.',
      },
      {
        subtitle: 'Messages & Reviews',
        text: 'In-app chat and feedback — to help with support and dispute resolution.',
      },
      {
        subtitle: 'Location (optional)',
        text: 'Pickup radius or ZIP — to show relevant vendors and pickup options.',
      },
      {
        subtitle: 'Device & Usage Data',
        text: 'Browser, app version, errors — to improve performance and prevent abuse.',
      },
    ],
  },
  {
    id: 'how-we-use',
    title: '💡 3. How We Use Your Information',
    content: 'We use your data to:\n\n• Operate and improve Overboard Market\n• Show relevant vendors, products, and pickup options\n• Communicate about orders, updates, and support\n• Protect users through fraud detection and moderation\n• Comply with legal or safety obligations\n\nWe will NEVER sell your personal data or share it with unrelated third parties.',
  },
  {
    id: 'when-we-share',
    title: '🤝 4. When We Share Data',
    content: 'We only share limited information when necessary:\n\n• With payment partners (PayPal, Venmo, Square) to complete transactions\n• With shipping tools (if enabled by vendor)\n• With law enforcement or legal authorities if required by law\n• Within Overboard North\'s internal systems for technical maintenance and support\n\nAll partners are required to protect your data under strict agreements.',
  },
  {
    id: 'protection',
    title: '⚙️ 5. How We Protect Your Data',
    content: '• Encrypted storage and transmission (HTTPS, SSL/TLS)\n• Access restricted to authorized staff only\n• Regular security checks and data audits\n• Optional 2-factor authentication for vendors',
  },
  {
    id: 'your-rights',
    title: '🧹 6. Your Rights',
    content: 'You have full control over your information. At any time, you can:\n\n• Access or correct your profile data\n• Request deletion of your account and related personal data\n• Download your order and message history (coming soon)\n• Unsubscribe from marketing emails\n\nTo request data removal, contact: privacy@overboardnorth.com',
  },
  {
    id: 'retention',
    title: '🧭 7. Data Retention',
    content: 'We keep basic account and order information as long as your account is active or as required by law for auditing and fraud prevention. Deleted accounts are fully removed within 30 days.',
  },
  {
    id: 'international',
    title: '🌎 8. International Users',
    content: 'If you access Overboard Market outside the U.S., your data may be processed in the United States. We comply with major global privacy standards and ensure your data is handled responsibly.',
  },
  {
    id: 'updates',
    title: '🔔 9. Updates to This Policy',
    content: 'We may update this policy occasionally. When that happens, you\'ll see a notice in the app and may be asked to review and re-acknowledge the new version.',
  },
  {
    id: 'contact',
    title: '💬 10. Contact Us',
    content: 'Questions or privacy concerns?\n📧 privacy@overboardnorth.com\n📍 Hudson, Wisconsin, USA',
  },
];

const termsSections: PolicySection[] = [
  {
    id: 'acceptance',
    title: '1. Acceptance of Terms',
    content: 'By creating an account on Overboard Market, you agree to these Terms of Use. If you do not agree, do not use our services.',
  },
  {
    id: 'eligibility',
    title: '2. Eligibility',
    content: '• You must be at least 18 years old to use Overboard Market as a vendor.\n• Customers under 18 may use the platform with parental consent.',
  },
  {
    id: 'vendor-responsibilities',
    title: '3. Vendor Responsibilities',
    content: [
      {
        subtitle: 'Product Accuracy',
        text: 'Vendors must accurately describe products, including materials, dimensions, and any defects.',
      },
      {
        subtitle: 'Fulfillment',
        text: 'Ship orders within stated handling times. Provide tracking when available.',
      },
      {
        subtitle: 'Communication',
        text: 'Respond to customer messages within 48 hours.',
      },
      {
        subtitle: 'Prohibited Items',
        text: 'Do not list items that violate our Prohibited Items Policy.',
      },
    ],
  },
  {
    id: 'customer-responsibilities',
    title: '4. Customer Responsibilities',
    content: '• Provide accurate shipping and contact information\n• Pay for orders promptly through approved payment methods\n• Communicate respectfully with vendors\n• Report any issues within 7 days of delivery',
  },
  {
    id: 'payments',
    title: '5. Payments & Fees',
    content: 'Overboard Market does not process payments directly. Transactions occur between buyers and sellers using external payment services (PayPal, Venmo, etc.).',
  },
  {
    id: 'disputes',
    title: '6. Disputes & Refunds',
    content: 'We encourage buyers and vendors to resolve issues directly through in-app messaging. If resolution is not possible, contact our support team at support@overboardnorth.com.',
  },
  {
    id: 'termination',
    title: '7. Account Termination',
    content: 'We reserve the right to suspend or terminate accounts that violate these terms, engage in fraudulent activity, or harm the community.',
  },
  {
    id: 'liability',
    title: '8. Limitation of Liability',
    content: 'Overboard Market acts as a platform connecting buyers and sellers. We are not responsible for the quality, safety, or legality of products sold.',
  },
];

const conductSections: PolicySection[] = [
  {
    id: 'respect',
    title: '🤝 1. Treat Everyone with Respect',
    content: 'Be kind, professional, and courteous in all interactions. Harassment, discrimination, or abusive language will not be tolerated.',
  },
  {
    id: 'honest',
    title: '✅ 2. Be Honest',
    content: 'Vendors: List accurate product descriptions and photos.\nCustomers: Provide truthful feedback and reviews.',
  },
  {
    id: 'safe',
    title: '🛡️ 3. Keep Transactions Safe',
    content: '• Use approved payment methods only\n• Keep communication in-app for protection\n• Never share personal financial information\n• For local pickups, meet in public, well-lit areas',
  },
  {
    id: 'prohibited',
    title: '🚫 4. What\'s Not Allowed',
    content: '• Counterfeit or stolen goods\n• Illegal items or substances\n• Misleading or false advertising\n• Off-platform payment requests\n• Spam or unsolicited promotional content',
  },
  {
    id: 'report',
    title: '📢 5. Report Issues',
    content: 'If you encounter suspicious activity, scams, or policy violations, report it immediately through the app or contact support@overboardnorth.com.',
  },
  {
    id: 'consequences',
    title: '⚖️ 6. Consequences',
    content: 'Violations may result in:\n• Warning\n• Temporary suspension\n• Permanent account removal\n\nYou have the right to appeal decisions within 7 days.',
  },
];

const safetySections: PolicySection[] = [
  {
    id: 'purpose',
    title: '🧭 Purpose',
    content: 'To maintain a safe, transparent, and fair community where vendors and customers can confidently buy and sell handmade and small-business goods. This framework establishes the policies, tools, and escalation procedures used to protect all participants.',
  },
  {
    id: 'verification',
    title: '1️⃣ Verification & Trust Programs',
    content: [
      {
        subtitle: 'Verified Vendor Program',
        text: 'Vendors can request verification after providing basic ID or business documentation (e.g., EIN, driver\'s license), or completing 3+ successful orders with 4★+ average rating. Verified vendors receive a blue check badge on listings and profiles.',
      },
      {
        subtitle: 'Benefits',
        text: 'Higher visibility in search, eligibility for featured vendor spots, and additional dispute protection.',
      },
    ],
  },
  {
    id: 'safe-payment',
    title: '2️⃣ Safe Payment Practices',
    content: 'Overboard Market recognizes external payments via PayPal, Venmo, or Square. Vendors must log the payment type in the app for dispute support. Never send payment through CashApp, wire transfer, or gift cards.',
  },
  {
    id: 'local-pickup',
    title: '3️⃣ Local Pickup Security',
    content: 'Every pickup order generates a unique 6-digit confirmation code. Buyer shares code with vendor during handoff. Vendor enters code to confirm order completion. Pickup available only within vendor\'s set radius (default 75 miles). Exact coordinates hidden for safety.',
  },
  {
    id: 'reporting',
    title: '4️⃣ Reporting & Moderation',
    content: [
      {
        subtitle: 'Report Types',
        text: 'Vendor Misconduct (scams, no shipment, rude behavior), Buyer Misconduct (fraudulent payment, harassment), Product Violation (counterfeit or banned goods).',
      },
      {
        subtitle: 'Workflow',
        text: 'User clicks Report → Report added to Reports collection → Admin reviews and updates to in review → resolved or escalated. If verified, vendor/buyer flagged or suspended.',
      },
      {
        subtitle: 'Admin Response SLAs',
        text: 'Acknowledgement: within 24 hours. Investigation: within 72 hours. Resolution/communication: within 7 business days.',
      },
    ],
  },
  {
    id: 'dispute-resolution',
    title: '5️⃣ Dispute Resolution Pipeline',
    content: 'Stage 1: Vendor–Buyer Chat — Try to resolve directly within 48h. Stage 2: Escalation to Admin — Review payment log, chat, and evidence. Stage 3: Decision — Refund guidance, warning, or suspension. All communication should remain in-app for safety and recordkeeping.',
  },
  {
    id: 'trust-scoring',
    title: '6️⃣ Trust Scoring & Risk Monitoring',
    content: 'Trust Score computed from: (Positive Reviews ÷ Total Reviews) × 0.6 + (Orders Fulfilled ÷ Orders Received) × 0.3 + (Dispute-Free Ratio) × 0.1. Vendors with score < 70 auto-flagged for admin review. Repeated issues trigger automatic account warnings.',
  },
  {
    id: 'education',
    title: '7️⃣ Education & Prevention',
    content: 'For Vendors: "Spot a Scam" guide in Vendor Resources. Common scam alerts: buyers requesting overpayment or shipping labels, fake screenshots of payments, requests to move conversation off-app. For Customers: Checkout reminders and banners reinforce safe buying: "If a seller requests direct payment outside the app, please report it."',
  },
  {
    id: 'enforcement',
    title: '8️⃣ Account Enforcement',
    content: 'Warning (1–2 verified reports): Formal warning email & flag. Suspension (3+ verified reports): 7-day account lockout pending review. Removal (Repeated or severe violation): Permanent removal and ban. Appeal: Within 7 days — Review by admin team.',
  },
  {
    id: 'admin-oversight',
    title: '9️⃣ Admin Oversight',
    content: 'Real-time alert for: new report filed, vendor trustScore < threshold, 3 disputes in 30 days. Admin dashboard filters: open reports, high-risk vendors, repeated offenders.',
  },
];

export default function PolicyCenterScreen() {
  const params = useLocalSearchParams<{ tab?: string; requireAck?: string }>();
  const [activeTab, setActiveTab] = useState<PolicyTab>('privacy');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [isAcknowledging, setIsAcknowledging] = useState(false);
  
  const {
    needsAcknowledgment,
    acknowledgPolicy,
    getCurrentVersion,
    getAcknowledgedVersion,
  } = usePolicyAcknowledgment();

  const requiresAck = params.requireAck === 'true';

  useEffect(() => {
    if (params.tab && ['privacy', 'terms', 'conduct', 'safety'].includes(params.tab)) {
      setActiveTab(params.tab as PolicyTab);
    }
  }, [params.tab]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const renderSection = (section: PolicySection) => {
    const isExpanded = expandedSections.has(section.id);

    return (
      <View key={section.id} style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection(section.id)}
          activeOpacity={0.7}
        >
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {isExpanded ? (
            <ChevronUp size={20} color={Colors.nautical.teal} />
          ) : (
            <ChevronDown size={20} color={Colors.nautical.teal} />
          )}
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.sectionContent}>
            {typeof section.content === 'string' ? (
              <Text style={styles.contentText}>{section.content}</Text>
            ) : (
              section.content.map((item, index) => (
                <View key={index} style={styles.subsection}>
                  <Text style={styles.subsectionTitle}>{item.subtitle}</Text>
                  <Text style={styles.contentText}>{item.text}</Text>
                </View>
              ))
            )}
          </View>
        )}
      </View>
    );
  };

  const getSectionsForTab = () => {
    switch (activeTab) {
      case 'privacy':
        return privacyPolicySections;
      case 'terms':
        return termsSections;
      case 'conduct':
        return conductSections;
      case 'safety':
        return safetySections;
    }
  };

  const getPolicyType = (): PolicyType => {
    switch (activeTab) {
      case 'privacy':
        return 'privacy';
      case 'terms':
        return 'terms';
      case 'conduct':
        return 'codeOfConduct';
      case 'safety':
        return 'trustSafety';
    }
  };

  const handleAccept = async () => {
    const policyType = getPolicyType();
    const currentVersion = getCurrentVersion(policyType);

    if (!currentVersion) {
      Alert.alert('Error', 'Unable to determine current policy version.');
      return;
    }

    setIsAcknowledging(true);
    const result = await acknowledgPolicy(policyType, currentVersion);
    setIsAcknowledging(false);

    if (result.success) {
      Alert.alert(
        'Thank You',
        'You have successfully acknowledged the updated policy.',
        [
          {
            text: 'Continue',
            onPress: () => {
              if (requiresAck) {
                router.back();
              }
            },
          },
        ]
      );
    } else {
      Alert.alert('Error', result.error || 'Failed to acknowledge policy. Please try again.');
    }
  };

  const handleDecline = async () => {
    Alert.alert(
      'Decline Policy',
      'To use Overboard Market, you must agree to our policies. Declining will log you out.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            router.replace('/login');
          },
        },
      ]
    );
  };

  const policyType = getPolicyType();
  const showAckButtons = requiresAck && needsAcknowledgment(policyType);
  const currentVersion = getCurrentVersion(policyType);
  const acknowledgedVersion = getAcknowledgedVersion(policyType);

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Privacy & Policies',
          headerStyle: { backgroundColor: Colors.white },
          headerTitleStyle: { color: Colors.light.text },
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'privacy' && styles.tabActive]}
            onPress={() => setActiveTab('privacy')}
          >
            <Shield
              size={20}
              color={activeTab === 'privacy' ? Colors.white : Colors.nautical.teal}
            />
            <Text
              style={[styles.tabText, activeTab === 'privacy' && styles.tabTextActive]}
            >
              Privacy
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'terms' && styles.tabActive]}
            onPress={() => setActiveTab('terms')}
          >
            <FileText
              size={20}
              color={activeTab === 'terms' ? Colors.white : Colors.nautical.teal}
            />
            <Text style={[styles.tabText, activeTab === 'terms' && styles.tabTextActive]}>
              Terms
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'conduct' && styles.tabActive]}
            onPress={() => setActiveTab('conduct')}
          >
            <Users
              size={20}
              color={activeTab === 'conduct' ? Colors.white : Colors.nautical.teal}
            />
            <Text
              style={[styles.tabText, activeTab === 'conduct' && styles.tabTextActive]}
            >
              Conduct
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'safety' && styles.tabActive]}
            onPress={() => setActiveTab('safety')}
          >
            <Shield
              size={20}
              color={activeTab === 'safety' ? Colors.white : Colors.nautical.teal}
            />
            <Text
              style={[styles.tabText, activeTab === 'safety' && styles.tabTextActive]}
            >
              Safety
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {activeTab === 'privacy' && 'Privacy Policy'}
              {activeTab === 'terms' && 'Terms of Use'}
              {activeTab === 'conduct' && 'Community Code of Conduct'}
              {activeTab === 'safety' && 'Trust & Safety Policy'}
            </Text>
            <Text style={styles.headerSubtitle}>Effective Date: November 2025</Text>
          </View>

          {getSectionsForTab().map((section) => renderSection(section))}

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Questions or concerns? Contact us at:
            </Text>
            <Text style={styles.footerEmail}>support@overboardnorth.com</Text>
            <Text style={styles.footerLocation}>📍 Hudson, Wisconsin, USA</Text>
          </View>

          {showAckButtons && (
            <View style={styles.acknowledgmentSection}>
              <View style={styles.versionInfo}>
                <Text style={styles.versionInfoText}>
                  Current Version: {currentVersion}
                </Text>
                {acknowledgedVersion !== null && acknowledgedVersion < (currentVersion || 0) && (
                  <Text style={styles.versionInfoSubtext}>
                    Previously acknowledged: v{acknowledgedVersion}
                  </Text>
                )}
              </View>

              <View style={styles.acknowledgmentButtons}>
                <TouchableOpacity
                  style={styles.acceptButton}
                  onPress={handleAccept}
                  disabled={isAcknowledging}
                  activeOpacity={0.7}
                >
                  <CheckCircle size={20} color={Colors.white} />
                  <Text style={styles.acceptButtonText}>
                    {isAcknowledging ? 'Accepting...' : 'Accept & Continue'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.declineButton}
                  onPress={handleDecline}
                  disabled={isAcknowledging}
                  activeOpacity={0.7}
                >
                  <LogOut size={20} color={Colors.error} />
                  <Text style={styles.declineButtonText}>Decline / Log Out</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.acknowledgmentNote}>
                By accepting, you confirm that you have read and agree to the terms outlined above.
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.cream,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    ...Platform.select({
      web: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      default: {
        elevation: 2,
      },
    }),
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.nautical.sandLight,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.light.border,
  },
  tabActive: {
    backgroundColor: Colors.nautical.teal,
    borderColor: Colors.nautical.teal,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.nautical.teal,
  },
  tabTextActive: {
    color: Colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.light.muted,
    fontWeight: '500' as const,
  },
  section: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: Colors.nautical.sandLight,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.light.text,
    flex: 1,
  },
  sectionContent: {
    padding: 16,
    gap: 12,
  },
  contentText: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 22,
  },
  subsection: {
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.nautical.teal,
    marginBottom: 4,
  },
  footer: {
    marginTop: 32,
    padding: 20,
    backgroundColor: Colors.white,
    borderRadius: 12,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: Colors.nautical.teal,
  },
  footerText: {
    fontSize: 14,
    color: Colors.light.muted,
    marginBottom: 8,
  },
  footerEmail: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.nautical.teal,
    marginBottom: 4,
  },
  footerLocation: {
    fontSize: 14,
    color: Colors.light.text,
  },
  acknowledgmentSection: {
    marginTop: 24,
    padding: 20,
    backgroundColor: Colors.nautical.sandLight,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.nautical.teal,
    gap: 16,
  },
  versionInfo: {
    alignItems: 'center' as const,
    gap: 4,
  },
  versionInfoText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.light.text,
  },
  versionInfoSubtext: {
    fontSize: 12,
    color: Colors.light.muted,
  },
  acknowledgmentButtons: {
    gap: 12,
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: Colors.nautical.teal,
    borderRadius: 12,
    ...Platform.select({
      web: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      default: {
        elevation: 3,
      },
    }),
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  declineButton: {
    flexDirection: 'row',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.error,
  },
  declineButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.error,
  },
  acknowledgmentNote: {
    fontSize: 12,
    color: Colors.light.muted,
    textAlign: 'center' as const,
    lineHeight: 18,
  },
});
