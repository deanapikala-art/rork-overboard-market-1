export interface Shoutout {
  id: string;
  customerId: string;
  customerName: string;
  customerAvatar?: string;
  vendorId: string;
  vendorName: string;
  message: string;
  imageUrl?: string;
  orderId?: string;
  productName?: string;
  createdAt: string;
  likes: number;
}

export const shoutouts: Shoutout[] = [
  {
    id: '1',
    customerId: 'c1',
    customerName: 'Sarah M.',
    customerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',
    vendorId: '1',
    vendorName: 'Luna Ceramics',
    message: 'Absolutely love this mug! Perfect for my morning coffee. The glaze is gorgeous! 🎨',
    imageUrl: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800&q=80',
    productName: 'Handmade Ceramic Mug',
    createdAt: '2025-10-28T10:30:00Z',
    likes: 24,
  },
  {
    id: '2',
    customerId: 'c2',
    customerName: 'Mike T.',
    vendorId: '3',
    vendorName: 'Forge & Bloom',
    message: 'Got this pendant for my wife and she LOVES it! Thank you for the beautiful work! ❤️',
    imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80',
    productName: 'Botanical Pendant',
    createdAt: '2025-10-27T14:20:00Z',
    likes: 18,
  },
  {
    id: '3',
    customerId: 'c3',
    customerName: 'Jessica L.',
    customerAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80',
    vendorId: '2',
    vendorName: 'Willow & Thread',
    message: 'This blanket is so cozy! Love supporting local makers 🧶',
    createdAt: '2025-10-27T09:15:00Z',
    likes: 31,
  },
  {
    id: '4',
    customerId: 'c4',
    customerName: 'David R.',
    vendorId: '4',
    vendorName: 'Oak & Honey',
    message: 'The cutting board is amazing! Quality craftsmanship at its finest 🪵',
    imageUrl: 'https://images.unsplash.com/photo-1556908153-7d2e14d2c608?w=800&q=80',
    productName: 'Walnut Cutting Board',
    createdAt: '2025-10-26T16:45:00Z',
    likes: 15,
  },
  {
    id: '5',
    customerId: 'c5',
    customerName: 'Emily K.',
    customerAvatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&q=80',
    vendorId: '1',
    vendorName: 'Luna Ceramics',
    message: 'Best pottery I\'ve ever bought! Can\'t wait to order more pieces 💚',
    createdAt: '2025-10-26T11:00:00Z',
    likes: 22,
  },
  {
    id: '6',
    customerId: 'c6',
    customerName: 'Brandon W.',
    vendorId: '5',
    vendorName: 'Stitch & Story',
    message: 'Custom embroidery of our dog is perfect! Made my wife cry happy tears 🐕',
    imageUrl: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&q=80',
    productName: 'Custom Pet Portrait',
    createdAt: '2025-10-25T13:30:00Z',
    likes: 45,
  },
  {
    id: '7',
    customerId: 'c7',
    customerName: 'Rachel P.',
    customerAvatar: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=400&q=80',
    vendorId: '6',
    vendorName: 'Prism & Clay',
    message: 'These earrings are so fun! Get compliments everywhere I go 💜',
    imageUrl: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=80',
    productName: 'Rainbow Clay Earrings',
    createdAt: '2025-10-25T08:20:00Z',
    likes: 28,
  },
  {
    id: '8',
    customerId: 'c8',
    customerName: 'Chris M.',
    vendorId: '3',
    vendorName: 'Forge & Bloom',
    message: 'Wedding rings turned out perfect! Thank you for making our day special! 💍',
    createdAt: '2025-10-24T15:00:00Z',
    likes: 67,
  },
];
