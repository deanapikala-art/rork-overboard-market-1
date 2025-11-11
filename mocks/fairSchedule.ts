export interface FairScheduleEvent {
  id: string;
  title: string;
  type: 'live-shopping' | 'vendor-showcase' | 'facebook-live' | 'special-sale' | 'holiday-market' | 'workshop';
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  location: 'online' | 'in-person' | 'hybrid';
  venue?: string;
  vendorIds?: string[];
  featuredVendors?: string[];
  streamUrl?: string;
  registrationRequired: boolean;
  registrationUrl?: string;
  thumbnail: string;
  isPast: boolean;
  isLive: boolean;
  tags: string[];
}

export const fairScheduleEvents: FairScheduleEvent[] = [
  {
    id: 'schedule-1',
    title: 'Holiday Craft Fair - Live Shopping Day',
    type: 'live-shopping',
    description: 'Join us for our biggest holiday shopping event of the year! Over 50 vendors showcasing their best holiday gifts, decorations, and treats. Special promotions and giveaways throughout the day.',
    date: '2025-11-15',
    startTime: '10:00',
    endTime: '18:00',
    location: 'hybrid',
    venue: 'Community Center & Online',
    vendorIds: ['1', '2', '3', '4', '5', '6'],
    featuredVendors: ['Luna Ceramics', 'Willow & Thread', 'Oak & Honey'],
    streamUrl: 'https://facebook.com/events/123456',
    registrationRequired: false,
    thumbnail: 'https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=800&q=80',
    isPast: false,
    isLive: false,
    tags: ['holiday', 'shopping', 'live event', 'vendors'],
  },
  {
    id: 'schedule-2',
    title: 'Meet the Maker: Luna Ceramics Studio Tour',
    type: 'vendor-showcase',
    description: "Get an exclusive behind-the-scenes look at Luna Ceramics' studio! Watch Sarah create pottery from start to finish, ask questions, and enjoy special pricing on all items. Limited spots available.",
    date: '2025-11-08',
    startTime: '14:00',
    endTime: '16:00',
    location: 'in-person',
    venue: 'Luna Ceramics Studio, Portland OR',
    vendorIds: ['1'],
    featuredVendors: ['Luna Ceramics'],
    registrationRequired: true,
    registrationUrl: 'https://calendly.com/lunaceramics/studio-tour',
    thumbnail: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&q=80',
    isPast: false,
    isLive: false,
    tags: ['studio tour', 'pottery', 'workshop'],
  },
  {
    id: 'schedule-3',
    title: 'Black Friday Small Business Spotlight',
    type: 'special-sale',
    description: 'Support local makers this Black Friday! Exclusive deals, flash sales every hour, and surprise bundles. Shop small, shop local, shop with heart.',
    date: '2025-11-29',
    startTime: '00:00',
    endTime: '23:59',
    location: 'online',
    registrationRequired: false,
    thumbnail: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=800&q=80',
    isPast: false,
    isLive: false,
    tags: ['sale', 'black friday', 'deals', 'small business'],
  },
  {
    id: 'schedule-4',
    title: 'Facebook Live: Holiday Gift Guide',
    type: 'facebook-live',
    description: 'Join us on Facebook Live as we showcase the perfect holiday gifts from our vendors. Watch live demonstrations, get gift ideas, and enjoy special Facebook-exclusive discounts!',
    date: '2025-11-10',
    startTime: '19:00',
    endTime: '20:30',
    location: 'online',
    streamUrl: 'https://facebook.com/fairmarketplace/live',
    registrationRequired: false,
    thumbnail: 'https://images.unsplash.com/photo-1545239705-1564e58b9e4a?w=800&q=80',
    isPast: false,
    isLive: false,
    tags: ['facebook live', 'gift guide', 'holiday'],
  },
  {
    id: 'schedule-5',
    title: 'Metalworking Workshop with Forge & Bloom',
    type: 'workshop',
    description: 'Learn the basics of metalworking! Marcus from Forge & Bloom will teach you how to create your own simple metal jewelry piece. All materials and tools provided. Perfect for beginners!',
    date: '2025-11-12',
    startTime: '13:00',
    endTime: '16:00',
    location: 'in-person',
    venue: 'Forge & Bloom Studio, Austin TX',
    vendorIds: ['3'],
    featuredVendors: ['Forge & Bloom'],
    registrationRequired: true,
    registrationUrl: 'https://forgeandbloom.com/workshop',
    thumbnail: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&q=80',
    isPast: false,
    isLive: false,
    tags: ['workshop', 'metalwork', 'hands-on', 'jewelry'],
  },
  {
    id: 'schedule-6',
    title: 'Small Town Saturday Market',
    type: 'live-shopping',
    description: 'Weekly Saturday market featuring local vendors! Browse handmade goods, enjoy live music, and connect with your community. Bring the family!',
    date: '2025-11-09',
    startTime: '09:00',
    endTime: '14:00',
    location: 'in-person',
    venue: 'Downtown Town Square',
    registrationRequired: false,
    thumbnail: 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=800&q=80',
    isPast: false,
    isLive: false,
    tags: ['farmers market', 'weekly', 'local', 'community'],
  },
  {
    id: 'schedule-7',
    title: 'Christmas Craft Fair - NOW LIVE!',
    type: 'holiday-market',
    description: 'Our annual Christmas Craft Fair is happening NOW! Shop unique handmade gifts, enjoy festive treats, and meet local artisans. Live music and photos with Santa!',
    date: '2025-11-03',
    startTime: '10:00',
    endTime: '17:00',
    location: 'hybrid',
    venue: 'Convention Center & Online',
    streamUrl: 'https://facebook.com/events/christmas2025',
    registrationRequired: false,
    thumbnail: 'https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=800&q=80',
    isPast: false,
    isLive: true,
    tags: ['christmas', 'holiday', 'live now', 'crafts'],
  },
];

export function getUpcomingEvents(limit?: number): FairScheduleEvent[] {
  const upcoming = fairScheduleEvents
    .filter(event => !event.isPast)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return limit ? upcoming.slice(0, limit) : upcoming;
}

export function getLiveEvents(): FairScheduleEvent[] {
  return fairScheduleEvents.filter(event => event.isLive);
}

export function getEventsByType(type: FairScheduleEvent['type']): FairScheduleEvent[] {
  return fairScheduleEvents.filter(event => event.type === type);
}

export function getFeaturedEvents(): FairScheduleEvent[] {
  return fairScheduleEvents
    .filter(event => event.isLive || (!event.isPast && event.type === 'live-shopping'))
    .slice(0, 3);
}
