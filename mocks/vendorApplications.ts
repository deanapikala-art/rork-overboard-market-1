export interface VendorApplication {
  id: string;
  applicantName: string;
  businessName: string;
  email: string;
  phone: string;
  specialty: string;
  description: string;
  websiteUrl?: string;
  instagramHandle?: string;
  appliedDate: string;
  status: 'pending' | 'approved' | 'rejected';
  avatar?: string;
  portfolioImages: string[];
}

export const vendorApplications: VendorApplication[] = [
  {
    id: 'app-1',
    applicantName: 'Sarah Mitchell',
    businessName: 'Coastal Candle Co.',
    email: 'sarah@coastalcandles.com',
    phone: '(555) 123-4567',
    specialty: 'Candles & Home Fragrance',
    description: 'Hand-poured soy candles inspired by coastal living. Each candle is made with premium essential oils and sustainable materials.',
    websiteUrl: 'https://coastalcandles.com',
    instagramHandle: '@coastalcandleco',
    appliedDate: '2025-10-15',
    status: 'pending',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80',
    portfolioImages: [
      'https://images.unsplash.com/photo-1602874801006-94a3bcafdae9?w=400&q=80',
      'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&q=80',
      'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=400&q=80',
    ],
  },
  {
    id: 'app-2',
    applicantName: 'Marcus Chen',
    businessName: 'Ink & Paper Studio',
    email: 'marcus@inkpaperstudio.com',
    phone: '(555) 234-5678',
    specialty: 'Letterpress & Stationery',
    description: 'Traditional letterpress printing meets modern design. Custom invitations, art prints, and handmade paper goods.',
    websiteUrl: 'https://inkpaperstudio.com',
    instagramHandle: '@inkpaperstudio',
    appliedDate: '2025-10-18',
    status: 'pending',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80',
    portfolioImages: [
      'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&q=80',
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&q=80',
    ],
  },
  {
    id: 'app-3',
    applicantName: 'Elena Rodriguez',
    businessName: 'Wild Flora Botanicals',
    email: 'elena@wildflora.com',
    phone: '(555) 345-6789',
    specialty: 'Pressed Flowers & Botanical Art',
    description: 'Preserved botanicals transformed into wearable art and home decor. Each piece captures the beauty of nature.',
    instagramHandle: '@wildflorabotanicals',
    appliedDate: '2025-10-20',
    status: 'pending',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',
    portfolioImages: [
      'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400&q=80',
      'https://images.unsplash.com/photo-1455659817273-f96807779a8a?w=400&q=80',
      'https://images.unsplash.com/photo-1469504512102-900f29606341?w=400&q=80',
    ],
  },
];
