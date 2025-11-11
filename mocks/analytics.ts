export interface EtsyClickEvent {
  type: 'etsy_outbound_click' | 'etsy_listing_click';
  vendor_id: string;
  url: string;
  timestamp: string;
}

export interface FairAnalytics {
  totalVisits: number;
  uniqueVisitors: number;
  totalSales: number;
  averageOrderValue: number;
  topVendors: {
    vendorId: string;
    vendorName: string;
    visits: number;
    sales: number;
  }[];
  visitsByDay: {
    date: string;
    visits: number;
  }[];
  salesByCategory: {
    category: string;
    sales: number;
    percentage: number;
  }[];
}

export const analyticsData: FairAnalytics = {
  totalVisits: 12847,
  uniqueVisitors: 8432,
  totalSales: 47389.50,
  averageOrderValue: 67.25,
  topVendors: [
    {
      vendorId: '3',
      vendorName: 'Forge & Bloom',
      visits: 2341,
      sales: 8920.00,
    },
    {
      vendorId: '6',
      vendorName: 'Prism & Clay',
      visits: 2187,
      sales: 7856.50,
    },
    {
      vendorId: '1',
      vendorName: 'Luna Ceramics',
      visits: 1965,
      sales: 6734.25,
    },
    {
      vendorId: '5',
      vendorName: 'Stitch & Story',
      visits: 1743,
      sales: 5982.00,
    },
    {
      vendorId: '2',
      vendorName: 'Willow & Thread',
      visits: 1521,
      sales: 4567.75,
    },
  ],
  visitsByDay: [
    { date: '10-22', visits: 1234 },
    { date: '10-23', visits: 1456 },
    { date: '10-24', visits: 1678 },
    { date: '10-25', visits: 2123 },
    { date: '10-26', visits: 2345 },
    { date: '10-27', visits: 1987 },
    { date: '10-28', visits: 2024 },
  ],
  salesByCategory: [
    { category: 'Jewelry & Metalwork', sales: 12456.75, percentage: 26.3 },
    { category: 'Pottery & Ceramics', sales: 10234.25, percentage: 21.6 },
    { category: 'Polymer Clay Art', sales: 8932.50, percentage: 18.9 },
    { category: 'Embroidery & Fiber Art', sales: 7345.00, percentage: 15.5 },
    { category: 'Textiles & Weaving', sales: 5421.00, percentage: 11.4 },
    { category: 'Woodcraft', sales: 3000.00, percentage: 6.3 },
  ],
};

export const logAnalyticsEvent = (event: EtsyClickEvent) => {
  console.log('[Analytics]', event);
};
