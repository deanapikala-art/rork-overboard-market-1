export interface VendorResource {
  resourceID: string;
  category: 'Getting Started' | 'Marketing' | 'Affiliate Tools' | 'Education' | 'Community';
  title: string;
  description: string;
  url: string;
  isAffiliate: boolean;
  featuredImage?: string;
}

export const vendorResources: VendorResource[] = [
  {
    resourceID: 'res-001',
    category: 'Getting Started',
    title: 'Setup Guide (Coming Soon)',
    description: 'Complete walkthrough for setting up your vendor booth and products.',
    url: '#',
    isAffiliate: false,
  },
  {
    resourceID: 'res-002',
    category: 'Getting Started',
    title: 'Onboarding Checklist (Coming Soon)',
    description: 'Step-by-step checklist to get your store ready to launch.',
    url: '#',
    isAffiliate: false,
  },
  {
    resourceID: 'res-003',
    category: 'Marketing',
    title: 'Social Media Templates (Coming Soon)',
    description: 'Pre-made graphics and post templates for Instagram, Facebook, and more.',
    url: '#',
    isAffiliate: false,
  },
  {
    resourceID: 'res-004',
    category: 'Marketing',
    title: 'Photography Tips (Coming Soon)',
    description: 'Guide to taking beautiful product photos on a budget.',
    url: '#',
    isAffiliate: false,
  },
  {
    resourceID: 'res-005',
    category: 'Affiliate Tools',
    title: 'Recommended Gear & Supplies (Coming Soon)',
    description: 'Curated list of tools, materials, and supplies for makers.',
    url: '#',
    isAffiliate: true,
  },
  {
    resourceID: 'res-006',
    category: 'Affiliate Tools',
    title: 'Shipping & Packaging Resources (Coming Soon)',
    description: 'Best packaging materials and shipping solutions for small businesses.',
    url: '#',
    isAffiliate: true,
  },
  {
    resourceID: 'res-007',
    category: 'Education',
    title: 'Pricing & Branding Guides (Coming Soon)',
    description: 'Learn how to price your products competitively and build your brand.',
    url: '#',
    isAffiliate: false,
  },
  {
    resourceID: 'res-008',
    category: 'Education',
    title: 'Legal & Tax Basics (Coming Soon)',
    description: 'Overview of business licenses, taxes, and legal requirements.',
    url: '#',
    isAffiliate: false,
  },
  {
    resourceID: 'res-009',
    category: 'Community',
    title: 'Vendor Facebook Group (Coming Soon)',
    description: 'Join our private community to connect with other makers and sellers.',
    url: '#',
    isAffiliate: false,
  },
  {
    resourceID: 'res-010',
    category: 'Community',
    title: 'Monthly Vendor Newsletter (Coming Soon)',
    description: 'Sign up for tips, updates, and feature opportunities.',
    url: '#',
    isAffiliate: false,
  },
];

export const resourceCategories = [
  'All',
  'Getting Started',
  'Marketing',
  'Affiliate Tools',
  'Education',
  'Community',
] as const;
