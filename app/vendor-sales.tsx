import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { ArrowLeft, Plus, Calendar, Tag, Percent, Gift, Edit, Trash2 } from 'lucide-react-native';
import { useVendorSales, VendorSale, DiscountType, AppliesToScope } from '@/app/contexts/VendorSalesContext';
import { useVendorAuth } from '@/app/contexts/VendorAuthContext';
import Colors from '@/app/constants/colors';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function VendorSalesScreen() {
  const { profile: vendor } = useVendorAuth();
  const { isLoading: loading, fetchMySales, createSale, updateSale, deleteSale } = useVendorSales();
  const [sales, setSales] = React.useState<VendorSale[]>([]);

  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [editingSaleId, setEditingSaleId] = useState<string | null>(null);

  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [discountType, setDiscountType] = useState<DiscountType>('percentage');
  const [discountValue, setDiscountValue] = useState<string>('');
  const [buyQty, setBuyQty] = useState<string>('');
  const [getQty, setGetQty] = useState<string>('');
  const [appliesTo, setAppliesTo] = useState<AppliesToScope>('storewide');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const [showStartPicker, setShowStartPicker] = useState<boolean>(false);
  const [showEndPicker, setShowEndPicker] = useState<boolean>(false);

  const [filterTab, setFilterTab] = useState<'upcoming' | 'active' | 'expired'>('active');

  useEffect(() => {
    if (vendor) {
      fetchMySales().then(setSales);
    } else {
      router.replace('/vendor-auth');
    }
  }, [vendor]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDiscountType('percentage');
    setDiscountValue('');
    setBuyQty('');
    setGetQty('');
    setAppliesTo('storewide');
    setStartDate(new Date());
    setEndDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    setEditingSaleId(null);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a sale title');
      return;
    }

    if (discountType !== 'bogo' && !discountValue) {
      Alert.alert('Error', 'Please enter a discount value');
      return;
    }

    if (discountType === 'bogo' && (!buyQty || !getQty)) {
      Alert.alert('Error', 'Please enter buy and get quantities for BOGO');
      return;
    }

    if (endDate <= startDate) {
      Alert.alert('Error', 'End date must be after start date');
      return;
    }

    const input: Omit<VendorSale, 'id' | 'vendor_id' | 'active' | 'created_at' | 'updated_at'> = {
      title: title.trim(),
      description: description.trim() || undefined,
      discount_type: discountType,
      discount_value: discountType !== 'bogo' ? parseFloat(discountValue) : undefined,
      buy_qty: discountType === 'bogo' ? parseInt(buyQty, 10) : undefined,
      get_qty: discountType === 'bogo' ? parseInt(getQty, 10) : undefined,
      applies_to: appliesTo,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
    };

    if (editingSaleId) {
      const result = await updateSale(editingSaleId, input);
      if (result.success) {
        fetchMySales().then(setSales);
        Alert.alert('Success', 'Sale updated successfully');
        resetForm();
        setShowCreateForm(false);
      } else {
        Alert.alert('Error', 'Failed to update sale');
      }
    } else {
      const result = await createSale(input);
      if (result.success) {
        fetchMySales().then(setSales);
        Alert.alert('Success', 'Sale created successfully');
        resetForm();
        setShowCreateForm(false);
      } else {
        Alert.alert('Error', 'Failed to create sale');
      }
    }
  };

  const handleEdit = (sale: VendorSale) => {
    setEditingSaleId(sale.id);
    setTitle(sale.title);
    setDescription(sale.description || '');
    setDiscountType(sale.discount_type);
    setDiscountValue(sale.discount_value?.toString() || '');
    setBuyQty(sale.buy_qty?.toString() || '');
    setGetQty(sale.get_qty?.toString() || '');
    setAppliesTo(sale.applies_to);
    setStartDate(new Date(sale.start_date));
    setEndDate(new Date(sale.end_date));
    setShowCreateForm(true);
  };

  const handleDelete = (saleId: string) => {
    Alert.alert('Delete Sale', 'Are you sure you want to delete this sale?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const result = await deleteSale(saleId);
          if (result.success) {
            fetchMySales().then(setSales);
            Alert.alert('Success', 'Sale deleted');
          } else {
            Alert.alert('Error', 'Failed to delete sale');
          }
        },
      },
    ]);
  };

  const filteredSales = sales.filter((sale) => {
    const now = new Date();
    const start = new Date(sale.start_date);
    const end = new Date(sale.end_date);

    if (filterTab === 'active') return now >= start && now <= end;
    if (filterTab === 'upcoming') return now < start;
    if (filterTab === 'expired') return now > end;
    return false;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDiscountLabel = (sale: VendorSale): string => {
    if (sale.discount_type === 'percentage') {
      return `${sale.discount_value}% off`;
    } else if (sale.discount_type === 'flat') {
      return `$${sale.discount_value} off`;
    } else if (sale.discount_type === 'bogo') {
      return `Buy ${sale.buy_qty}, Get ${sale.get_qty}`;
    }
    return '';
  };

  if (!vendor) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.dark.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sales & Promotions</Text>
        <TouchableOpacity
          onPress={() => {
            resetForm();
            setShowCreateForm(!showCreateForm);
          }}
          style={styles.addButton}
        >
          <Plus size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {showCreateForm && (
          <View style={styles.form}>
            <Text style={styles.formTitle}>{editingSaleId ? 'Edit Sale' : 'Create New Sale'}</Text>

            <Text style={styles.label}>Sale Title *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., Spring Craft Sale"
              placeholderTextColor={Colors.light.tabIconDefault}
            />

            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Details about your sale..."
              placeholderTextColor={Colors.light.tabIconDefault}
              multiline
              numberOfLines={3}
            />

            <Text style={styles.label}>Discount Type *</Text>
            <View style={styles.discountTypeRow}>
              <TouchableOpacity
                style={[styles.typeButton, discountType === 'percentage' && styles.typeButtonActive]}
                onPress={() => setDiscountType('percentage')}
              >
                <Percent size={18} color={discountType === 'percentage' ? '#fff' : Colors.primary} />
                <Text
                  style={[styles.typeButtonText, discountType === 'percentage' && styles.typeButtonTextActive]}
                >
                  Percent
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, discountType === 'flat' && styles.typeButtonActive]}
                onPress={() => setDiscountType('flat')}
              >
                <Tag size={18} color={discountType === 'flat' ? '#fff' : Colors.primary} />
                <Text style={[styles.typeButtonText, discountType === 'flat' && styles.typeButtonTextActive]}>
                  Flat $
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, discountType === 'bogo' && styles.typeButtonActive]}
                onPress={() => setDiscountType('bogo')}
              >
                <Gift size={18} color={discountType === 'bogo' ? '#fff' : Colors.primary} />
                <Text style={[styles.typeButtonText, discountType === 'bogo' && styles.typeButtonTextActive]}>
                  BOGO
                </Text>
              </TouchableOpacity>
            </View>

            {discountType !== 'bogo' ? (
              <>
                <Text style={styles.label}>
                  Discount Value * {discountType === 'percentage' ? '(%)' : '($)'}
                </Text>
                <TextInput
                  style={styles.input}
                  value={discountValue}
                  onChangeText={setDiscountValue}
                  placeholder={discountType === 'percentage' ? '20' : '5'}
                  placeholderTextColor={Colors.light.tabIconDefault}
                  keyboardType="numeric"
                />
              </>
            ) : (
              <View style={styles.bogoRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Buy Qty *</Text>
                  <TextInput
                    style={styles.input}
                    value={buyQty}
                    onChangeText={setBuyQty}
                    placeholder="2"
                    placeholderTextColor={Colors.light.tabIconDefault}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Get Qty *</Text>
                  <TextInput
                    style={styles.input}
                    value={getQty}
                    onChangeText={setGetQty}
                    placeholder="1"
                    placeholderTextColor={Colors.light.tabIconDefault}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            )}

            <Text style={styles.label}>Applies To</Text>
            <View style={styles.discountTypeRow}>
              <TouchableOpacity
                style={[styles.typeButton, appliesTo === 'storewide' && styles.typeButtonActive]}
                onPress={() => setAppliesTo('storewide')}
              >
                <Text style={[styles.typeButtonText, appliesTo === 'storewide' && styles.typeButtonTextActive]}>
                  Storewide
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Start Date *</Text>
            <TouchableOpacity style={styles.dateButton} onPress={() => setShowStartPicker(true)}>
              <Calendar size={18} color={Colors.primary} />
              <Text style={styles.dateButtonText}>{startDate.toLocaleDateString()}</Text>
            </TouchableOpacity>
            {showStartPicker && (
              <DateTimePicker
                value={startDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, date) => {
                  setShowStartPicker(false);
                  if (date) setStartDate(date);
                }}
              />
            )}

            <Text style={styles.label}>End Date *</Text>
            <TouchableOpacity style={styles.dateButton} onPress={() => setShowEndPicker(true)}>
              <Calendar size={18} color={Colors.primary} />
              <Text style={styles.dateButtonText}>{endDate.toLocaleDateString()}</Text>
            </TouchableOpacity>
            {showEndPicker && (
              <DateTimePicker
                value={endDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, date) => {
                  setShowEndPicker(false);
                  if (date) setEndDate(date);
                }}
              />
            )}

            <View style={styles.formActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  resetForm();
                  setShowCreateForm(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>{editingSaleId ? 'Update' : 'Create'} Sale</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.filterTabs}>
          <TouchableOpacity
            style={[styles.filterTab, filterTab === 'upcoming' && styles.filterTabActive]}
            onPress={() => setFilterTab('upcoming')}
          >
            <Text style={[styles.filterTabText, filterTab === 'upcoming' && styles.filterTabTextActive]}>
              Upcoming
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filterTab === 'active' && styles.filterTabActive]}
            onPress={() => setFilterTab('active')}
          >
            <Text style={[styles.filterTabText, filterTab === 'active' && styles.filterTabTextActive]}>Active</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filterTab === 'expired' && styles.filterTabActive]}
            onPress={() => setFilterTab('expired')}
          >
            <Text style={[styles.filterTabText, filterTab === 'expired' && styles.filterTabTextActive]}>
              Expired
            </Text>
          </TouchableOpacity>
        </View>

        {loading && sales.length === 0 ? (
          <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
        ) : filteredSales.length === 0 ? (
          <View style={styles.emptyState}>
            <Tag size={48} color={Colors.light.tabIconDefault} />
            <Text style={styles.emptyStateText}>No {filterTab} sales</Text>
            {filterTab === 'active' && (
              <Text style={styles.emptyStateSubtext}>Create your first sale to get started</Text>
            )}
          </View>
        ) : (
          filteredSales.map((sale) => (
            <View key={sale.id} style={styles.saleCard}>
              <View style={styles.saleHeader}>
                <Text style={styles.saleTitle}>{sale.title}</Text>
                <View style={styles.saleActions}>
                  <TouchableOpacity onPress={() => handleEdit(sale)} style={styles.iconButton}>
                    <Edit size={18} color={Colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(sale.id)} style={styles.iconButton}>
                    <Trash2 size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>

              {sale.description && <Text style={styles.saleDescription}>{sale.description}</Text>}

              <View style={styles.saleDetails}>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountBadgeText}>{getDiscountLabel(sale)}</Text>
                </View>
                <Text style={styles.appliesToText}>{sale.applies_to}</Text>
              </View>

              <View style={styles.saleDates}>
                <Text style={styles.saleDateText}>
                  {formatDate(sale.start_date)} - {formatDate(sale.end_date)}
                </Text>
              </View>

              {sale.active && <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>ACTIVE NOW</Text>
              </View>}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.dark.text,
  },
  addButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.dark.text,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.dark.text,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.dark.text,
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  discountTypeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  typeButtonActive: {
    backgroundColor: Colors.primary,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  bogoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  dateButtonText: {
    fontSize: 16,
    color: Colors.dark.text,
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  filterTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.dark.text,
  },
  filterTabTextActive: {
    color: '#fff',
  },
  loader: {
    marginTop: 40,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.dark.text,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    marginTop: 8,
    textAlign: 'center',
  },
  saleCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  saleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  saleTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.dark.text,
  },
  saleActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 4,
  },
  saleDescription: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    marginBottom: 12,
  },
  saleDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  discountBadge: {
    backgroundColor: Colors.primary,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  discountBadgeText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#fff',
  },
  appliesToText: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
    textTransform: 'capitalize',
  },
  saleDates: {
    marginTop: 8,
  },
  saleDateText: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
  },
  activeBadge: {
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#dcfce7',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  activeBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#16a34a',
  },
});
