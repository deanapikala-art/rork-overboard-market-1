import { Vendor } from '@/mocks/vendors';
import { EventVendor } from '@/mocks/eventVendors';

export interface MarketplacePublishGuardResult {
  allowed: boolean;
  reason?: string;
}

export interface EventLiveGuardResult {
  allowed: boolean;
  reason?: string;
}

export function canPublishToMarketplace(vendor: Vendor): MarketplacePublishGuardResult {
  const billingStatus = vendor.billingStatusMarketplace;
  
  if (billingStatus === 'active' || billingStatus === 'waived') {
    return { allowed: true };
  }
  
  let reason = 'Marketplace listing fee required';
  
  if (billingStatus === 'pending') {
    reason = 'Payment pending admin approval';
  } else if (billingStatus === 'inactive') {
    reason = 'Please activate your marketplace listing in the Billing tab';
  }
  
  return {
    allowed: false,
    reason
  };
}

export function canGoLiveInEvent(eventVendor: EventVendor): EventLiveGuardResult {
  const feeStatus = eventVendor.feeStatus;
  
  if (feeStatus === 'paid' || feeStatus === 'waived') {
    return { allowed: true };
  }
  
  let reason = 'Event fee required';
  
  if (feeStatus === 'pending') {
    reason = 'Event fee payment pending admin approval';
  } else if (!feeStatus || feeStatus === 'unpaid') {
    reason = 'Please pay the event fee to go live';
  }
  
  return {
    allowed: false,
    reason
  };
}

export function getMarketplaceStatusLabel(status?: 'active' | 'waived' | 'pending' | 'inactive'): string {
  switch (status) {
    case 'active':
      return '✓ Active';
    case 'waived':
      return '✓ Waived';
    case 'pending':
      return '⏳ Pending';
    case 'inactive':
    default:
      return '● Inactive';
  }
}

export function getEventFeeStatusLabel(status?: 'unpaid' | 'pending' | 'paid' | 'waived'): string {
  switch (status) {
    case 'paid':
      return '✓ Paid';
    case 'waived':
      return '✓ Waived';
    case 'pending':
      return '⏳ Pending';
    case 'unpaid':
    default:
      return '● Unpaid';
  }
}

export function shouldShowMarketplaceBilling(vendor: Vendor): boolean {
  return vendor.billingStatusMarketplace !== 'active' && vendor.billingStatusMarketplace !== 'waived';
}

export function shouldShowEventFeeBilling(eventVendor: EventVendor): boolean {
  return eventVendor.feeStatus !== 'paid' && eventVendor.feeStatus !== 'waived';
}
