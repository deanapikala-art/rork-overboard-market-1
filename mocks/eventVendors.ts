export interface EventVendor {
  id: string;
  eventId: string;
  vendorId: string;
  boothOrder: number;
  isFeatured: boolean;
  liveStatus: 'live' | 'countdown' | 'offline';
  liveSlotStart?: string;
  liveSlotEnd?: string;
  streamEmbedUrl?: string;
  feeStatus?: 'unpaid' | 'pending' | 'paid' | 'waived';
}

export const eventVendors: EventVendor[] = [
  {
    id: '1',
    eventId: '2',
    vendorId: '1',
    boothOrder: 1,
    isFeatured: true,
    liveStatus: 'live',
    liveSlotStart: '2025-01-15T10:00:00',
    liveSlotEnd: '2025-01-15T12:00:00',
    streamEmbedUrl: 'https://www.youtube.com/embed/jfKfPfyJRdk',
    feeStatus: 'paid',
  },
  {
    id: '2',
    eventId: '2',
    vendorId: '3',
    boothOrder: 2,
    isFeatured: true,
    liveStatus: 'live',
    liveSlotStart: '2025-01-15T10:30:00',
    liveSlotEnd: '2025-01-15T12:30:00',
    streamEmbedUrl: 'https://www.youtube.com/embed/jfKfPfyJRdk',
    feeStatus: 'paid',
  },
  {
    id: '3',
    eventId: '2',
    vendorId: '2',
    boothOrder: 3,
    isFeatured: false,
    liveStatus: 'countdown',
    liveSlotStart: '2025-01-15T14:00:00',
    liveSlotEnd: '2025-01-15T16:00:00',
  },
  {
    id: '4',
    eventId: '2',
    vendorId: '4',
    boothOrder: 4,
    isFeatured: false,
    liveStatus: 'offline',
  },
  {
    id: '5',
    eventId: '2',
    vendorId: '5',
    boothOrder: 5,
    isFeatured: false,
    liveStatus: 'offline',
  },
  {
    id: '6',
    eventId: '2',
    vendorId: '6',
    boothOrder: 6,
    isFeatured: false,
    liveStatus: 'countdown',
    liveSlotStart: '2025-01-15T15:00:00',
    liveSlotEnd: '2025-01-15T17:00:00',
  },
];
