import { useCustomerAuth } from '../contexts/CustomerAuthContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { useSavedForLater } from '../contexts/SavedForLaterContext';
import { useCart } from '../contexts/CartContext';
import Colors from '../../constants/colors';
import HamburgerMenu from '../components/HamburgerMenu';
import { router, Href } from 'expo-router';
import { User, Mail, Phone, Bell, Heart, LogOut, LogIn, Edit2, Save, X, Bookmark, ShoppingCart, Trash2, HelpCircle, Package, Settings } from 'lucide-react-native';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomerNotificationBell from '@/app/components/CustomerNotificationBell';
import CustomerNotificationPreferencesModal from '@/app/components/CustomerNotificationPreferencesModal';

export default function ProfileScreen() {
  const { isAuthenticated, profile, signOut, updateProfile } = useCustomerAuth();
  const { favorites } = useFavorites();
  const { savedItems, moveToCart, removeItem } = useSavedForLater();
  const { addItem } = useCart();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showNotificationPrefs, setShowNotificationPrefs] = useState(false);
  
  const [editedName, setEditedName] = useState(profile?.name || '');
  const [editedPhone, setEditedPhone] = useState(profile?.phone || '');
  const [editedWantsSms, setEditedWantsSms] = useState(profile?.wants_sms_notifications || false);

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
          },
        },
      ]
    );
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    const result = await updateProfile({
      name: editedName,
      phone: editedPhone || undefined,
      wants_sms_notifications: editedWantsSms,
    });
    setIsSaving(false);

    if (result.success) {
      setIsEditing(false);
    } else {
      Alert.alert('Error', result.error || 'Failed to update profile');
    }
  };

  const handleCancelEdit = () => {
    setEditedName(profile?.name || '');
    setEditedPhone(profile?.phone || '');
    setEditedWantsSms(profile?.wants_sms_notifications || false);
    setIsEditing(false);
  };

  const handleMoveToCart = async (productId: string, customizations?: string) => {
    const item = moveToCart(productId, customizations);
    if (item) {
      await addItem(
        item.product,
        { id: item.product.vendorId, name: item.product.vendorName } as any,
        item.quantity,
        item.customizations,
        item.requires_proof
      );
      Alert.alert('Added to Cart', 'Item moved to your cart');
    }
  };

  const handleRemoveSaved = async (productId: string, customizations?: string) => {
    Alert.alert(
      'Remove Item',
      'Remove this item from Saved for Later?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeItem(productId, customizations) },
      ]
    );
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.topBar}>
          <HamburgerMenu />
          <CustomerNotificationBell />
        </View>
        <View style={styles.guestContainer}>
          <View style={styles.guestIcon}>
            <User size={64} color={Colors.light.tint} />
          </View>
          <Text style={styles.guestTitle}>Sign In to Your Account</Text>
          <Text style={styles.guestDescription}>
            Create an account or sign in to save your cart, favorite vendors, and get notified about upcoming events.
          </Text>
          <TouchableOpacity
            style={styles.signInButton}
            onPress={() => router.push('/customer-auth')}
          >
            <LogIn size={20} color="#fff" />
            <Text style={styles.signInButtonText}>Sign In / Sign Up</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.guestHelpButton}
            onPress={() => router.push('/faq' as Href)}
            activeOpacity={0.7}
          >
            <HelpCircle size={20} color={Colors.nautical.teal} />
            <Text style={styles.guestHelpButtonText}>FAQ & Support</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <HamburgerMenu />
        <CustomerNotificationBell />
      </View>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <User size={48} color={Colors.light.tint} />
          </View>
          <Text style={styles.name}>{profile?.name}</Text>
          <Text style={styles.email}>{profile?.email}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Account Information</Text>
            {!isEditing && (
              <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.editButton}>
                <Edit2 size={18} color={Colors.light.tint} />
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.card}>
            <View style={styles.infoRow}>
              <User size={20} color="#666" style={styles.infoIcon} />
              {isEditing ? (
                <TextInput
                  style={styles.infoInput}
                  value={editedName}
                  onChangeText={setEditedName}
                  placeholder="Full Name"
                  placeholderTextColor="#999"
                />
              ) : (
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Name</Text>
                  <Text style={styles.infoValue}>{profile?.name}</Text>
                </View>
              )}
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Mail size={20} color="#666" style={styles.infoIcon} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{profile?.email}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Phone size={20} color="#666" style={styles.infoIcon} />
              {isEditing ? (
                <TextInput
                  style={styles.infoInput}
                  value={editedPhone}
                  onChangeText={setEditedPhone}
                  placeholder="Phone (optional)"
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                />
              ) : (
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Phone</Text>
                  <Text style={styles.infoValue}>{profile?.phone || 'Not provided'}</Text>
                </View>
              )}
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Bell size={20} color="#666" style={styles.infoIcon} />
              <View style={[styles.infoContent, { flex: 1 }]}>
                <Text style={styles.infoLabel}>SMS Notifications</Text>
                <Text style={styles.infoSubtext}>We'll notify you about upcoming events. We'll never spam you.</Text>
              </View>
              <Switch
                value={isEditing ? editedWantsSms : profile?.wants_sms_notifications}
                onValueChange={isEditing ? setEditedWantsSms : undefined}
                disabled={!isEditing}
                trackColor={{ false: '#ddd', true: Colors.light.tint }}
              />
            </View>
          </View>

          {isEditing && (
            <View style={styles.editActions}>
              <TouchableOpacity
                style={[styles.editActionButton, styles.cancelButton]}
                onPress={handleCancelEdit}
                disabled={isSaving}
              >
                <X size={20} color="#666" />
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editActionButton, styles.saveButton]}
                onPress={handleSaveProfile}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Save size={20} color="#fff" />
                    <Text style={styles.saveButtonText}>Save</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Saved for Later</Text>
          <View style={styles.card}>
            {savedItems.length === 0 ? (
              <View style={styles.emptyState}>
                <Bookmark size={32} color="#ccc" />
                <Text style={styles.emptyStateText}>No saved items</Text>
                <Text style={styles.emptyStateSubtext}>
                  Save items from your cart to revisit them later
                </Text>
              </View>
            ) : (
              savedItems.map((item, index) => (
                <React.Fragment key={`${item.product.id}-${index}`}>
                  {index > 0 && <View style={styles.divider} />}
                  <View style={styles.savedItemRow}>
                    <Image
                      source={{ uri: item.product.image }}
                      style={styles.savedItemImage}
                      contentFit="cover"
                    />
                    <View style={styles.savedItemInfo}>
                      <Text style={styles.savedItemName} numberOfLines={2}>{item.product.name}</Text>
                      <Text style={styles.savedItemPrice}>${item.product.price} × {item.quantity}</Text>
                      <Text style={styles.savedItemVendor}>{item.product.vendorName}</Text>
                    </View>
                    <View style={styles.savedItemActions}>
                      <TouchableOpacity
                        style={styles.savedActionButton}
                        onPress={() => handleMoveToCart(item.product.id, JSON.stringify(item.customizations))}
                      >
                        <ShoppingCart size={18} color={Colors.light.tint} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.savedActionButton}
                        onPress={() => handleRemoveSaved(item.product.id, JSON.stringify(item.customizations))}
                      >
                        <Trash2 size={18} color={Colors.light.muted} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </React.Fragment>
              ))
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Favorite Vendors</Text>
          <View style={styles.card}>
            {favorites.length === 0 ? (
              <View style={styles.emptyState}>
                <Heart size={32} color="#ccc" />
                <Text style={styles.emptyStateText}>No favorite vendors yet</Text>
                <Text style={styles.emptyStateSubtext}>
                  Add vendors to favorites to quickly access them later
                </Text>
              </View>
            ) : (
              favorites.map((fav, index) => (
                <React.Fragment key={fav.vendorId}>
                  {index > 0 && <View style={styles.divider} />}
                  <TouchableOpacity
                    style={styles.favoriteRow}
                    onPress={() => router.push(`/vendor/${fav.vendorId}` as Href)}
                  >
                    <Heart size={20} color={Colors.light.terracotta} fill={Colors.light.terracotta} />
                    <Text style={styles.favoriteVendorName}>{fav.vendorName}</Text>
                  </TouchableOpacity>
                </React.Fragment>
              ))
            )}
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.ordersButton}
            onPress={() => router.push('/past-purchases' as Href)}
            activeOpacity={0.7}
          >
            <Package size={20} color={Colors.white} />
            <Text style={styles.ordersButtonText}>Past Purchases</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.notificationSettingsButton}
            onPress={() => setShowNotificationPrefs(true)}
            activeOpacity={0.7}
          >
            <Settings size={20} color={Colors.light.tint} />
            <Text style={styles.notificationSettingsButtonText}>Notification Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.helpButton}
            onPress={() => router.push('/faq' as Href)}
            activeOpacity={0.7}
          >
            <HelpCircle size={20} color={Colors.nautical.teal} />
            <Text style={styles.helpButtonText}>FAQ & Support</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <LogOut size={20} color="#ff3b30" />
            <Text style={styles.signOutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <CustomerNotificationPreferencesModal
        visible={showNotificationPrefs}
        onClose={() => setShowNotificationPrefs(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.nautical.oceanDeep,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  scrollView: {
    flex: 1,
  },
  guestContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  guestIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  guestTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.white,
    marginBottom: 12,
    textAlign: 'center',
  },
  guestDescription: {
    fontSize: 16,
    fontWeight: '400' as const,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.light.sunsetCoral,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  signInButtonText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#fff',
  },
  guestHelpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.nautical.teal,
    backgroundColor: 'transparent',
    marginTop: 16,
  },
  guestHelpButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.nautical.teal,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.white,
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    fontWeight: '400' as const,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.tint,
  },
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoIcon: {
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: Colors.light.mediumGray,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: Colors.light.charcoal,
    fontWeight: '500' as const,
  },
  infoSubtext: {
    fontSize: 13,
    fontWeight: '400' as const,
    color: Colors.light.muted,
    marginTop: 2,
  },
  infoInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400' as const,
    color: Colors.light.charcoal,
    padding: 8,
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.border,
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  editActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  cancelButton: {
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#666',
  },
  saveButton: {
    backgroundColor: Colors.light.sunsetCoral,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#999',
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 4,
    textAlign: 'center',
  },
  favoriteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  favoriteVendorName: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: Colors.light.charcoal,
    flex: 1,
  },
  savedItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  savedItemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  savedItemInfo: {
    flex: 1,
  },
  savedItemName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.light.charcoal,
    marginBottom: 4,
  },
  savedItemPrice: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.light.tint,
    marginBottom: 2,
  },
  savedItemVendor: {
    fontSize: 13,
    color: Colors.light.muted,
  },
  savedItemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  savedActionButton: {
    padding: 8,
    backgroundColor: Colors.light.background,
    borderRadius: 8,
  },
  ordersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: Colors.nautical.teal,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  ordersButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  notificationSettingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: Colors.light.card,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.tint,
    marginBottom: 12,
  },
  notificationSettingsButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.light.tint,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: Colors.light.card,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.nautical.teal,
    marginBottom: 12,
  },
  helpButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.nautical.teal,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: Colors.light.card,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ff3b30',
  },
  signOutButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#ff3b30',
  },
});
