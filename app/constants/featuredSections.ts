export interface FeaturedSection {
  id: string;
  title: string;
  emoji: string;
  description: string;
  rotatingSchedule: 'monthly' | 'weekly' | 'seasonal' | 'permanent';
  filterType: 'category' | 'price' | 'tag' | 'vendors' | 'seasonal';
  filterValue: string | number | string[];
  backgroundColor: string;
  accentColor: string;
}

export const featuredSections: FeaturedSection[] = [
  {
    id: 'holiday-hall',
    title: 'Holiday Hall',
    emoji: '🎄',
    description: 'Seasonal booths that change monthly',
    rotatingSchedule: 'monthly',
    filterType: 'category',
    filterValue: 'Seasonal & Holiday',
    backgroundColor: '#C8102E',
    accentColor: '#165B33',
  },
  {
    id: 'makers-corner',
    title: "Maker's Corner",
    emoji: '🪵',
    description: 'Handmade goods and artisan craftsmanship',
    rotatingSchedule: 'permanent',
    filterType: 'category',
    filterValue: 'Home & Handmade Goods',
    backgroundColor: '#8B7B6A',
    accentColor: '#5C4D3C',
  },
  {
    id: 'taste-of-home',
    title: 'Taste of Home',
    emoji: '🧁',
    description: 'Food-focused vendors with local flavor',
    rotatingSchedule: 'permanent',
    filterType: 'category',
    filterValue: 'Food & Treats',
    backgroundColor: '#F4B860',
    accentColor: '#E07A5F',
  },
  {
    id: 'gifts-under-25',
    title: 'Gifts Under $25',
    emoji: '🎁',
    description: 'Budget-friendly finds',
    rotatingSchedule: 'permanent',
    filterType: 'price',
    filterValue: 25,
    backgroundColor: '#C25C8C',
    accentColor: '#8B1E5A',
  },
  {
    id: 'paw-prints-pavilion',
    title: 'Paw Prints Pavilion',
    emoji: '🐾',
    description: 'Pet vendors grouped in one place',
    rotatingSchedule: 'permanent',
    filterType: 'category',
    filterValue: 'Pets & Critters',
    backgroundColor: '#81B29A',
    accentColor: '#5A7D6A',
  },
  {
    id: 'small-town-spotlight',
    title: 'Small Town Spotlight',
    emoji: '🌻',
    description: 'Rotating showcase of featured vendors',
    rotatingSchedule: 'weekly',
    filterType: 'category',
    filterValue: 'Local Favorites',
    backgroundColor: '#F2A599',
    accentColor: '#D87568',
  },
  {
    id: 'support-a-cause',
    title: 'Support a Cause',
    emoji: '🪙',
    description: 'Vendors who donate to local charities',
    rotatingSchedule: 'monthly',
    filterType: 'tag',
    filterValue: ['charity', 'cause', 'nonprofit'],
    backgroundColor: '#165B33',
    accentColor: '#0F3D23',
  },
];

export function getFeaturedSectionById(id: string): FeaturedSection | undefined {
  return featuredSections.find(section => section.id === id);
}

export function getActiveFeaturedSections(): FeaturedSection[] {
  return featuredSections;
}

export default function FeaturedSectionsPage() {
  return null;
}
