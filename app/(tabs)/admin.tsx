import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
  Switch,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Compass,
  Users,
  Calendar,
  TrendingUp,
  Bell,
  Music,
  Star,
  CheckCircle,
  XCircle,
  Eye,
  ChevronRight,
  AlertTriangle,
  Package,
  DollarSign,
  CreditCard,
  ExternalLink,
  LogOut,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { vendorApplications, VendorApplication } from '@/mocks/vendorApplications';
import HamburgerMenu from '@/app/components/HamburgerMenu';
import { analyticsData } from '@/mocks/analytics';
import { events } from '@/mocks/events';
import { vendors } from '@/mocks/vendors';
import { router } from 'expo-router';
import { useAdminAuth } from '@/app/contexts/AdminAuthContext';
import { quickCheck } from '@/app/utils/quickCheck';
import AdminAnalyticsDashboard from '@/app/components/AdminAnalyticsDashboard';
import AdminControlsPanel from '@/app/components/AdminControlsPanel';
import NotificationBell from '@/app/components/NotificationBell';
import NotificationPreferencesModal from '@/app/components/NotificationPreferencesModal';
import AdminReportsDashboard from '@/app/components/AdminReportsDashboard';

const { width } = Dimensions.get('window');

export default function AdminPanel() {
  const insets = useSafeAreaInsets();
  const { isAdmin, signOut, isLoading } = useAdminAuth();
  const [showPreferences, setShowPreferences] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      console.log('[AdminPanel] Not authenticated, redirecting to admin auth');
      router.replace('/admin-auth');
    }
  }, [isAdmin, isLoading]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics' | 'reports' | 'applications' | 'vendors' | 'events' | 'announcements' | 'billing' | 'controls'>('dashboard');
  const [selectedApplication, setSelectedApplication] = useState<VendorApplication | null>(null);
  const [announcement, setAnnouncement] = useState('');

  const [marketplaceFeeType, setMarketplaceFeeType] = useState<'one_time' | 'monthly' | 'annual'>('monthly');
  const [marketplaceFeeAmount, setMarketplaceFeeAmount] = useState('29.99');
  const [eventFeeAmount, setEventFeeAmount] = useState('15.00');
  const [currency, setCurrency] = useState('USD');
  const [paymentsProvider, setPaymentsProvider] = useState<'stripe' | 'external'>('stripe');
  const [stripeMarketplacePriceId, setStripeMarketplacePriceId] = useState('');
  const [stripeEventPriceId, setStripeEventPriceId] = useState('');

  const pendingApplications = vendorApplications.filter(app => app.status === 'pending');

  const renderRopeDivider = () => (
    <View style={styles.ropeDivider}>
      <View style={styles.ropeSegment} />
      <Compass size={16} color={Colors.nautical.driftwood} style={styles.compassIcon} />
      <View style={styles.ropeSegment} />
    </View>
  );

  const renderDashboard = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Analytics Overview</Text>
      
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: Colors.nautical.tealLight }]}>
          <View style={styles.statIconContainer}>
            <Eye size={24} color={Colors.white} />
          </View>
          <Text style={styles.statValue}>{analyticsData.totalVisits.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Total Visits</Text>
          <Text style={styles.statSubtext}>{analyticsData.uniqueVisitors.toLocaleString()} unique</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: Colors.nautical.driftwood }]}>
          <View style={styles.statIconContainer}>
            <Package size={24} color={Colors.white} />
          </View>
          <Text style={styles.statValue}>${analyticsData.totalSales.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Total Sales</Text>
          <Text style={styles.statSubtext}>${analyticsData.averageOrderValue.toFixed(2)} avg</Text>
        </View>
      </View>

      {renderRopeDivider()}

      <Text style={styles.sectionTitle}>Top Performing Booths</Text>
      {analyticsData.topVendors.map((vendor, index) => (
        <View key={vendor.vendorId} style={styles.vendorStatCard}>
          <View style={styles.rankBadge}>
            <Text style={styles.rankText}>#{index + 1}</Text>
          </View>
          <View style={styles.vendorStatInfo}>
            <Text style={styles.vendorStatName}>{vendor.vendorName}</Text>
            <Text style={styles.vendorStatDetails}>
              {vendor.visits.toLocaleString()} visits • ${vendor.sales.toLocaleString()} sales
            </Text>
          </View>
          <TrendingUp size={20} color={Colors.nautical.teal} />
        </View>
      ))}

      {renderRopeDivider()}

      <Text style={styles.sectionTitle}>Sales by Category</Text>
      {analyticsData.salesByCategory.map((category) => (
        <View key={category.category} style={styles.categoryCard}>
          <View style={styles.categoryHeader}>
            <Text style={styles.categoryName}>{category.category}</Text>
            <Text style={styles.categoryValue}>${category.sales.toLocaleString()}</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${category.percentage}%` }]} />
          </View>
          <Text style={styles.categoryPercentage}>{category.percentage}% of total sales</Text>
        </View>
      ))}

      {renderRopeDivider()}

      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActionsGrid}>
        <TouchableOpacity 
          style={styles.quickActionCard}
          onPress={() => setActiveTab('applications')}
        >
          <Users size={32} color={Colors.nautical.teal} />
          <Text style={styles.quickActionText}>Applications</Text>
          {pendingApplications.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pendingApplications.length}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.quickActionCard}
          onPress={() => setActiveTab('events')}
        >
          <Calendar size={32} color={Colors.nautical.teal} />
          <Text style={styles.quickActionText}>Manage Events</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.quickActionCard}
          onPress={() => setActiveTab('announcements')}
        >
          <Bell size={32} color={Colors.nautical.teal} />
          <Text style={styles.quickActionText}>Announcements</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickActionCard}>
          <Music size={32} color={Colors.nautical.teal} />
          <Text style={styles.quickActionText}>Music Settings</Text>
        </TouchableOpacity>
      </View>

      {renderRopeDivider()}

      <Text style={styles.sectionTitle}>Database Connection</Text>
      <TouchableOpacity
        style={styles.testDbButton}
        onPress={async () => {
          console.log('🔍 Testing database connection...');
          await quickCheck();
          console.log('✅ Check complete - see console logs above');
        }}
      >
        <Text style={styles.testDbButtonText}>Test Database Connection</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderApplications = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>
        Pending Vendor Applications ({pendingApplications.length})
      </Text>

      {pendingApplications.map((application) => (
        <TouchableOpacity
          key={application.id}
          style={styles.applicationCard}
          onPress={() => setSelectedApplication(application)}
        >
          <Image source={{ uri: application.avatar }} style={styles.applicationAvatar} />
          <View style={styles.applicationInfo}>
            <Text style={styles.applicationBusinessName}>{application.businessName}</Text>
            <Text style={styles.applicationApplicantName}>{application.applicantName}</Text>
            <Text style={styles.applicationSpecialty}>{application.specialty}</Text>
            <Text style={styles.applicationDate}>Applied: {application.appliedDate}</Text>
          </View>
          <ChevronRight size={20} color={Colors.nautical.driftwood} />
        </TouchableOpacity>
      ))}

      {pendingApplications.length === 0 && (
        <View style={styles.emptyState}>
          <Compass size={48} color={Colors.nautical.sand} />
          <Text style={styles.emptyStateText}>No pending applications</Text>
        </View>
      )}

      <Modal
        visible={selectedApplication !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedApplication(null)}
      >
        {selectedApplication && (
          <View style={styles.modalContainer}>
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setSelectedApplication(null)}>
                  <XCircle size={28} color={Colors.nautical.driftwood} />
                </TouchableOpacity>
                <Compass size={28} color={Colors.nautical.teal} />
              </View>

              <View style={styles.applicationDetailHeader}>
                <Image 
                  source={{ uri: selectedApplication.avatar }} 
                  style={styles.applicationDetailAvatar} 
                />
                <Text style={styles.applicationDetailBusinessName}>
                  {selectedApplication.businessName}
                </Text>
                <Text style={styles.applicationDetailApplicantName}>
                  by {selectedApplication.applicantName}
                </Text>
              </View>

              {renderRopeDivider()}

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Specialty</Text>
                <Text style={styles.detailValue}>{selectedApplication.specialty}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Description</Text>
                <Text style={styles.detailValue}>{selectedApplication.description}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Contact Information</Text>
                <Text style={styles.detailValue}>{selectedApplication.email}</Text>
                <Text style={styles.detailValue}>{selectedApplication.phone}</Text>
                {selectedApplication.websiteUrl && (
                  <Text style={styles.detailValue}>{selectedApplication.websiteUrl}</Text>
                )}
                {selectedApplication.instagramHandle && (
                  <Text style={styles.detailValue}>{selectedApplication.instagramHandle}</Text>
                )}
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Portfolio</Text>
                <View style={styles.portfolioGrid}>
                  {selectedApplication.portfolioImages.map((image, index) => (
                    <Image key={index} source={{ uri: image }} style={styles.portfolioImage} />
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => {
                  console.log('Rejected:', selectedApplication.businessName);
                  setSelectedApplication(null);
                }}
              >
                <XCircle size={20} color={Colors.white} />
                <Text style={styles.actionButtonText}>Reject</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionButton, styles.approveButton]}
                onPress={() => {
                  console.log('Approved:', selectedApplication.businessName);
                  setSelectedApplication(null);
                }}
              >
                <CheckCircle size={20} color={Colors.white} />
                <Text style={styles.actionButtonText}>Approve</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>
    </ScrollView>
  );

  const renderEvents = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.eventHeader}>
        <Text style={styles.sectionTitle}>Manage Fair Events</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push('/admin-event-create')}
        >
          <Text style={styles.addButtonText}>+ New Event</Text>
        </TouchableOpacity>
      </View>

      {events.map((event) => (
        <View key={event.id} style={styles.eventCard}>
          <Image source={{ uri: event.image }} style={styles.eventImage} />
          <View style={styles.eventContent}>
            <View style={styles.eventTitleRow}>
              <Text style={styles.eventTitle}>{event.title}</Text>
              {event.featured && (
                <View style={styles.featuredBadge}>
                  <Star size={14} color={Colors.nautical.mustard} fill={Colors.nautical.mustard} />
                  <Text style={styles.featuredText}>Featured</Text>
                </View>
              )}
            </View>
            <Text style={styles.eventDate}>
              {event.date} - {event.endDate}
            </Text>
            <Text style={styles.eventDescription}>{event.description}</Text>
            <Text style={styles.eventVendors}>{event.vendorCount} vendors registered</Text>

            <View style={styles.eventActions}>
              <TouchableOpacity style={styles.eventActionButton}>
                <Text style={styles.eventActionText}>Edit Details</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.eventActionButton}>
                <Text style={styles.eventActionText}>Set Schedule</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.eventActionButton}>
                <Text style={styles.eventActionText}>Manage Music</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.featureToggle}>
              <Text style={styles.featureToggleLabel}>Feature on entrance page</Text>
              <Switch
                value={event.featured}
                onValueChange={(value) => console.log('Toggle featured:', event.id, value)}
                trackColor={{ false: Colors.nautical.sand, true: Colors.nautical.teal }}
                thumbColor={Colors.white}
              />
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  const renderBilling = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Billing & Payment Settings</Text>
      <Text style={styles.helperText}>
        Vendors pay Overboard North for participation. Shoppers still pay vendors directly.
      </Text>

      <View style={styles.billingSection}>
        <Text style={styles.inputLabel}>Marketplace Fee Type</Text>
        <View style={styles.feeTypeButtons}>
          <TouchableOpacity
            style={[
              styles.feeTypeButton,
              marketplaceFeeType === 'one_time' && styles.feeTypeButtonActive,
            ]}
            onPress={() => setMarketplaceFeeType('one_time')}
          >
            <Text
              style={[
                styles.feeTypeButtonText,
                marketplaceFeeType === 'one_time' && styles.feeTypeButtonTextActive,
              ]}
            >
              One-Time
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.feeTypeButton,
              marketplaceFeeType === 'monthly' && styles.feeTypeButtonActive,
            ]}
            onPress={() => setMarketplaceFeeType('monthly')}
          >
            <Text
              style={[
                styles.feeTypeButtonText,
                marketplaceFeeType === 'monthly' && styles.feeTypeButtonTextActive,
              ]}
            >
              Monthly
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.feeTypeButton,
              marketplaceFeeType === 'annual' && styles.feeTypeButtonActive,
            ]}
            onPress={() => setMarketplaceFeeType('annual')}
          >
            <Text
              style={[
                styles.feeTypeButtonText,
                marketplaceFeeType === 'annual' && styles.feeTypeButtonTextActive,
              ]}
            >
              Annual
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.billingSection}>
        <Text style={styles.inputLabel}>Marketplace Fee Amount</Text>
        <View style={styles.currencyInput}>
          <Text style={styles.currencySymbol}>$</Text>
          <TextInput
            style={styles.amountInput}
            value={marketplaceFeeAmount}
            onChangeText={setMarketplaceFeeAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={Colors.nautical.sand}
          />
          <Text style={styles.currencyCode}>{currency}</Text>
        </View>
      </View>

      <View style={styles.billingSection}>
        <Text style={styles.inputLabel}>Event Participation Fee</Text>
        <View style={styles.currencyInput}>
          <Text style={styles.currencySymbol}>$</Text>
          <TextInput
            style={styles.amountInput}
            value={eventFeeAmount}
            onChangeText={setEventFeeAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={Colors.nautical.sand}
          />
          <Text style={styles.currencyCode}>{currency}</Text>
        </View>
        <Text style={styles.fieldNote}>Fee charged per event vendor participates in</Text>
      </View>

      <View style={styles.billingSection}>
        <Text style={styles.inputLabel}>Currency</Text>
        <View style={styles.currencySelector}>
          <TouchableOpacity
            style={[
              styles.currencyOption,
              currency === 'USD' && styles.currencyOptionActive,
            ]}
            onPress={() => setCurrency('USD')}
          >
            <Text
              style={[
                styles.currencyOptionText,
                currency === 'USD' && styles.currencyOptionTextActive,
              ]}
            >
              $ USD
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.currencyOption,
              currency === 'CAD' && styles.currencyOptionActive,
            ]}
            onPress={() => setCurrency('CAD')}
          >
            <Text
              style={[
                styles.currencyOptionText,
                currency === 'CAD' && styles.currencyOptionTextActive,
              ]}
            >
              $ CAD
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {renderRopeDivider()}

      <View style={styles.billingSection}>
        <Text style={styles.inputLabel}>Payments Provider</Text>
        <View style={styles.providerButtons}>
          <TouchableOpacity
            style={[
              styles.providerButton,
              paymentsProvider === 'stripe' && styles.providerButtonActive,
            ]}
            onPress={() => setPaymentsProvider('stripe')}
          >
            <CreditCard
              size={20}
              color={paymentsProvider === 'stripe' ? Colors.white : Colors.nautical.teal}
            />
            <Text
              style={[
                styles.providerButtonText,
                paymentsProvider === 'stripe' && styles.providerButtonTextActive,
              ]}
            >
              Stripe
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.providerButton,
              paymentsProvider === 'external' && styles.providerButtonActive,
            ]}
            onPress={() => setPaymentsProvider('external')}
          >
            <ExternalLink
              size={20}
              color={paymentsProvider === 'external' ? Colors.white : Colors.nautical.teal}
            />
            <Text
              style={[
                styles.providerButtonText,
                paymentsProvider === 'external' && styles.providerButtonTextActive,
              ]}
            >
              External
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {paymentsProvider === 'stripe' && (
        <>
          <View style={styles.billingSection}>
            <Text style={styles.inputLabel}>Stripe Marketplace Product Price ID</Text>
            <TextInput
              style={styles.stripeInput}
              value={stripeMarketplacePriceId}
              onChangeText={setStripeMarketplacePriceId}
              placeholder="price_xxxxxxxxxxxxx"
              placeholderTextColor={Colors.nautical.sand}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.fieldNote}>Create this in your Stripe Dashboard</Text>
          </View>

          <View style={styles.billingSection}>
            <Text style={styles.inputLabel}>Stripe Event Product Price ID</Text>
            <TextInput
              style={styles.stripeInput}
              value={stripeEventPriceId}
              onChangeText={setStripeEventPriceId}
              placeholder="price_xxxxxxxxxxxxx"
              placeholderTextColor={Colors.nautical.sand}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.fieldNote}>Create this in your Stripe Dashboard</Text>
          </View>
        </>
      )}

      {renderRopeDivider()}

      <TouchableOpacity
        style={styles.saveButton}
        onPress={() => {
          console.log('Saving billing settings:', {
            marketplaceFeeType,
            marketplaceFeeAmount,
            eventFeeAmount,
            currency,
            paymentsProvider,
            stripeMarketplacePriceId,
            stripeEventPriceId,
          });
        }}
      >
        <DollarSign size={20} color={Colors.white} />
        <Text style={styles.saveButtonText}>Save Billing Settings</Text>
      </TouchableOpacity>

      {renderRopeDivider()}

      <Text style={styles.sectionTitle}>Test Checkout Links</Text>
      <Text style={styles.helperText}>
        Preview what vendors will see when they need to pay fees.
      </Text>

      <View style={styles.previewButtons}>
        <TouchableOpacity
          style={styles.previewButton}
          onPress={() => console.log('Preview marketplace checkout')}
        >
          <Package size={18} color={Colors.nautical.teal} />
          <View style={styles.previewButtonContent}>
            <Text style={styles.previewButtonTitle}>Marketplace Fee</Text>
            <Text style={styles.previewButtonAmount}>
              ${marketplaceFeeAmount} {marketplaceFeeType}
            </Text>
          </View>
          <ExternalLink size={18} color={Colors.nautical.driftwood} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.previewButton}
          onPress={() => console.log('Preview event checkout')}
        >
          <Calendar size={18} color={Colors.nautical.teal} />
          <View style={styles.previewButtonContent}>
            <Text style={styles.previewButtonTitle}>Event Fee</Text>
            <Text style={styles.previewButtonAmount}>${eventFeeAmount} per event</Text>
          </View>
          <ExternalLink size={18} color={Colors.nautical.driftwood} />
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );

  const renderVendors = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>
        All Vendors ({vendors.length})
      </Text>
      <Text style={styles.helperText}>
        Click on a vendor to manage their billing settings and fee overrides.
      </Text>

      {vendors.map((vendor) => (
        <TouchableOpacity
          key={vendor.id}
          style={styles.vendorCard}
          onPress={() => router.push(`/admin/vendor/${vendor.id}`)}
        >
          <Image source={{ uri: vendor.avatar }} style={styles.vendorCardAvatar} />
          <View style={styles.vendorCardInfo}>
            <Text style={styles.vendorCardName}>{vendor.name}</Text>
            <Text style={styles.vendorCardSpecialty}>{vendor.specialty}</Text>
            <Text style={styles.vendorCardLocation}>{vendor.location}</Text>
          </View>
          <ChevronRight size={20} color={Colors.nautical.driftwood} />
        </TouchableOpacity>
      ))}

      <View style={{ height: 40 }} />
    </ScrollView>
  );

  const renderAnnouncements = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Send Announcement to All Vendors</Text>

      <View style={styles.announcementSection}>
        <Text style={styles.inputLabel}>Announcement Message</Text>
        <TextInput
          style={styles.announcementInput}
          placeholder="Type your announcement here..."
          placeholderTextColor={Colors.nautical.sand}
          multiline
          numberOfLines={6}
          value={announcement}
          onChangeText={setAnnouncement}
          textAlignVertical="top"
        />

        <TouchableOpacity 
          style={styles.sendButton}
          onPress={() => {
            console.log('Sending announcement:', announcement);
            setAnnouncement('');
          }}
        >
          <Bell size={20} color={Colors.white} />
          <Text style={styles.sendButtonText}>Send to All Vendors</Text>
        </TouchableOpacity>
      </View>

      {renderRopeDivider()}

      <Text style={styles.sectionTitle}>Quick Messages</Text>
      <TouchableOpacity style={styles.quickMessageCard}>
        <Text style={styles.quickMessageText}>
          🎉 Reminder: Weekend live hours are 10 AM - 6 PM EST
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.quickMessageCard}>
        <Text style={styles.quickMessageText}>
          📦 Please update your inventory before the weekend rush
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.quickMessageCard}>
        <Text style={styles.quickMessageText}>
          ⭐ New feature: You can now add video to your booth!
        </Text>
      </TouchableOpacity>

      {renderRopeDivider()}

      <Text style={styles.sectionTitle}>Recent Announcements</Text>
      <View style={styles.announcementHistory}>
        <Text style={styles.historyDate}>Oct 25, 2025</Text>
        <Text style={styles.historyMessage}>
          Welcome to our Fall Harvest Fair! Please ensure all product listings are updated.
        </Text>
      </View>

      <View style={styles.announcementHistory}>
        <Text style={styles.historyDate}>Oct 20, 2025</Text>
        <Text style={styles.historyMessage}>
          New booth customization options are now available in your vendor dashboard.
        </Text>
      </View>
    </ScrollView>
  );

  const handleSignOut = async () => {
    await signOut();
    router.replace('/');
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <HamburgerMenu />
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.logoContainer}>
            <Compass size={32} color={Colors.nautical.teal} />
            <Text style={styles.headerTitle}>Admin Control</Text>
          </View>
          <View style={styles.headerActions}>
            <NotificationBell onPreferencesPress={() => setShowPreferences(true)} />
            <TouchableOpacity
              style={styles.signOutButton}
              onPress={handleSignOut}
              activeOpacity={0.7}
            >
              <LogOut size={20} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.headerSubtitle}>Overboard North Craft Fair</Text>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'dashboard' && styles.activeTab]}
          onPress={() => setActiveTab('dashboard')}
        >
          <TrendingUp size={20} color={activeTab === 'dashboard' ? Colors.nautical.teal : Colors.nautical.driftwood} />
          <Text style={[styles.tabText, activeTab === 'dashboard' && styles.activeTabText]} numberOfLines={1}>
            Dashboard
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'analytics' && styles.activeTab]}
          onPress={() => setActiveTab('analytics')}
        >
          <Package size={20} color={activeTab === 'analytics' ? Colors.nautical.teal : Colors.nautical.driftwood} />
          <Text style={[styles.tabText, activeTab === 'analytics' && styles.activeTabText]} numberOfLines={1}>
            Analytics
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'reports' && styles.activeTab]}
          onPress={() => setActiveTab('reports')}
        >
          <AlertTriangle size={20} color={activeTab === 'reports' ? Colors.nautical.teal : Colors.nautical.driftwood} />
          <Text style={[styles.tabText, activeTab === 'reports' && styles.activeTabText]} numberOfLines={1}>
            Reports
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'applications' && styles.activeTab]}
          onPress={() => setActiveTab('applications')}
        >
          <Users size={20} color={activeTab === 'applications' ? Colors.nautical.teal : Colors.nautical.driftwood} />
          <Text style={[styles.tabText, activeTab === 'applications' && styles.activeTabText]} numberOfLines={1}>
            Applications
          </Text>
          {pendingApplications.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{pendingApplications.length}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'vendors' && styles.activeTab]}
          onPress={() => setActiveTab('vendors')}
        >
          <Users size={20} color={activeTab === 'vendors' ? Colors.nautical.teal : Colors.nautical.driftwood} />
          <Text style={[styles.tabText, activeTab === 'vendors' && styles.activeTabText]} numberOfLines={1}>
            Vendors
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'events' && styles.activeTab]}
          onPress={() => setActiveTab('events')}
        >
          <Calendar size={20} color={activeTab === 'events' ? Colors.nautical.teal : Colors.nautical.driftwood} />
          <Text style={[styles.tabText, activeTab === 'events' && styles.activeTabText]} numberOfLines={1}>
            Events
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'announcements' && styles.activeTab]}
          onPress={() => setActiveTab('announcements')}
        >
          <Bell size={20} color={activeTab === 'announcements' ? Colors.nautical.teal : Colors.nautical.driftwood} />
          <Text style={[styles.tabText, activeTab === 'announcements' && styles.activeTabText]} numberOfLines={1}>
            Announce
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'billing' && styles.activeTab]}
          onPress={() => setActiveTab('billing')}
        >
          <DollarSign size={20} color={activeTab === 'billing' ? Colors.nautical.teal : Colors.nautical.driftwood} />
          <Text style={[styles.tabText, activeTab === 'billing' && styles.activeTabText]} numberOfLines={1}>
            Billing
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'controls' && styles.activeTab]}
          onPress={() => setActiveTab('controls')}
        >
          <CheckCircle size={20} color={activeTab === 'controls' ? Colors.nautical.teal : Colors.nautical.driftwood} />
          <Text style={[styles.tabText, activeTab === 'controls' && styles.activeTabText]} numberOfLines={1}>
            Controls
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'analytics' && <AdminAnalyticsDashboard />}
      {activeTab === 'reports' && <AdminReportsDashboard />}
      {activeTab === 'applications' && renderApplications()}
      {activeTab === 'vendors' && renderVendors()}
      {activeTab === 'events' && renderEvents()}
      {activeTab === 'announcements' && renderAnnouncements()}
      {activeTab === 'billing' && renderBilling()}
      {activeTab === 'controls' && <AdminControlsPanel />}

      <NotificationPreferencesModal
        visible={showPreferences}
        onClose={() => setShowPreferences(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.nautical.sandLight,
  },
  header: {
    backgroundColor: Colors.nautical.oceanDeep,
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.nautical.oceanFoam,
    marginTop: 4,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 2,
    borderBottomColor: Colors.nautical.sand,
  },
  tab: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 2,
    borderRadius: 8,
    gap: 4,
    position: 'relative' as const,
  },
  activeTab: {
    backgroundColor: Colors.nautical.sandLight,
  },
  tabText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.nautical.driftwood,
    textAlign: 'center' as const,
  },
  activeTabText: {
    color: Colors.nautical.teal,
  },
  tabBadge: {
    position: 'absolute' as const,
    top: 4,
    right: 4,
    backgroundColor: Colors.light.terracotta,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700' as const,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.nautical.oceanDeep,
    marginBottom: 16,
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  statIconContainer: {
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.white,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.white,
    opacity: 0.9,
    marginBottom: 2,
  },
  statSubtext: {
    fontSize: 11,
    color: Colors.white,
    opacity: 0.8,
  },
  ropeDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  ropeSegment: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.nautical.driftwood,
    opacity: 0.3,
  },
  compassIcon: {
    marginHorizontal: 12,
  },
  vendorStatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.nautical.sand,
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.nautical.teal,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  vendorStatInfo: {
    flex: 1,
  },
  vendorStatName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.nautical.oceanDeep,
    marginBottom: 4,
  },
  vendorStatDetails: {
    fontSize: 13,
    color: Colors.nautical.driftwood,
  },
  categoryCard: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.nautical.sand,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.nautical.oceanDeep,
  },
  categoryValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.nautical.teal,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.nautical.sandLight,
    borderRadius: 4,
    overflow: 'hidden' as const,
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.nautical.teal,
    borderRadius: 4,
  },
  categoryPercentage: {
    fontSize: 12,
    color: Colors.nautical.driftwood,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap' as const,
    gap: 12,
    marginBottom: 32,
  },
  quickActionCard: {
    width: (width - 56) / 2,
    backgroundColor: Colors.white,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.nautical.sand,
    position: 'relative' as const,
    minHeight: 120,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.nautical.oceanDeep,
    marginTop: 12,
    textAlign: 'center' as const,
  },
  badge: {
    position: 'absolute' as const,
    top: 8,
    right: 8,
    backgroundColor: Colors.light.terracotta,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700' as const,
  },
  applicationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.nautical.sand,
  },
  applicationAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  applicationInfo: {
    flex: 1,
  },
  applicationBusinessName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.nautical.oceanDeep,
    marginBottom: 2,
  },
  applicationApplicantName: {
    fontSize: 14,
    color: Colors.nautical.driftwood,
    marginBottom: 4,
  },
  applicationSpecialty: {
    fontSize: 13,
    color: Colors.nautical.teal,
    fontWeight: '500' as const,
    marginBottom: 2,
  },
  applicationDate: {
    fontSize: 12,
    color: Colors.nautical.sand,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.nautical.driftwood,
    marginTop: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.nautical.sandLight,
  },
  modalContent: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 20,
    backgroundColor: Colors.white,
  },
  applicationDetailHeader: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: Colors.white,
  },
  applicationDetailAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: Colors.nautical.teal,
  },
  applicationDetailBusinessName: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.nautical.oceanDeep,
    marginBottom: 4,
  },
  applicationDetailApplicantName: {
    fontSize: 16,
    color: Colors.nautical.driftwood,
  },
  detailSection: {
    backgroundColor: Colors.white,
    padding: 20,
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.nautical.teal,
    marginBottom: 8,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  detailValue: {
    fontSize: 15,
    color: Colors.nautical.oceanDeep,
    lineHeight: 22,
    marginBottom: 4,
  },
  portfolioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap' as const,
    gap: 8,
    marginTop: 8,
  },
  portfolioImage: {
    width: (width - 64) / 3,
    height: (width - 64) / 3,
    borderRadius: 8,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.nautical.sand,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  approveButton: {
    backgroundColor: Colors.nautical.teal,
  },
  rejectButton: {
    backgroundColor: Colors.light.terracotta,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: Colors.nautical.teal,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700' as const,
  },
  eventCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden' as const,
    borderWidth: 1,
    borderColor: Colors.nautical.sand,
  },
  eventImage: {
    width: '100%',
    height: 160,
  },
  eventContent: {
    padding: 16,
  },
  eventTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.nautical.oceanDeep,
    flex: 1,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.nautical.sandLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    marginLeft: 8,
  },
  featuredText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.nautical.driftwood,
  },
  eventDate: {
    fontSize: 14,
    color: Colors.nautical.teal,
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  eventDescription: {
    fontSize: 14,
    color: Colors.nautical.driftwood,
    lineHeight: 20,
    marginBottom: 8,
  },
  eventVendors: {
    fontSize: 13,
    color: Colors.nautical.oceanDeep,
    fontWeight: '600' as const,
    marginBottom: 16,
  },
  eventActions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  eventActionButton: {
    flex: 1,
    backgroundColor: Colors.nautical.sandLight,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  eventActionText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.nautical.oceanDeep,
  },
  featureToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.nautical.sand,
  },
  featureToggleLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.nautical.oceanDeep,
  },
  announcementSection: {
    backgroundColor: Colors.white,
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.nautical.sand,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.nautical.teal,
    marginBottom: 12,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  announcementInput: {
    backgroundColor: Colors.nautical.sandLight,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: Colors.nautical.oceanDeep,
    minHeight: 120,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.nautical.sand,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.nautical.teal,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  quickMessageCard: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.nautical.sand,
  },
  quickMessageText: {
    fontSize: 15,
    color: Colors.nautical.oceanDeep,
    lineHeight: 22,
  },
  announcementHistory: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.nautical.sand,
  },
  historyDate: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.nautical.teal,
    marginBottom: 6,
    textTransform: 'uppercase' as const,
  },
  historyMessage: {
    fontSize: 14,
    color: Colors.nautical.oceanDeep,
    lineHeight: 20,
  },
  helperText: {
    fontSize: 14,
    color: Colors.nautical.driftwood,
    lineHeight: 20,
    marginBottom: 20,
    backgroundColor: Colors.nautical.sandLight,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.nautical.teal,
  },
  billingSection: {
    backgroundColor: Colors.white,
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.nautical.sand,
  },
  feeTypeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  feeTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.nautical.sand,
    backgroundColor: Colors.white,
    alignItems: 'center',
  },
  feeTypeButtonActive: {
    borderColor: Colors.nautical.teal,
    backgroundColor: Colors.nautical.teal,
  },
  feeTypeButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.nautical.driftwood,
  },
  feeTypeButtonTextActive: {
    color: Colors.white,
  },
  currencyInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.nautical.sandLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.nautical.sand,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.nautical.teal,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.nautical.oceanDeep,
    padding: 0,
  },
  currencyCode: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.nautical.driftwood,
    marginLeft: 8,
  },
  fieldNote: {
    fontSize: 12,
    color: Colors.nautical.driftwood,
    marginTop: 8,
    fontStyle: 'italic' as const,
  },
  currencySelector: {
    flexDirection: 'row',
    gap: 8,
  },
  currencyOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.nautical.sand,
    backgroundColor: Colors.white,
    alignItems: 'center',
  },
  currencyOptionActive: {
    borderColor: Colors.nautical.teal,
    backgroundColor: Colors.nautical.sandLight,
  },
  currencyOptionText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.nautical.driftwood,
  },
  currencyOptionTextActive: {
    color: Colors.nautical.teal,
  },
  providerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  providerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.nautical.teal,
    backgroundColor: Colors.white,
    gap: 8,
  },
  providerButtonActive: {
    backgroundColor: Colors.nautical.teal,
  },
  providerButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.nautical.teal,
  },
  providerButtonTextActive: {
    color: Colors.white,
  },
  stripeInput: {
    backgroundColor: Colors.nautical.sandLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.nautical.sand,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: 'Courier' as const,
    color: Colors.nautical.oceanDeep,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.nautical.teal,
    padding: 18,
    borderRadius: 12,
    gap: 8,
    marginBottom: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  previewButtons: {
    gap: 12,
    marginTop: 16,
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.nautical.sand,
    gap: 12,
  },
  previewButtonContent: {
    flex: 1,
  },
  previewButtonTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.nautical.oceanDeep,
    marginBottom: 4,
  },
  previewButtonAmount: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.nautical.teal,
  },
  vendorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.nautical.sand,
  },
  vendorCardAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  vendorCardInfo: {
    flex: 1,
  },
  vendorCardName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.nautical.oceanDeep,
    marginBottom: 4,
  },
  vendorCardSpecialty: {
    fontSize: 14,
    color: Colors.nautical.teal,
    fontWeight: '500' as const,
    marginBottom: 2,
  },
  vendorCardLocation: {
    fontSize: 12,
    color: Colors.nautical.driftwood,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  signOutButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 8,
  },
  testDbButton: {
    backgroundColor: Colors.nautical.teal,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  testDbButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
  },
});
