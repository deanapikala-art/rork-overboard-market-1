import { supabase } from '@/lib/supabase';
import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback } from 'react';
import { useVendorAuth } from './VendorAuthContext';
import { useCustomerAuth } from './CustomerAuthContext';

export type WorkshopType = 'in_person' | 'online';
export type WorkshopStatus = 'draft' | 'published' | 'full' | 'completed' | 'canceled';
export type WorkshopPaymentStatus = 'pending' | 'paid' | 'canceled';
export type WorkshopAttendanceStatus = 'registered' | 'attended' | 'no_show';

export type Workshop = {
  id: string;
  vendor_id: string;
  title: string;
  description?: string;
  image_url?: string;
  type: WorkshopType;
  date: string;
  start_time: string;
  end_time: string;
  location?: string;
  geo_lat?: number;
  geo_lon?: number;
  meeting_link?: string;
  meeting_password?: string;
  max_attendees: number;
  current_attendees: number;
  price_cents: number;
  payment_link?: string;
  materials?: string;
  status: WorkshopStatus;
  created_at: string;
  updated_at: string;
  vendor?: {
    business_name: string;
    avatar?: string;
  };
};

export type WorkshopRegistration = {
  id: string;
  workshop_id: string;
  user_id: string;
  registered_at: string;
  payment_status: WorkshopPaymentStatus;
  attendance_status: WorkshopAttendanceStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
};

type WorkshopsContextValue = {
  isLoading: boolean;
  fetchWorkshops: (filters?: {
    status?: WorkshopStatus;
    type?: WorkshopType;
    vendorId?: string;
  }) => Promise<Workshop[]>;
  fetchMyWorkshops: () => Promise<Workshop[]>;
  fetchMyRegistrations: () => Promise<(WorkshopRegistration & { workshop: Workshop })[]>;
  createWorkshop: (workshop: Omit<Workshop, 'id' | 'vendor_id' | 'current_attendees' | 'created_at' | 'updated_at'>) => Promise<{ success: boolean; error?: string; workshop?: Workshop }>;
  updateWorkshop: (id: string, updates: Partial<Workshop>) => Promise<{ success: boolean; error?: string }>;
  deleteWorkshop: (id: string) => Promise<{ success: boolean; error?: string }>;
  registerForWorkshop: (workshopId: string, notes?: string) => Promise<{ success: boolean; error?: string }>;
  cancelRegistration: (workshopId: string) => Promise<{ success: boolean; error?: string }>;
  fetchWorkshopRegistrations: (workshopId: string) => Promise<(WorkshopRegistration & { user: { full_name?: string; email?: string } })[]>;
  updateAttendanceStatus: (registrationId: string, status: WorkshopAttendanceStatus) => Promise<{ success: boolean; error?: string }>;
};

export const [WorkshopsProvider, useWorkshops] = createContextHook<WorkshopsContextValue>(() => {
  const [isLoading, setIsLoading] = useState(false);
  const vendorAuth = useVendorAuth();
  const customerAuth = useCustomerAuth();

  const fetchWorkshops = useCallback(async (filters?: {
    status?: WorkshopStatus;
    type?: WorkshopType;
    vendorId?: string;
  }): Promise<Workshop[]> => {
    try {
      setIsLoading(true);
      console.log('[WorkshopsContext] Fetching workshops with filters:', filters);

      let query = supabase
        .from('workshops')
        .select(`
          *,
          vendor:vendors!workshops_vendor_fk (
            business_name,
            avatar
          )
        `)
        .order('date', { ascending: true });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.type) {
        query = query.eq('type', filters.type);
      }
      if (filters?.vendorId) {
        query = query.eq('vendor_id', filters.vendorId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[WorkshopsContext] Error fetching workshops:', error);
        return [];
      }

      console.log('[WorkshopsContext] Fetched workshops:', data?.length || 0);
      return (data || []) as Workshop[];
    } catch (error) {
      console.error('[WorkshopsContext] Exception fetching workshops:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchMyWorkshops = useCallback(async (): Promise<Workshop[]> => {
    if (!vendorAuth?.profile?.id) {
      console.log('[WorkshopsContext] No vendor profile, cannot fetch my workshops');
      return [];
    }

    try {
      setIsLoading(true);
      console.log('[WorkshopsContext] Fetching my workshops');

      const { data, error } = await supabase
        .from('workshops')
        .select('*')
        .eq('vendor_id', vendorAuth.profile.id)
        .order('date', { ascending: true });

      if (error) {
        console.error('[WorkshopsContext] Error fetching my workshops:', error);
        return [];
      }

      console.log('[WorkshopsContext] Fetched my workshops:', data?.length || 0);
      return (data || []) as Workshop[];
    } catch (error) {
      console.error('[WorkshopsContext] Exception fetching my workshops:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [vendorAuth?.profile?.id]);

  const fetchMyRegistrations = useCallback(async (): Promise<(WorkshopRegistration & { workshop: Workshop })[]> => {
    if (!customerAuth?.profile?.id) {
      console.log('[WorkshopsContext] No customer profile, cannot fetch registrations');
      return [];
    }

    try {
      setIsLoading(true);
      console.log('[WorkshopsContext] Fetching my registrations');

      const { data, error } = await supabase
        .from('workshop_registrations')
        .select(`
          *,
          workshop:workshops (
            *,
            vendor:vendors!workshops_vendor_fk (
              business_name,
              avatar
            )
          )
        `)
        .eq('user_id', customerAuth.profile.id)
        .order('registered_at', { ascending: false });

      if (error) {
        console.error('[WorkshopsContext] Error fetching registrations:', error);
        return [];
      }

      console.log('[WorkshopsContext] Fetched registrations:', data?.length || 0);
      return (data || []) as (WorkshopRegistration & { workshop: Workshop })[];
    } catch (error) {
      console.error('[WorkshopsContext] Exception fetching registrations:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [customerAuth?.profile?.id]);

  const createWorkshop = useCallback(async (
    workshop: Omit<Workshop, 'id' | 'vendor_id' | 'current_attendees' | 'created_at' | 'updated_at'>
  ): Promise<{ success: boolean; error?: string; workshop?: Workshop }> => {
    if (!vendorAuth?.profile?.id) {
      return { success: false, error: 'Not authenticated as vendor' };
    }

    try {
      setIsLoading(true);
      console.log('[WorkshopsContext] Creating workshop:', workshop.title);

      const { data, error } = await supabase
        .from('workshops')
        .insert({
          ...workshop,
          vendor_id: vendorAuth.profile.id,
          current_attendees: 0,
        })
        .select()
        .single();

      if (error) {
        console.error('[WorkshopsContext] Error creating workshop:', error);
        return { success: false, error: error.message };
      }

      console.log('[WorkshopsContext] Workshop created successfully');
      return { success: true, workshop: data as Workshop };
    } catch (error) {
      console.error('[WorkshopsContext] Exception creating workshop:', error);
      return { success: false, error: 'An unexpected error occurred' };
    } finally {
      setIsLoading(false);
    }
  }, [vendorAuth?.profile?.id]);

  const updateWorkshop = useCallback(async (
    id: string,
    updates: Partial<Workshop>
  ): Promise<{ success: boolean; error?: string }> => {
    if (!vendorAuth?.profile?.id) {
      return { success: false, error: 'Not authenticated as vendor' };
    }

    try {
      setIsLoading(true);
      console.log('[WorkshopsContext] Updating workshop:', id);

      const { error } = await supabase
        .from('workshops')
        .update(updates)
        .eq('id', id)
        .eq('vendor_id', vendorAuth.profile.id);

      if (error) {
        console.error('[WorkshopsContext] Error updating workshop:', error);
        return { success: false, error: error.message };
      }

      console.log('[WorkshopsContext] Workshop updated successfully');
      return { success: true };
    } catch (error) {
      console.error('[WorkshopsContext] Exception updating workshop:', error);
      return { success: false, error: 'An unexpected error occurred' };
    } finally {
      setIsLoading(false);
    }
  }, [vendorAuth?.profile?.id]);

  const deleteWorkshop = useCallback(async (
    id: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!vendorAuth?.profile?.id) {
      return { success: false, error: 'Not authenticated as vendor' };
    }

    try {
      setIsLoading(true);
      console.log('[WorkshopsContext] Deleting workshop:', id);

      const { error } = await supabase
        .from('workshops')
        .delete()
        .eq('id', id)
        .eq('vendor_id', vendorAuth.profile.id);

      if (error) {
        console.error('[WorkshopsContext] Error deleting workshop:', error);
        return { success: false, error: error.message };
      }

      console.log('[WorkshopsContext] Workshop deleted successfully');
      return { success: true };
    } catch (error) {
      console.error('[WorkshopsContext] Exception deleting workshop:', error);
      return { success: false, error: 'An unexpected error occurred' };
    } finally {
      setIsLoading(false);
    }
  }, [vendorAuth?.profile?.id]);

  const registerForWorkshop = useCallback(async (
    workshopId: string,
    notes?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!customerAuth?.profile?.id) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      setIsLoading(true);
      console.log('[WorkshopsContext] Registering for workshop:', workshopId);

      const { data: workshop, error: workshopError } = await supabase
        .from('workshops')
        .select('current_attendees, max_attendees, status')
        .eq('id', workshopId)
        .single();

      if (workshopError) {
        return { success: false, error: workshopError.message };
      }

      if (!workshop) {
        return { success: false, error: 'Workshop not found' };
      }

      if (workshop.status === 'full' || workshop.current_attendees >= workshop.max_attendees) {
        return { success: false, error: 'Workshop is full' };
      }

      const { error } = await supabase
        .from('workshop_registrations')
        .insert({
          workshop_id: workshopId,
          user_id: customerAuth.profile.id,
          notes: notes || null,
          payment_status: 'pending',
          attendance_status: 'registered',
        });

      if (error) {
        console.error('[WorkshopsContext] Error registering for workshop:', error);
        return { success: false, error: error.message };
      }

      console.log('[WorkshopsContext] Registered for workshop successfully');
      return { success: true };
    } catch (error) {
      console.error('[WorkshopsContext] Exception registering for workshop:', error);
      return { success: false, error: 'An unexpected error occurred' };
    } finally {
      setIsLoading(false);
    }
  }, [customerAuth?.profile?.id]);

  const cancelRegistration = useCallback(async (
    workshopId: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!customerAuth?.profile?.id) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      setIsLoading(true);
      console.log('[WorkshopsContext] Canceling registration for workshop:', workshopId);

      const { error } = await supabase
        .from('workshop_registrations')
        .delete()
        .eq('workshop_id', workshopId)
        .eq('user_id', customerAuth.profile.id);

      if (error) {
        console.error('[WorkshopsContext] Error canceling registration:', error);
        return { success: false, error: error.message };
      }

      console.log('[WorkshopsContext] Registration canceled successfully');
      return { success: true };
    } catch (error) {
      console.error('[WorkshopsContext] Exception canceling registration:', error);
      return { success: false, error: 'An unexpected error occurred' };
    } finally {
      setIsLoading(false);
    }
  }, [customerAuth?.profile?.id]);

  const fetchWorkshopRegistrations = useCallback(async (
    workshopId: string
  ): Promise<(WorkshopRegistration & { user: { full_name?: string; email?: string } })[]> => {
    if (!vendorAuth?.profile?.id) {
      console.log('[WorkshopsContext] No vendor profile, cannot fetch registrations');
      return [];
    }

    try {
      setIsLoading(true);
      console.log('[WorkshopsContext] Fetching registrations for workshop:', workshopId);

      const { data, error } = await supabase
        .from('workshop_registrations')
        .select(`
          *,
          user:user_profile (
            full_name,
            email
          )
        `)
        .eq('workshop_id', workshopId);

      if (error) {
        console.error('[WorkshopsContext] Error fetching workshop registrations:', error);
        return [];
      }

      console.log('[WorkshopsContext] Fetched workshop registrations:', data?.length || 0);
      return (data || []) as (WorkshopRegistration & { user: { full_name?: string; email?: string } })[];
    } catch (error) {
      console.error('[WorkshopsContext] Exception fetching workshop registrations:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [vendorAuth?.profile?.id]);

  const updateAttendanceStatus = useCallback(async (
    registrationId: string,
    status: WorkshopAttendanceStatus
  ): Promise<{ success: boolean; error?: string }> => {
    if (!vendorAuth?.profile?.id) {
      return { success: false, error: 'Not authenticated as vendor' };
    }

    try {
      setIsLoading(true);
      console.log('[WorkshopsContext] Updating attendance status:', registrationId, status);

      const { error } = await supabase
        .from('workshop_registrations')
        .update({ attendance_status: status })
        .eq('id', registrationId);

      if (error) {
        console.error('[WorkshopsContext] Error updating attendance status:', error);
        return { success: false, error: error.message };
      }

      console.log('[WorkshopsContext] Attendance status updated successfully');
      return { success: true };
    } catch (error) {
      console.error('[WorkshopsContext] Exception updating attendance status:', error);
      return { success: false, error: 'An unexpected error occurred' };
    } finally {
      setIsLoading(false);
    }
  }, [vendorAuth?.profile?.id]);

  return {
    isLoading,
    fetchWorkshops,
    fetchMyWorkshops,
    fetchMyRegistrations,
    createWorkshop,
    updateWorkshop,
    deleteWorkshop,
    registerForWorkshop,
    cancelRegistration,
    fetchWorkshopRegistrations,
    updateAttendanceStatus,
  };
});
