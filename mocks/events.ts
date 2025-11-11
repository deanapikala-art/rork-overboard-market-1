export interface Event {
  id: string;
  title: string;
  slug?: string;
  date: string;
  endDate: string;
  description: string;
  image: string;
  featured: boolean;
  vendorCount: number;
  status: 'live' | 'upcoming' | 'past';
  time?: string;
  allowChat?: boolean;
  eventType?: 'Seasonal' | 'State' | 'Regional' | 'National' | 'Themed';
  locationScope?: string;
  featuredStateCodes?: string[];
}

export const events: Event[] = [
  {
    id: '1',
    title: 'Overboard Market – National Winter Wonderland Fair',
    slug: 'national-winter-wonderland-2024',
    date: '2024-12-01',
    endDate: '2024-12-15',
    time: '10:00 AM - 6:00 PM',
    description: 'Cozy crafts and handmade gifts perfect for the holiday season. Shop unique items from 45+ local artisans nationwide.',
    image: 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=800&q=80',
    featured: true,
    vendorCount: 45,
    status: 'past',
    eventType: 'Seasonal',
    locationScope: 'Nationwide',
  },
  {
    id: '2',
    title: 'Overboard Market – National New Year Makers Market',
    slug: 'national-new-year-makers-2025',
    date: '2025-01-15',
    endDate: '2025-01-31',
    time: '9:00 AM - 5:00 PM',
    description: 'Start the year with fresh handmade finds. Browse jewelry, pottery, and artisan goods from makers across the country.',
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80',
    featured: true,
    vendorCount: 38,
    status: 'live',
    allowChat: true,
    eventType: 'Seasonal',
    locationScope: 'Nationwide',
  },
  {
    id: '3',
    title: 'Overboard Market – Midwest Spring Artisan Market',
    slug: 'midwest-spring-artisan-2025',
    date: '2025-03-01',
    endDate: '2025-03-31',
    time: '10:00 AM - 7:00 PM',
    description: 'Fresh starts and handcrafted art. Discover pottery, textiles, and more from emerging makers in the Midwest.',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80',
    featured: false,
    vendorCount: 52,
    status: 'upcoming',
    eventType: 'Regional',
    locationScope: 'Midwest',
    featuredStateCodes: ['WI', 'MN', 'IL', 'MI', 'OH', 'IN', 'IA', 'MO', 'ND', 'SD', 'NE', 'KS'],
  },
  {
    id: '4',
    title: 'Overboard Market – National Summer Makers Festival',
    slug: 'national-summer-makers-2025',
    date: '2025-06-01',
    endDate: '2025-06-30',
    time: '9:00 AM - 8:00 PM',
    description: 'Vibrant colors and sunshine-inspired creations. Browse jewelry, home decor, and wearable art from coast to coast.',
    image: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&q=80',
    featured: false,
    vendorCount: 60,
    status: 'upcoming',
    eventType: 'Seasonal',
    locationScope: 'Nationwide',
  },
];
