export interface VendorCharge {
  id: string;
  vendorId: string;
  type: 'marketplace' | 'event';
  eventRef?: string;
  amount: number;
  status: 'unpaid' | 'pending' | 'paid' | 'refunded';
  createdAt: string;
  paidAt?: string;
  stripeCheckoutSessionId?: string;
}

export const vendorCharges: VendorCharge[] = [
  {
    id: '1',
    vendorId: '1',
    type: 'event',
    eventRef: '2',
    amount: 15.00,
    status: 'paid',
    createdAt: '2025-01-10T10:00:00',
    paidAt: '2025-01-10T10:05:00',
  },
  {
    id: '2',
    vendorId: '3',
    type: 'event',
    eventRef: '2',
    amount: 15.00,
    status: 'paid',
    createdAt: '2025-01-10T11:00:00',
    paidAt: '2025-01-10T11:10:00',
  },
];
