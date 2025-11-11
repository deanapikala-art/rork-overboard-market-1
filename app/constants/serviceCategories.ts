export const SERVICE_CATEGORIES = {
  BUSINESS_PROFESSIONAL: [
    'Recruiting & HR',
    'Marketing/Branding',
    'Graphic/Web Design',
    'Accounting/Bookkeeping',
    'Admin/VA',
  ],
  CREATIVE_LIFESTYLE: [
    'Photography/Videography',
    'Event Planning',
    'Custom Woodworking',
    'Interior Design/Organization',
    'Beauty/Wellness',
  ],
  LOCAL_SERVICES: [
    'Lawn/Landscaping',
    'Pet Sitting/Grooming',
    'Cleaning',
    'Handyman/Repair',
    'Hauling/Junk Removal',
  ],
  SPECIALTY: [
    'Coaching/Mentorship',
    'Travel Planning',
    'Tutoring',
    'Tech Support/Custom Builds',
    'Subscription/Membership',
  ],
} as const;

export const ALL_SERVICE_CATEGORIES = [
  ...SERVICE_CATEGORIES.BUSINESS_PROFESSIONAL,
  ...SERVICE_CATEGORIES.CREATIVE_LIFESTYLE,
  ...SERVICE_CATEGORIES.LOCAL_SERVICES,
  ...SERVICE_CATEGORIES.SPECIALTY,
] as const;

export type ServiceCategory = typeof ALL_SERVICE_CATEGORIES[number];

export const SERVICE_CATEGORY_GROUPS = [
  { label: 'Business & Professional', categories: SERVICE_CATEGORIES.BUSINESS_PROFESSIONAL },
  { label: 'Creative & Lifestyle', categories: SERVICE_CATEGORIES.CREATIVE_LIFESTYLE },
  { label: 'Local Services', categories: SERVICE_CATEGORIES.LOCAL_SERVICES },
  { label: 'Specialty', categories: SERVICE_CATEGORIES.SPECIALTY },
] as const;

export type PricingModel = 'flat_rate' | 'hourly' | 'retainer' | 'quote';

export const PRICING_MODELS: { value: PricingModel; label: string }[] = [
  { value: 'flat_rate', label: 'Flat Rate' },
  { value: 'hourly', label: 'Hourly' },
  { value: 'retainer', label: 'Retainer' },
  { value: 'quote', label: 'Quote' },
];

export type VendorType = 'product' | 'service' | 'both';

export const VENDOR_TYPES: { value: VendorType; label: string }[] = [
  { value: 'product', label: 'Product' },
  { value: 'service', label: 'Service' },
  { value: 'both', label: 'Both' },
];

export type ServiceAreaType = 'local' | 'virtual' | 'both';

export const SERVICE_AREA_TYPES: { value: ServiceAreaType; label: string }[] = [
  { value: 'local', label: 'Local' },
  { value: 'virtual', label: 'Virtual' },
  { value: 'both', label: 'Both' },
];
