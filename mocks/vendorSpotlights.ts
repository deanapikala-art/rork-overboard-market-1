export interface VendorSpotlight {
  id: string;
  vendorId: string;
  vendorName: string;
  vendorAvatar: string;
  title: string;
  subtitle: string;
  story: string;
  featuredImage: string;
  videoUrl?: string;
  publishDate: string;
  tags: string[];
  highlights: {
    icon: string;
    label: string;
    value: string;
  }[];
}

export const vendorSpotlights: VendorSpotlight[] = [
  {
    id: 'spotlight-1',
    vendorId: '1',
    vendorName: 'Luna Ceramics',
    vendorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80',
    title: 'From Clay to Creation',
    subtitle: 'The Journey of Luna Ceramics',
    story: `Meet Sarah, the artist behind Luna Ceramics. What started as a hobby in her garage has blossomed into a thriving small business creating beautiful, functional pottery.\n\n"I've always been drawn to the simplicity and elegance of minimalist design," Sarah shares. "Each piece I create is meant to bring a moment of calm and beauty to everyday life."\n\nSarah's journey began five years ago when she took her first pottery class. Instantly hooked, she saved up for a small kiln and wheel, transforming her garage into a studio. Today, her work is featured in homes across the country.\n\n"What I love most about being part of this marketplace is connecting with customers who truly appreciate handmade goods. Every piece tells a story, and I love knowing that my work becomes part of someone's daily ritual."`,
    featuredImage: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&q=80',
    videoUrl: 'https://images.unsplash.com/photo-1493106641515-6b5631de4bb9?w=800&q=80',
    publishDate: '2025-10-28',
    tags: ['pottery', 'handmade', 'minimalist', 'local artisan'],
    highlights: [
      { icon: '🎨', label: 'Years Crafting', value: '5+' },
      { icon: '🏆', label: 'Pieces Sold', value: '500+' },
      { icon: '⭐', label: 'Customer Rating', value: '5.0' },
    ],
  },
  {
    id: 'spotlight-2',
    vendorId: '2',
    vendorName: 'Willow & Thread',
    vendorAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80',
    title: 'Weaving Sustainability Into Every Thread',
    subtitle: 'The Eco-Friendly Mission of Willow & Thread',
    story: `Emma and Jake founded Willow & Thread with a simple mission: create beautiful textiles that are kind to the earth.\n\n"We were frustrated by the environmental impact of fast fashion," Emma explains. "We wanted to prove that sustainable could also be stunning."\n\nWorking from their Asheville studio, they hand-weave each piece using organic fibers and natural dyes derived from plants they grow themselves. Their blankets, scarves, and home goods have become sought-after heirlooms.\n\n"People tell us our pieces become treasured family items," Jake says. "That's exactly what we hoped for - textiles that last generations, not seasons."\n\nTheir commitment to sustainability extends beyond materials. They use solar power in their studio, compost all plant waste, and donate 5% of profits to environmental causes.`,
    featuredImage: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800&q=80',
    publishDate: '2025-10-21',
    tags: ['sustainable', 'textiles', 'eco-friendly', 'handwoven'],
    highlights: [
      { icon: '🌱', label: 'Carbon Neutral', value: '100%' },
      { icon: '💚', label: 'Trees Planted', value: '200+' },
      { icon: '♻️', label: 'Waste Diverted', value: '95%' },
    ],
  },
  {
    id: 'spotlight-3',
    vendorId: '3',
    vendorName: 'Forge & Bloom',
    vendorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
    title: 'Forging Beauty From Metal',
    subtitle: 'The Artistic Journey of Forge & Bloom',
    story: `Marcus discovered metalworking during a difficult time in his life. What began as therapy became his passion and livelihood.\n\n"Working with metal is transformative," Marcus reflects. "You take something hard and unyielding and shape it into something beautiful. It's a powerful metaphor."\n\nHis jewelry pieces combine the strength of metal with the delicacy of nature-inspired designs. Each ring, necklace, and bracelet is hand-forged in his Austin studio.\n\n"I love taking custom orders," he says. "When someone trusts me to create a piece for a special moment in their life - an engagement, anniversary, graduation - it's incredibly meaningful."\n\nMarcus also teaches metalworking classes, sharing his craft with the community and inspiring the next generation of artisans.`,
    featuredImage: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&q=80',
    videoUrl: 'https://www.youtube.com/embed/jfKfPfyJRdk',
    publishDate: '2025-10-14',
    tags: ['metalwork', 'jewelry', 'handcrafted', 'custom'],
    highlights: [
      { icon: '🔨', label: 'Years Experience', value: '8' },
      { icon: '💍', label: 'Custom Pieces', value: '300+' },
      { icon: '👥', label: 'Students Taught', value: '150+' },
    ],
  },
  {
    id: 'spotlight-4',
    vendorId: '4',
    vendorName: 'Oak & Honey',
    vendorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',
    title: 'Woodworking With Heart',
    subtitle: 'Family Traditions at Oak & Honey',
    story: `For the Thompson family, woodworking isn't just a business - it's a legacy. Three generations work side by side in their Denver workshop.\n\n"My grandfather taught my father, my father taught me, and now I'm teaching my kids," says Michael Thompson. "Each piece we make carries that history."\n\nTheir specialty is heirloom furniture - dining tables, bed frames, and shelving units built to last lifetimes. They source wood from sustainable forests and salvaged materials.\n\n"We've made dining tables where families will gather for decades," Michael shares. "We've built cribs that will become toddler beds, then get passed down to grandchildren. That continuity means everything to us."\n\nThe workshop welcomes visitors, offering tours where you can see craftsmen at work and smell the fresh-cut wood.`,
    featuredImage: 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=800&q=80',
    publishDate: '2025-10-07',
    tags: ['woodworking', 'furniture', 'family business', 'heirloom'],
    highlights: [
      { icon: '🌲', label: 'Generations', value: '3' },
      { icon: '🪑', label: 'Furniture Built', value: '1000+' },
      { icon: '🌟', label: 'Years in Business', value: '45' },
    ],
  },
  {
    id: 'spotlight-5',
    vendorId: '5',
    vendorName: 'Stitch & Story',
    vendorAvatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&q=80',
    title: 'Threading Memories Into Art',
    subtitle: 'The Heartfelt Embroidery of Stitch & Story',
    story: `Rachel's embroidery art captures life's precious moments one stitch at a time. Her custom portraits have become treasured keepsakes for families across the country.\n\n"I started embroidering pet portraits as gifts for friends," Rachel remembers. "The response was so emotional - people were moved to tears seeing their beloved companions rendered in thread."\n\nNow she creates custom pieces from family photos, wedding portraits, and even recreations of children's drawings. Each piece takes 20-40 hours of detailed work.\n\n"What I love is that embroidery is permanent," she explains. "Unlike a photo that can fade, these pieces will last for generations. They become family heirlooms."\n\nRachel also donates her time to create memorial pieces for families who've lost loved ones, calling it her way of giving back to the community.`,
    featuredImage: 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=800&q=80',
    publishDate: '2025-09-30',
    tags: ['embroidery', 'custom portraits', 'handmade', 'memory keeping'],
    highlights: [
      { icon: '🧵', label: 'Hours Per Piece', value: '20-40' },
      { icon: '🎨', label: 'Custom Orders', value: '200+' },
      { icon: '❤️', label: 'Five Star Reviews', value: '100%' },
    ],
  },
];

export function getVendorSpotlightById(id: string): VendorSpotlight | undefined {
  return vendorSpotlights.find(spotlight => spotlight.id === id);
}

export function getVendorSpotlightsByVendorId(vendorId: string): VendorSpotlight[] {
  return vendorSpotlights.filter(spotlight => spotlight.vendorId === vendorId);
}

export function getFeaturedSpotlights(limit: number = 3): VendorSpotlight[] {
  return vendorSpotlights.slice(0, limit);
}
