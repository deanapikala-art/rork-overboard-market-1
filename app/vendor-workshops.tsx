import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ArrowLeft, 
  Plus, 
  Calendar, 
  MapPin, 
  Video, 
  Users, 
  Edit2, 
  Trash2,
  Clock,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useWorkshops, Workshop, WorkshopType, WorkshopStatus } from '@/app/contexts/WorkshopsContext';
import { useVendorAuth } from '@/app/contexts/VendorAuthContext';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function VendorWorkshopsScreen() {
  const router = useRouter();
  const { profile } = useVendorAuth();
  const {
    workshops,
    fetchMyWorkshops,
    createWorkshop,
    updateWorkshop,
    deleteWorkshop,
    fetchWorkshopRegistrations,
  } = useWorkshops();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingWorkshop, setEditingWorkshop] = useState<Workshop | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | WorkshopStatus>('all');

  useEffect(() => {
    if (profile) {
      fetchMyWorkshops();
    }
  }, [profile, fetchMyWorkshops]);

  const handleViewRegistrations = async (workshop: Workshop) => {
    const registrations = await fetchWorkshopRegistrations(workshop.id);
    Alert.alert(
      `${workshop.title} - Registrations`,
      `${registrations.length} / ${workshop.max_attendees} attendees\n\n` +
        registrations.map(r => 
          `• ${r.user?.display_name || r.user?.email}\n  ${r.attendance_status} (${r.payment_status})`
        ).join('\n'),
      [{ text: 'OK' }]
    );
  };

  const handleDeleteWorkshop = (workshopId: string) => {
    Alert.alert(
      'Delete Workshop',
      'Are you sure you want to delete this workshop? All registrations will be removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteWorkshop(workshopId);
            if (result.success) {
              Alert.alert('Success', 'Workshop deleted');
            } else {
              Alert.alert('Error', result.error || 'Failed to delete workshop');
            }
          },
        },
      ]
    );
  };

  const filteredWorkshops = filterStatus === 'all' 
    ? workshops 
    : workshops.filter(w => w.status === filterStatus);

  const upcomingCount = workshops.filter(w => w.status === 'published' || w.status === 'full').length;
  const draftCount = workshops.filter(w => w.status === 'draft').length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Workshops</Text>
        <TouchableOpacity 
          onPress={() => setShowCreateModal(true)}
          style={styles.addButton}
        >
          <Plus size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{upcomingCount}</Text>
          <Text style={styles.statLabel}>Upcoming</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{draftCount}</Text>
          <Text style={styles.statLabel}>Drafts</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{workshops.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>

      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {(['all', 'published', 'draft', 'completed'] as const).map((status) => (
            <TouchableOpacity
              key={status}
              onPress={() => setFilterStatus(status)}
              style={[
                styles.filterChip,
                filterStatus === status && styles.filterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filterStatus === status && styles.filterChipTextActive,
                ]}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {filteredWorkshops.length === 0 ? (
          <View style={styles.emptyState}>
            <Calendar size={48} color={Colors.textLight} />
            <Text style={styles.emptyText}>No workshops yet</Text>
            <Text style={styles.emptySubtext}>
              Create your first workshop to start hosting classes and events
            </Text>
            <TouchableOpacity
              onPress={() => setShowCreateModal(true)}
              style={styles.emptyButton}
            >
              <Plus size={20} color="#fff" />
              <Text style={styles.emptyButtonText}>Create Workshop</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredWorkshops.map((workshop) => (
            <View key={workshop.id} style={styles.workshopCard}>
              <View style={styles.workshopHeader}>
                <View style={styles.workshopType}>
                  {workshop.type === 'in_person' ? (
                    <MapPin size={16} color={Colors.primary} />
                  ) : (
                    <Video size={16} color={Colors.secondary} />
                  )}
                  <Text style={styles.workshopTypeText}>
                    {workshop.type === 'in_person' ? 'In-Person' : 'Online'}
                  </Text>
                </View>
                <View style={styles.workshopActions}>
                  <TouchableOpacity
                    onPress={() => {
                      setEditingWorkshop(workshop);
                      setShowCreateModal(true);
                    }}
                    style={styles.iconButton}
                  >
                    <Edit2 size={18} color={Colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteWorkshop(workshop.id)}
                    style={styles.iconButton}
                  >
                    <Trash2 size={18} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.workshopTitle}>{workshop.title}</Text>
              <Text style={styles.workshopDescription} numberOfLines={2}>
                {workshop.description}
              </Text>

              <View style={styles.workshopMeta}>
                <View style={styles.metaItem}>
                  <Calendar size={14} color={Colors.textLight} />
                  <Text style={styles.metaText}>
                    {new Date(workshop.date).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Clock size={14} color={Colors.textLight} />
                  <Text style={styles.metaText}>
                    {workshop.start_time} - {workshop.end_time}
                  </Text>
                </View>
              </View>

              <View style={styles.workshopFooter}>
                <View style={styles.attendeesInfo}>
                  <Users size={16} color={Colors.textLight} />
                  <Text style={styles.attendeesText}>
                    {workshop.registrations_count || 0} / {workshop.max_attendees}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleViewRegistrations(workshop)}
                  style={styles.viewButton}
                >
                  <Text style={styles.viewButtonText}>View Attendees</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <WorkshopFormModal
        visible={showCreateModal}
        workshop={editingWorkshop}
        onClose={() => {
          setShowCreateModal(false);
          setEditingWorkshop(null);
        }}
        onSave={async (data) => {
          if (editingWorkshop) {
            const result = await updateWorkshop(editingWorkshop.id, data);
            if (result.success) {
              Alert.alert('Success', 'Workshop updated');
              setShowCreateModal(false);
              setEditingWorkshop(null);
            } else {
              Alert.alert('Error', result.error || 'Failed to update workshop');
            }
          } else {
            const result = await createWorkshop(data as any);
            if (result.success) {
              Alert.alert('Success', 'Workshop created');
              setShowCreateModal(false);
            } else {
              Alert.alert('Error', result.error || 'Failed to create workshop');
            }
          }
        }}
      />
    </SafeAreaView>
  );
}

function WorkshopFormModal({
  visible,
  workshop,
  onClose,
  onSave,
}: {
  visible: boolean;
  workshop: Workshop | null;
  onClose: () => void;
  onSave: (data: Partial<Workshop>) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<WorkshopType>('in_person');
  const [date, setDate] = useState(new Date());
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('12:00');
  const [location, setLocation] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [meetingPassword, setMeetingPassword] = useState('');
  const [maxAttendees, setMaxAttendees] = useState('20');
  const [priceCents, setPriceCents] = useState('0');
  const [paymentLink, setPaymentLink] = useState('');
  const [materials, setMaterials] = useState('');
  const [status, setStatus] = useState<WorkshopStatus>('draft');
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (workshop) {
      setTitle(workshop.title);
      setDescription(workshop.description);
      setType(workshop.type);
      setDate(new Date(workshop.date));
      setStartTime(workshop.start_time);
      setEndTime(workshop.end_time);
      setLocation(workshop.location || '');
      setMeetingLink(workshop.meeting_link || '');
      setMeetingPassword(workshop.meeting_password || '');
      setMaxAttendees(workshop.max_attendees.toString());
      setPriceCents(workshop.price_cents.toString());
      setPaymentLink(workshop.payment_link || '');
      setMaterials(workshop.materials || '');
      setStatus(workshop.status);
    } else {
      setTitle('');
      setDescription('');
      setType('in_person');
      setDate(new Date());
      setStartTime('10:00');
      setEndTime('12:00');
      setLocation('');
      setMeetingLink('');
      setMeetingPassword('');
      setMaxAttendees('20');
      setPriceCents('0');
      setPaymentLink('');
      setMaterials('');
      setStatus('draft');
    }
  }, [workshop, visible]);

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Title is required');
      return;
    }
    if (type === 'in_person' && !location.trim()) {
      Alert.alert('Error', 'Location is required for in-person workshops');
      return;
    }
    if (type === 'online' && !meetingLink.trim()) {
      Alert.alert('Error', 'Meeting link is required for online workshops');
      return;
    }

    onSave({
      title,
      description,
      type,
      date: date.toISOString().split('T')[0],
      start_time: startTime,
      end_time: endTime,
      location: type === 'in_person' ? location : undefined,
      meeting_link: type === 'online' ? meetingLink : undefined,
      meeting_password: type === 'online' ? meetingPassword : undefined,
      max_attendees: parseInt(maxAttendees) || 20,
      price_cents: parseInt(priceCents) || 0,
      payment_link: paymentLink || undefined,
      materials: materials || undefined,
      status,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer} edges={['top']}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {workshop ? 'Edit Workshop' : 'New Workshop'}
          </Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.modalSave}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Workshop Type</Text>
            <View style={styles.typeSelector}>
              <TouchableOpacity
                onPress={() => setType('in_person')}
                style={[
                  styles.typeOption,
                  type === 'in_person' && styles.typeOptionActive,
                ]}
              >
                <MapPin size={20} color={type === 'in_person' ? '#fff' : Colors.text} />
                <Text
                  style={[
                    styles.typeOptionText,
                    type === 'in_person' && styles.typeOptionTextActive,
                  ]}
                >
                  In-Person
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setType('online')}
                style={[
                  styles.typeOption,
                  type === 'online' && styles.typeOptionActive,
                ]}
              >
                <Video size={20} color={type === 'online' ? '#fff' : Colors.text} />
                <Text
                  style={[
                    styles.typeOptionText,
                    type === 'online' && styles.typeOptionTextActive,
                  ]}
                >
                  Online
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Title *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Workshop title"
              placeholderTextColor={Colors.textLight}
            />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe what attendees will learn"
              placeholderTextColor={Colors.textLight}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Date</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.inputText}>{date.toLocaleDateString()}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (selectedDate) {
                    setDate(selectedDate);
                  }
                }}
              />
            )}
          </View>

          <View style={styles.formRow}>
            <View style={[styles.formSection, { flex: 1 }]}>
              <Text style={styles.formLabel}>Start Time</Text>
              <TextInput
                style={styles.input}
                value={startTime}
                onChangeText={setStartTime}
                placeholder="HH:MM"
                placeholderTextColor={Colors.textLight}
              />
            </View>
            <View style={styles.formSpacer} />
            <View style={[styles.formSection, { flex: 1 }]}>
              <Text style={styles.formLabel}>End Time</Text>
              <TextInput
                style={styles.input}
                value={endTime}
                onChangeText={setEndTime}
                placeholder="HH:MM"
                placeholderTextColor={Colors.textLight}
              />
            </View>
          </View>

          {type === 'in_person' && (
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Location *</Text>
              <TextInput
                style={styles.input}
                value={location}
                onChangeText={setLocation}
                placeholder="Address or venue name"
                placeholderTextColor={Colors.textLight}
              />
            </View>
          )}

          {type === 'online' && (
            <>
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Meeting Link *</Text>
                <TextInput
                  style={styles.input}
                  value={meetingLink}
                  onChangeText={setMeetingLink}
                  placeholder="Zoom, Google Meet, etc."
                  placeholderTextColor={Colors.textLight}
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Meeting Password</Text>
                <TextInput
                  style={styles.input}
                  value={meetingPassword}
                  onChangeText={setMeetingPassword}
                  placeholder="Optional"
                  placeholderTextColor={Colors.textLight}
                />
              </View>
            </>
          )}

          <View style={styles.formRow}>
            <View style={[styles.formSection, { flex: 1 }]}>
              <Text style={styles.formLabel}>Max Attendees</Text>
              <TextInput
                style={styles.input}
                value={maxAttendees}
                onChangeText={setMaxAttendees}
                placeholder="20"
                placeholderTextColor={Colors.textLight}
                keyboardType="number-pad"
              />
            </View>
            <View style={styles.formSpacer} />
            <View style={[styles.formSection, { flex: 1 }]}>
              <Text style={styles.formLabel}>Price (cents)</Text>
              <TextInput
                style={styles.input}
                value={priceCents}
                onChangeText={setPriceCents}
                placeholder="0"
                placeholderTextColor={Colors.textLight}
                keyboardType="number-pad"
              />
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Payment Link</Text>
            <TextInput
              style={styles.input}
              value={paymentLink}
              onChangeText={setPaymentLink}
              placeholder="PayPal, Venmo, etc."
              placeholderTextColor={Colors.textLight}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Materials Needed</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={materials}
              onChangeText={setMaterials}
              placeholder="List any supplies attendees should bring"
              placeholderTextColor={Colors.textLight}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Status</Text>
            <View style={styles.statusSelector}>
              {(['draft', 'published'] as const).map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setStatus(s)}
                  style={[
                    styles.statusOption,
                    status === s && styles.statusOptionActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusOptionText,
                      status === s && styles.statusOptionTextActive,
                    ]}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  addButton: {
    padding: 4,
  },
  statsBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 4,
  },
  filterBar: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.background,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  filterChipTextActive: {
    color: '#fff',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
    gap: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  workshopCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  workshopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  workshopType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  workshopTypeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textLight,
  },
  workshopActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    padding: 4,
  },
  workshopTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  workshopDescription: {
    fontSize: 14,
    color: Colors.textLight,
    lineHeight: 20,
    marginBottom: 12,
  },
  workshopMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: Colors.textLight,
  },
  workshopFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  attendeesInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  attendeesText: {
    fontSize: 14,
    color: Colors.textLight,
    fontWeight: '500' as const,
  },
  viewButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  viewButtonText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600' as const,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalCancel: {
    fontSize: 16,
    color: Colors.textLight,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  modalSave: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formSection: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
  },
  inputText: {
    fontSize: 16,
    color: Colors.text,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typeOptionActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeOptionText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  typeOptionTextActive: {
    color: '#fff',
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  formSpacer: {
    width: 12,
  },
  statusSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  statusOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  statusOptionActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  statusOptionText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  statusOptionTextActive: {
    color: '#fff',
  },
});
