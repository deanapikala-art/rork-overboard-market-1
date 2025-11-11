export interface BulletinPost {
  id: string;
  type: 'sale' | 'giveaway' | 'announcement' | 'update' | 'spotlight' | 'event';
  title: string;
  content: string;
  author: string;
  authorAvatar?: string;
  vendorId?: string;
  date: string;
  expiresDate?: string;
  image?: string;
  link?: string;
  linkText?: string;
  tags: string[];
  isPinned: boolean;
  likes: number;
  comments: number;
}

export const bulletinPosts: BulletinPost[] = [
  {
    id: 'bulletin-1',
    type: 'giveaway',
    title: '🎁 Holiday Giveaway - Win a $100 Shopping Spree!',
    content: "Enter to win a $100 gift card to use anywhere in our marketplace! To enter: 1) Follow us on social media 2) Tag 3 friends in the comments 3) Share this post. Winner announced Nov 20th!",
    author: 'Fair Marketplace Team',
    date: '2025-11-01',
    expiresDate: '2025-11-20',
    image: 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=800&q=80',
    link: 'https://facebook.com/fairmarketplace/giveaway',
    linkText: 'Enter Giveaway',
    tags: ['giveaway', 'contest', 'holiday'],
    isPinned: true,
    likes: 234,
    comments: 89,
  },
  {
    id: 'bulletin-2',
    type: 'sale',
    title: '🔥 Flash Sale: 30% Off All Pottery - Today Only!',
    content: 'Luna Ceramics is having a flash sale! Get 30% off all pottery items for the next 24 hours. Perfect time to stock up on holiday gifts or treat yourself!',
    author: 'Luna Ceramics',
    authorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80',
    vendorId: '1',
    date: '2025-11-03',
    expiresDate: '2025-11-04',
    image: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&q=80',
    link: '/vendor/1',
    linkText: 'Shop Now',
    tags: ['sale', 'pottery', 'flash sale'],
    isPinned: true,
    likes: 156,
    comments: 42,
  },
  {
    id: 'bulletin-3',
    type: 'announcement',
    title: '📢 New Vendor Spotlight Program Launching!',
    content: "We're excited to announce our new 'Meet the Maker' vendor spotlight series! Each week we'll feature a different vendor, sharing their story and offering exclusive deals. First spotlight: Luna Ceramics!",
    author: 'Fair Marketplace Team',
    date: '2025-10-30',
    link: '/community/spotlight',
    linkText: 'Read More',
    tags: ['announcement', 'vendors', 'spotlight'],
    isPinned: false,
    likes: 89,
    comments: 23,
  },
  {
    id: 'bulletin-4',
    type: 'update',
    title: '🌟 New Feature: Local Pickup Now Available!',
    content: "Great news! Many vendors now offer local pickup options. Save on shipping and meet your favorite makers in person. Look for the 'Pickup Available' badge when shopping!",
    author: 'Fair Marketplace Team',
    date: '2025-10-28',
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&q=80',
    tags: ['update', 'pickup', 'local'],
    isPinned: false,
    likes: 67,
    comments: 15,
  },
  {
    id: 'bulletin-5',
    type: 'spotlight',
    title: '💚 Vendor Spotlight: Willow & Thread Goes Carbon Neutral!',
    content: "Huge congratulations to Willow & Thread for achieving carbon neutral certification! They've planted 200+ trees and diverted 95% of waste. Supporting sustainable makers has never felt so good!",
    author: 'Fair Marketplace Team',
    authorAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80',
    vendorId: '2',
    date: '2025-10-25',
    image: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800&q=80',
    link: '/vendor/2',
    linkText: 'Shop Sustainable',
    tags: ['spotlight', 'sustainable', 'eco-friendly'],
    isPinned: false,
    likes: 203,
    comments: 56,
  },
  {
    id: 'bulletin-6',
    type: 'event',
    title: '🎄 Holiday Craft Fair - Nov 15th - Mark Your Calendar!',
    content: "Our biggest event of the year is coming! Join us Nov 15th for a full day of shopping, live demos, and special promotions. Over 50 vendors participating. You won't want to miss this!",
    author: 'Fair Marketplace Team',
    date: '2025-10-22',
    image: 'https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=800&q=80',
    link: '/fair-schedule',
    linkText: 'View Schedule',
    tags: ['event', 'holiday', 'craft fair'],
    isPinned: false,
    likes: 178,
    comments: 67,
  },
  {
    id: 'bulletin-7',
    type: 'sale',
    title: '🛍️ Small Business Saturday - Shop Small, Shop Local!',
    content: "This Saturday is Small Business Saturday! Support your local makers with exclusive deals across the marketplace. Every purchase makes a difference in someone's life and community.",
    author: 'Fair Marketplace Team',
    date: '2025-10-20',
    tags: ['sale', 'small business', 'local'],
    isPinned: false,
    likes: 145,
    comments: 34,
  },
  {
    id: 'bulletin-8',
    type: 'giveaway',
    title: '🎉 Thank You for 1000 Members - Giveaway Time!',
    content: "We hit 1000 members! To celebrate, we're giving away 5 prizes from different vendors. Winners announced Friday. Thank you for supporting our small business community!",
    author: 'Fair Marketplace Team',
    date: '2025-10-18',
    expiresDate: '2025-11-08',
    image: 'https://images.unsplash.com/photo-1464687452547-f3d2bca46bb2?w=800&q=80',
    link: 'https://facebook.com/fairmarketplace/1000giveaway',
    linkText: 'Enter to Win',
    tags: ['giveaway', 'milestone', 'celebration'],
    isPinned: false,
    likes: 267,
    comments: 124,
  },
];

export function getPinnedPosts(): BulletinPost[] {
  return bulletinPosts.filter(post => post.isPinned);
}

export function getRecentPosts(limit: number = 10): BulletinPost[] {
  return bulletinPosts
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
}

export function getPostsByType(type: BulletinPost['type']): BulletinPost[] {
  return bulletinPosts.filter(post => post.type === type);
}

export function getActivePosts(): BulletinPost[] {
  const now = new Date().getTime();
  return bulletinPosts.filter(post => {
    if (!post.expiresDate) return true;
    return new Date(post.expiresDate).getTime() > now;
  });
}
