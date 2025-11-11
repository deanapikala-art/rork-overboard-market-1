# Service Vendor Implementation Guide

## ✅ Completed Tasks

### 1. Database Schema (`app/utils/serviceVendorsSchema.sql`)
- Extended `vendors` table with service-specific fields:
  - `vendor_type` (product, service, both)
  - `service_area_type` (local, virtual, both)
  - `service_area_zip_codes` (array)
  - `service_categories` (array)
  - `booking_link`, `pricing_model`, `starting_price`
  - `availability_notes`, `portfolio_images`, `testimonials`
  - `verified_status`, `tos_accepted`, `short_bio`
- Created `service_packages` table with full CRUD policies
- Added indexes for performance
- Extended `live_vendor_fair_vendors` with `booth_type`

**To Apply:** Run this SQL in your Supabase SQL Editor

### 2. Service Categories Constants (`constants/serviceCategories.ts`)
- Defined 4 category groups with 20 total categories:
  - Business & Professional (5)
  - Creative & Lifestyle (5)
  - Local Services (5)
  - Specialty (5)
- Created TypeScript types: `VendorType`, `ServiceAreaType`, `PricingModel`, `ServiceCategory`
- Exported arrays for UI components

### 3. Service Vendor Onboarding (`app/service-vendor-onboarding.tsx`)
Complete 6-step onboarding flow with:

**Step 1 - Profile Basics:**
- Business/Brand Name (required)
- Logo Upload (with image picker)
- Short Bio (max 240 chars, required)
- Contact Email (required)

**Step 2 - Vendor Type & Category:**
- Vendor Type selection (Product/Service/Both)
- Service Categories (multi-select chips, required if service/both)
- Service Area Type (Local/Virtual/Both, required if service/both)
- Local ZIP Codes (up to 10, required if local area)

**Step 3 - Pricing & Packages:**
- Pricing Model (Flat Rate/Hourly/Retainer/Quote)
- Starting Price (optional)
- Service Packages (repeatable, at least 1 required):
  - Name, Description, Price, Duration, Active toggle

**Step 4 - Booking & Availability:**
- Booking Link (optional, for Calendly/Acuity/etc)
- Availability Notes (optional)

**Step 5 - Portfolio & Social Proof:**
- Portfolio Images (multi-upload, optional)
- Testimonials (repeatable, optional):
  - Name, Quote (max 280 chars)

**Step 6 - Policies & Submit:**
- Service Vendor Agreement checkbox (required)
- Request Verification toggle (optional)
- Submit button with disclaimer

**Features:**
- Progress bar showing completion %
- Step indicators with checkmarks
- Form validation per step
- Image picker for logo and portfolio
- Dynamic ZIP code input with chips
- Package and testimonial management

### 4. Vendor Type Filter Component (`app/components/VendorTypeFilter.tsx`)
Reusable filter component with:
- Segmented control: All · Products · Services
- Service category chips (shown when Services selected)
- Clean, modern mobile design
- Proper TypeScript types

### 5. Mock Data Updates (`mocks/vendors.ts`)
Added 6 new service vendors:
1. **Overboard Recruiting Co** (Virtual, Recruiting & HR)
2. **Pixel Perfect Design** (Both, Graphic/Web Design + Marketing)
3. **Green Thumb Landscaping** (Local, Lawn/Landscaping)
4. **Life Coach Sarah** (Virtual, Coaching/Mentorship)
5. **Happy Paws Pet Sitting** (Local, Pet Sitting/Grooming)
6. **Oak & Hammer Custom Builds** (Both, Custom Woodworking)

All include proper fields: `vendorType`, `serviceCategories`, `serviceAreaType`, `bookingLink`, `pricingModel`, etc.

---

## 🔨 Remaining Tasks

### 1. Update Shop/Marketplace Page (`app/(tabs)/shop.tsx`)

Add filtering logic:

```typescript
import { VendorTypeFilter, VendorFilterType } from '@/app/components/VendorTypeFilter';

// Add state
const [vendorTypeFilter, setVendorTypeFilter] = useState<VendorFilterType>('all');
const [selectedServiceCategories, setSelectedServiceCategories] = useState<string[]>([]);

// Update filteredProducts logic
const filteredProducts = useMemo(() => {
  let filtered = products.filter(product => {
    // Existing category and search filters...
    
    // Vendor type filter
    const vendor = vendors.find(v => v.id === product.vendorId);
    if (!vendor) return false;
    
    if (vendorTypeFilter === 'product') {
      if (vendor.vendorType === 'service') return false;
    } else if (vendorTypeFilter === 'service') {
      if (vendor.vendorType === 'product') return false;
      
      // Service category filter
      if (selectedServiceCategories.length > 0) {
        const hasCategory = vendor.serviceCategories?.some(cat => 
          selectedServiceCategories.includes(cat)
        );
        if (!hasCategory) return false;
      }
    }
    
    return true;
  });
  
  // ... existing proximity filter
  
  return filtered;
}, [selectedCategory, searchQuery, vendorTypeFilter, selectedServiceCategories, ...]);

// Add to render (before categories section)
<VendorTypeFilter
  selectedType={vendorTypeFilter}
  onTypeChange={setVendorTypeFilter}
  selectedCategories={selectedServiceCategories}
  onCategoriesChange={setSelectedServiceCategories}
/>
```

**Service Vendor Card Rendering:**
When rendering service vendors (vendorType === 'service' or 'both'):
- Show 💼 Service badge
- Display service categories as chips
- Show service area: "Virtual + Local" or "Local: 54016, 55101..."
- Add buttons: **View Profile** | **Book** (if bookingLink) | **Message**

**Empty States:**
- Services: "No services match those filters. Try clearing a category or expanding your area."
- Products: "No products match those filters. Try different categories or keywords."

### 2. Update Live Vendor Fairs Page (`app/events/[slug].tsx`)

Similar filtering as marketplace, but with booth-specific logic:

```typescript
// Filter vendors attending the fair
const fairVendors = useMemo(() => {
  // Get vendors for this fair
  let filtered = eventVendors.filter(ev => ev.fairId === eventId);
  
  // Apply vendor type filter
  if (vendorTypeFilter === 'product') {
    filtered = filtered.filter(ev => {
      const vendor = vendors.find(v => v.id === ev.vendorId);
      return vendor && (vendor.vendorType === 'product' || vendor.vendorType === 'both');
    });
  } else if (vendorTypeFilter === 'service') {
    filtered = filtered.filter(ev => {
      const vendor = vendors.find(v => v.id === ev.vendorId);
      if (!vendor || vendor.vendorType === 'product') return false;
      
      // Category filter
      if (selectedServiceCategories.length > 0) {
        return vendor.serviceCategories?.some(cat => 
          selectedServiceCategories.includes(cat)
        );
      }
      return true;
    });
  }
  
  return filtered;
}, [eventId, vendorTypeFilter, selectedServiceCategories]);
```

**Fair Vendor Rendering:**
For service vendors at fairs:
- Show booth type badge: "Service" or "Both"
- Display categories and short bio
- Buttons: **View Profile**, **Book**, **Message**

### 3. Create Service Vendor Profile View (Optional Enhancement)

Create `app/service-vendor/[id].tsx` or extend `app/vendor/[id].tsx`:
- Display all service-specific fields
- Show service packages as cards
- Display portfolio images in a gallery
- Show testimonials
- Booking CTA if link exists
- Service area information
- Verified badge if `verifiedStatus === 'verified'`

### 4. Testing Checklist

- [ ] Service vendor onboarding completes successfully
- [ ] Filter shows/hides service categories correctly
- [ ] Filtering products vs services works
- [ ] Service category chips filter correctly
- [ ] Empty states display properly
- [ ] Service vendor cards show booking button when link present
- [ ] Both type vendors appear in both filters
- [ ] Mobile layout looks good on all steps
- [ ] Image uploads work for logo and portfolio
- [ ] Form validation prevents incomplete submissions

---

## 📝 Copy Blocks (Ready to Paste)

### Filter Labels:
- "Filter by"
- "All · Products · Services"
- "Service Categories"

### Empty States:
- **Services (Marketplace):** "No service vendors matched those filters."
- **Services (Fairs):** "No service vendors are attending this fair with those filters."

### Policy Disclaimer (Footer on service profiles):
"Overboard Market connects buyers with independent service providers. Services are delivered by the vendor. Please review vendor policies before booking."

---

## 🔍 Quick Reference

### Vendor Type Logic:
```typescript
// Product vendors: vendorType === 'product' or vendorType === 'both'
// Service vendors: vendorType === 'service' or vendorType === 'both'
// Both: can appear in either filter
```

### Service Area Display:
```typescript
const getServiceAreaText = (vendor: Vendor) => {
  if (vendor.serviceAreaType === 'virtual') return 'Virtual';
  if (vendor.serviceAreaType === 'local') {
    const zips = vendor.serviceAreaZipCodes?.slice(0, 3).join(', ');
    const more = vendor.serviceAreaZipCodes?.length > 3 ? '...' : '';
    return `Local: ${zips}${more}`;
  }
  return 'Virtual + Local';
};
```

### Pricing Display:
```typescript
const getPriceText = (vendor: Vendor) => {
  if (!vendor.startingPrice) return vendor.pricingModel === 'quote' ? 'Get a Quote' : 'Contact for Pricing';
  
  const price = `$${vendor.startingPrice}`;
  switch (vendor.pricingModel) {
    case 'hourly': return `${price}/hr`;
    case 'retainer': return `${price}/mo`;
    case 'flat_rate': return `Starting at ${price}`;
    default: return price;
  }
};
```

---

## 🚀 Next Steps

1. Apply the SQL schema in Supabase
2. Test the service vendor onboarding flow
3. Integrate `VendorTypeFilter` into marketplace and fairs pages
4. Add service vendor card rendering
5. Test all filtering logic
6. (Optional) Create dedicated service vendor profile page

All core functionality is implemented. The remaining work is primarily integrating the filter component and updating the card rendering logic in existing pages.
