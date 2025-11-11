import { supabase } from '@/lib/supabase';
import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback } from 'react';

export type AutoResponderMode = 'Vacation' | 'AfterHours' | 'AlwaysOn';
export type TriggerType = 'newMessage' | 'newOrder';

export type BusinessHours = {
  open: string;
  close: string;
  timezone: string;
};

export type AutoResponderSettings = {
  id: string;
  vendorID: string;
  isEnabled: boolean;
  mode: AutoResponderMode;
  startDate?: string;
  endDate?: string;
  businessHours: BusinessHours;
  messageTemplate: string;
  triggerTypes: TriggerType[];
  cooldownHours: number;
  lastTriggeredAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type AutoResponderLog = {
  id: string;
  vendorID: string;
  recipientID: string;
  conversationID: string;
  triggerType: TriggerType;
  messageSent: string;
  sentAt: string;
};

type AutoResponderContextValue = {
  settings: AutoResponderSettings | null;
  logs: AutoResponderLog[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  loadSettings: (vendorID: string) => Promise<void>;
  loadLogs: (vendorID: string, limit?: number) => Promise<void>;
  updateSettings: (vendorID: string, updates: Partial<Omit<AutoResponderSettings, 'id' | 'vendorID' | 'createdAt' | 'updatedAt'>>) => Promise<{ success: boolean; error?: string }>;
  createSettings: (vendorID: string, settings: Partial<Omit<AutoResponderSettings, 'id' | 'vendorID' | 'createdAt' | 'updatedAt'>>) => Promise<{ success: boolean; error?: string }>;
  toggleEnabled: (vendorID: string, enabled: boolean) => Promise<{ success: boolean; error?: string }>;
  testAutoReply: (vendorID: string) => Promise<{ shouldSend: boolean; reason: string }>;
};

const DEFAULT_MESSAGE_TEMPLATES: Record<AutoResponderMode, string> = {
  AfterHours: "Thanks for your message! My shop hours are 9 AM–5 PM CST, Monday–Friday. I'll respond as soon as I'm back online.",
  Vacation: "Hi there! I'm currently away and will return on {{returnDate}}. Orders placed now will ship after I return. Thanks for your patience!",
  AlwaysOn: "Thanks for reaching out! I'll reply within 24 hours."
};

export const [AutoResponderProvider, useAutoResponder] = createContextHook<AutoResponderContextValue>(() => {
  const [settings, setSettings] = useState<AutoResponderSettings | null>(null);
  const [logs, setLogs] = useState<AutoResponderLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(async (vendorID: string) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('[AutoResponder] Loading settings for vendor:', vendorID);

      const { data, error: fetchError } = await supabase
        .from('vendor_auto_responder')
        .select('*')
        .eq('vendor_id', vendorID)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (data) {
        setSettings(mapDBToSettings(data));
        console.log('[AutoResponder] Settings loaded:', data.mode, data.is_enabled ? 'enabled' : 'disabled');
      } else {
        console.log('[AutoResponder] No settings found for vendor');
        setSettings(null);
      }
    } catch (err: any) {
      console.error('[AutoResponder] Error loading settings:', err);
      setError(err.message || 'Failed to load auto-responder settings');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadLogs = useCallback(async (vendorID: string, limit: number = 50) => {
    try {
      console.log('[AutoResponder] Loading logs for vendor:', vendorID);

      const { data, error: fetchError } = await supabase
        .from('auto_responder_log')
        .select('*')
        .eq('vendor_id', vendorID)
        .order('sent_at', { ascending: false })
        .limit(limit);

      if (fetchError) throw fetchError;

      if (data) {
        setLogs(data.map(mapDBToLog));
        console.log('[AutoResponder] Loaded', data.length, 'log entries');
      }
    } catch (err: any) {
      console.error('[AutoResponder] Error loading logs:', err);
    }
  }, []);

  const createSettings = useCallback(async (
    vendorID: string,
    newSettings: Partial<Omit<AutoResponderSettings, 'id' | 'vendorID' | 'createdAt' | 'updatedAt'>>
  ): Promise<{ success: boolean; error?: string }> => {
    setIsSaving(true);
    setError(null);

    try {
      console.log('[AutoResponder] Creating settings for vendor:', vendorID);

      const mode = newSettings.mode || 'AfterHours';
      const messageTemplate = newSettings.messageTemplate || DEFAULT_MESSAGE_TEMPLATES[mode];

      const { error: insertError } = await supabase
        .from('vendor_auto_responder')
        .insert({
          vendor_id: vendorID,
          is_enabled: newSettings.isEnabled ?? false,
          mode,
          start_date: newSettings.startDate || null,
          end_date: newSettings.endDate || null,
          business_hours: newSettings.businessHours || {
            open: '09:00',
            close: '17:00',
            timezone: 'America/Chicago'
          },
          message_template: messageTemplate,
          trigger_types: newSettings.triggerTypes || ['newMessage', 'newOrder'],
          cooldown_hours: newSettings.cooldownHours ?? 12
        });

      if (insertError) throw insertError;

      await loadSettings(vendorID);
      console.log('[AutoResponder] Settings created successfully');

      return { success: true };
    } catch (err: any) {
      console.error('[AutoResponder] Error creating settings:', err);
      const errorMsg = err.message || 'Failed to create auto-responder settings';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsSaving(false);
    }
  }, [loadSettings]);

  const updateSettings = useCallback(async (
    vendorID: string,
    updates: Partial<Omit<AutoResponderSettings, 'id' | 'vendorID' | 'createdAt' | 'updatedAt'>>
  ): Promise<{ success: boolean; error?: string }> => {
    setIsSaving(true);
    setError(null);

    try {
      console.log('[AutoResponder] Updating settings for vendor:', vendorID);

      const updateData: any = {};
      if (updates.isEnabled !== undefined) updateData.is_enabled = updates.isEnabled;
      if (updates.mode) updateData.mode = updates.mode;
      if (updates.startDate !== undefined) updateData.start_date = updates.startDate || null;
      if (updates.endDate !== undefined) updateData.end_date = updates.endDate || null;
      if (updates.businessHours) updateData.business_hours = updates.businessHours;
      if (updates.messageTemplate) updateData.message_template = updates.messageTemplate;
      if (updates.triggerTypes) updateData.trigger_types = updates.triggerTypes;
      if (updates.cooldownHours !== undefined) updateData.cooldown_hours = updates.cooldownHours;

      const { error: updateError } = await supabase
        .from('vendor_auto_responder')
        .update(updateData)
        .eq('vendor_id', vendorID);

      if (updateError) throw updateError;

      await loadSettings(vendorID);
      console.log('[AutoResponder] Settings updated successfully');

      return { success: true };
    } catch (err: any) {
      console.error('[AutoResponder] Error updating settings:', err);
      const errorMsg = err.message || 'Failed to update auto-responder settings';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsSaving(false);
    }
  }, [loadSettings]);

  const toggleEnabled = useCallback(async (
    vendorID: string,
    enabled: boolean
  ): Promise<{ success: boolean; error?: string }> => {
    return updateSettings(vendorID, { isEnabled: enabled });
  }, [updateSettings]);

  const testAutoReply = useCallback(async (
    vendorID: string
  ): Promise<{ shouldSend: boolean; reason: string }> => {
    try {
      console.log('[AutoResponder] Testing auto-reply for vendor:', vendorID);

      const { data, error } = await supabase
        .rpc('should_send_auto_reply', {
          p_vendor_id: vendorID,
          p_recipient_id: 'TEST_USER',
          p_trigger_type: 'newMessage'
        });

      if (error) throw error;

      if (data) {
        return {
          shouldSend: true,
          reason: 'Auto-reply would be sent based on current settings'
        };
      } else {
        return {
          shouldSend: false,
          reason: 'Auto-reply would not be sent (check mode, hours, or cooldown)'
        };
      }
    } catch (err: any) {
      console.error('[AutoResponder] Error testing auto-reply:', err);
      return {
        shouldSend: false,
        reason: `Error: ${err.message}`
      };
    }
  }, []);

  const mapDBToSettings = (data: any): AutoResponderSettings => ({
    id: data.id,
    vendorID: data.vendor_id,
    isEnabled: data.is_enabled,
    mode: data.mode,
    startDate: data.start_date,
    endDate: data.end_date,
    businessHours: data.business_hours,
    messageTemplate: data.message_template,
    triggerTypes: data.trigger_types,
    cooldownHours: data.cooldown_hours,
    lastTriggeredAt: data.last_triggered_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  });

  const mapDBToLog = (data: any): AutoResponderLog => ({
    id: data.id,
    vendorID: data.vendor_id,
    recipientID: data.recipient_id,
    conversationID: data.conversation_id,
    triggerType: data.trigger_type,
    messageSent: data.message_sent,
    sentAt: data.sent_at
  });

  return {
    settings,
    logs,
    isLoading,
    isSaving,
    error,
    loadSettings,
    loadLogs,
    updateSettings,
    createSettings,
    toggleEnabled,
    testAutoReply
  };
});

export { DEFAULT_MESSAGE_TEMPLATES };
