import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { Save, AlertCircle, FileText, Eye } from 'lucide-react-native';
import { PolicyType } from '@/app/contexts/PolicyAcknowledgmentContext';
import { supabase } from '@/lib/supabase';
import Colors from '@/app/constants/colors';
import { getPolicyIcon, getPolicyTitle, getPolicyBannerMessage } from '@/app/constants/policyTemplates';

interface AdminPolicyEditorProps {
  policyType: PolicyType;
  currentVersion: number;
  onSave: () => void;
}

export function AdminPolicyEditor({ policyType, currentVersion, onSave }: AdminPolicyEditorProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [requiresAcknowledgment, setRequiresAcknowledgment] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const newVersion = currentVersion + 0.1;
  const icon = getPolicyIcon(policyType);
  const defaultTitle = getPolicyTitle(policyType);
  const bannerMessage = getPolicyBannerMessage(policyType);

  useEffect(() => {
    loadCurrentPolicy();
  }, [policyType]);

  const loadCurrentPolicy = async () => {
    try {
      setIsLoading(true);
      console.log('[AdminPolicyEditor] Loading current policy:', policyType);

      const { data, error } = await supabase
        .from('policy_texts')
        .select('*')
        .eq('policy_type', policyType)
        .eq('is_active', true)
        .order('version', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('[AdminPolicyEditor] Error loading policy:', error);
        Alert.alert('Error', 'Failed to load current policy');
        return;
      }

      if (data) {
        setTitle(data.title || defaultTitle);
        setContent(typeof data.content === 'string' ? data.content : JSON.stringify(data.content, null, 2));
        setRequiresAcknowledgment(data.requires_acknowledgment ?? true);
      } else {
        setTitle(defaultTitle);
        setContent('');
        setRequiresAcknowledgment(true);
      }
    } catch (error) {
      console.error('[AdminPolicyEditor] Exception loading policy:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Validation Error', 'Please provide both a title and content for the policy.');
      return;
    }

    Alert.alert(
      'Publish Policy Update',
      `This will create version ${newVersion.toFixed(1)} of ${title}.\n\n${requiresAcknowledgment ? 'All users will be notified and required to acknowledge this update.' : 'Users will be able to view this update without acknowledgment requirement.'}`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Publish',
          style: 'default',
          onPress: publishPolicy,
        },
      ]
    );
  };

  const publishPolicy = async () => {
    try {
      setIsSaving(true);
      console.log('[AdminPolicyEditor] Publishing policy:', policyType, 'v', newVersion);

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert('Error', 'You must be logged in to publish policies');
        return;
      }

      const { data: deactivateData, error: deactivateError } = await supabase
        .from('policy_texts')
        .update({ is_active: false })
        .eq('policy_type', policyType)
        .eq('is_active', true);

      if (deactivateError) {
        console.error('[AdminPolicyEditor] Error deactivating old policies:', deactivateError);
        Alert.alert('Error', 'Failed to deactivate old policy versions');
        return;
      }

      const { data: newPolicy, error: insertError } = await supabase
        .from('policy_texts')
        .insert({
          policy_type: policyType,
          version: newVersion,
          title: title.trim(),
          content: content.trim(),
          requires_acknowledgment: requiresAcknowledgment,
          is_active: true,
          updated_by: user.id,
          last_updated: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        console.error('[AdminPolicyEditor] Error inserting new policy:', insertError);
        Alert.alert('Error', 'Failed to save new policy version');
        return;
      }

      console.log('[AdminPolicyEditor] Policy published successfully:', newPolicy.id);

      Alert.alert(
        'Success',
        `${title} v${newVersion.toFixed(1)} has been published successfully!${requiresAcknowledgment ? '\n\nUsers will be notified automatically.' : ''}`,
        [
          {
            text: 'OK',
            onPress: onSave,
          },
        ]
      );
    } catch (error) {
      console.error('[AdminPolicyEditor] Exception publishing policy:', error);
      Alert.alert('Error', 'An unexpected error occurred while publishing');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.nautical.teal} />
        <Text style={styles.loadingText}>Loading policy editor...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Text style={styles.headerIconText}>{icon}</Text>
        </View>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Edit {defaultTitle}</Text>
          <Text style={styles.headerSubtitle}>
            Current: v{currentVersion.toFixed(1)} → New: v{newVersion.toFixed(1)}
          </Text>
        </View>
      </View>

      <View style={styles.infoBox}>
        <AlertCircle size={18} color={Colors.nautical.darkBlue} />
        <Text style={styles.infoText}>
          Publishing this policy will notify all users {requiresAcknowledgment ? 'and require acknowledgment' : 'for their review'}.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Policy Title</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Enter policy title"
          placeholderTextColor={Colors.neutralGray}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Policy Content</Text>
        <Text style={styles.sublabel}>
          Write the full policy text. Use plain text or markdown formatting.
        </Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={content}
          onChangeText={setContent}
          placeholder="Enter policy content here..."
          placeholderTextColor={Colors.neutralGray}
          multiline
          numberOfLines={12}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.section}>
        <View style={styles.switchRow}>
          <View style={styles.switchLabel}>
            <Text style={styles.label}>Require User Acknowledgment</Text>
            <Text style={styles.sublabel}>
              When enabled, users must accept before continuing to use the app
            </Text>
          </View>
          <Switch
            value={requiresAcknowledgment}
            onValueChange={setRequiresAcknowledgment}
            trackColor={{ false: Colors.neutralGray, true: Colors.nautical.teal }}
            thumbColor={Colors.white}
          />
        </View>
      </View>

      <View style={styles.previewSection}>
        <View style={styles.previewHeader}>
          <Eye size={18} color={Colors.nautical.navyBlue} />
          <Text style={styles.previewTitle}>Notification Preview</Text>
        </View>
        <View style={styles.previewBox}>
          <Text style={styles.previewBannerTitle}>
            {title || defaultTitle} Updated (v{newVersion.toFixed(1)})
          </Text>
          <Text style={styles.previewBannerMessage}>{bannerMessage}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={isSaving}
        activeOpacity={0.7}
      >
        {isSaving ? (
          <ActivityIndicator size="small" color={Colors.white} />
        ) : (
          <>
            <Save size={20} color={Colors.white} />
            <Text style={styles.saveButtonText}>Publish Version {newVersion.toFixed(1)}</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={styles.helpBox}>
        <FileText size={16} color={Colors.nautical.navyBlue} />
        <Text style={styles.helpText}>
          💡 Tip: Make sure to review all changes carefully before publishing. Once published, users will receive notifications immediately.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.nautical.navyBlue,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutralGray,
    gap: 16,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.nautical.lightBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconText: {
    fontSize: 32,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.nautical.darkBlue,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.nautical.navyBlue,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    margin: 16,
    padding: 12,
    backgroundColor: Colors.nautical.lightBlue,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.nautical.teal,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.nautical.darkBlue,
    lineHeight: 18,
  },
  section: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.nautical.darkBlue,
    marginBottom: 8,
  },
  sublabel: {
    fontSize: 13,
    color: Colors.nautical.navyBlue,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.neutralGray,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.nautical.darkBlue,
  },
  textArea: {
    minHeight: 200,
    paddingTop: 12,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.neutralGray,
  },
  switchLabel: {
    flex: 1,
    marginRight: 16,
  },
  previewSection: {
    padding: 16,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  previewTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.nautical.navyBlue,
  },
  previewBox: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.nautical.teal,
  },
  previewBannerTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.nautical.darkBlue,
    marginBottom: 8,
  },
  previewBannerMessage: {
    fontSize: 14,
    color: Colors.nautical.navyBlue,
    lineHeight: 20,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.nautical.teal,
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  helpBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    margin: 16,
    marginTop: 12,
    padding: 12,
    backgroundColor: Colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.neutralGray,
    gap: 10,
  },
  helpText: {
    flex: 1,
    fontSize: 13,
    color: Colors.nautical.navyBlue,
    lineHeight: 18,
  },
});
