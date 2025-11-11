# Overboard Market - Nationwide Framework Implementation

## ✅ Implementation Summary

I've successfully implemented your nationwide event and vendor framework for Overboard Market. Here's what has been completed:

---

## 🗄️ Database Schema

### File: `app/utils/nationwideFrameworkSchema.sql`

**To deploy:** Run this SQL in your Supabase SQL Editor

This comprehensive schema includes:

1. **`states` table** - All 50 US states with regions
2. **Updated `vendors` table** - Added `state`, `region`, `subscription_status`, `subscription_type`, and `joined_date` fields
3. **`events` table** - Complete event management with:
   - Event types (Seasonal, State, Regional, National, Themed)
   - Location scopes (Nationwide, specific states, regions)
   - Featured state codes for multi-state events
   - Automatic slug generation from event names
4. **`vendor_event_links` table** - Many-to-many relationship between vendors and events
5. **Automated triggers** - Auto-adds active monthly vendors to new live events
6. **Helper functions** - Get vendor counts, query utilities
7. **Views** - Pre-computed views for events with vendor counts and vendors with their events
8. **Row Level Security (RLS)** - Proper permissions for all tables

---

## 📊 Data Models Updated

### Vendors (`mocks/vendors.ts`)
- ✅ Added `state` field (e.g., 'OR', 'TX', 'WI')
- ✅ Added `region` field (Midwest, South, Northeast, West)
- ✅ Added `subscriptionStatus` ('active' | 'inactive')
- ✅ Added `subscriptionType` ('monthly' | 'event_pass' | null)
- All 6 mock vendors now have complete state information

### Events (`mocks/events.ts`)
- ✅ Added `slug` for URL-friendly identifiers
- ✅ Added `eventType` (Seasonal, State, Regional, National, Themed)
- ✅ Added `locationScope` (Nationwide, specific region, etc.)
- ✅ Added `featuredStateCodes` array for multi-state events
- ✅ Updated event naming convention: "Overboard Market – [Location] [Theme] Market"

Example events:
- "Overboard Market – National New Year Makers Market" (Nationwide)
- "Overboard Market – Midwest Spring Artisan Market" (Regional: 12 midwest states)
- "Overboard Market – National Summer Makers Festival" (Nationwide)

---

## 🗺️ States Management

### File: `constants/states.ts`

Complete US states data structure with helper functions:
- All 50 US states with codes, names, and regions
- Region constants (Midwest, Northeast, South, West)
- Helper functions:
  - `getStatesByRegion(region)` - Get all states in a region
  - `getStateByCode(code)` - Find state by 2-letter code
  - `getStateByName(name)` - Find state by full name

---

## 🔐 Authentication Updates

### File: `app/contexts/VendorAuthContext.tsx`

Updated vendor authentication to support the nationwide framework:
- ✅ Added `state` and `region` fields to `VendorProfile` type
- ✅ Added `subscription_status`, `subscription_type`, `joined_date` to profile
- ✅ Updated `signUp()` function to accept optional `state` parameter
- State is passed through to Supabase user metadata during vendor signup

---

## 🏪 Shop Local Feature

### File: `app/shop-local.tsx`

**NEW PAGE** - Complete "Shop Local" implementation with:

#### Features:
1. **State Filter** - Browse all 50 US states in a 2-column grid
2. **Region Filter** - Quick filter by Midwest, Northeast, South, West
3. **Search** - Find vendors by name, specialty, or location
4. **Live Events** - Shows live events relevant to selected state/region
5. **Vendor List** - Filtered active vendors with:
   - Avatar, name, specialty, location
   - Tap to view full vendor profile
   - Real-time filtering

#### Smart Event Logic:
- Shows "Nationwide" events for any state
- Shows regional events when filtering by states in that region
- Shows state-specific events
- Dynamic event cards with LIVE badges

#### UX Highlights:
- Beautiful gradient header
- Persistent state/region selection
- "Clear" button to reset filters
- Vendor count display
- Mobile-optimized scrolling
- Professional nautical design matching your brand

---

## 📱 Usage Examples

### For Shoppers:

1. **Shop by State:**
   ```
   Navigate to /shop-local
   → Tap "Wisconsin" 
   → See all active vendors in WI + live events available to WI vendors
   ```

2. **Shop by Region:**
   ```
   Navigate to /shop-local
   → Tap "Midwest" region filter
   → See all vendors across 12 midwest states
   → See regional + national events
   ```

3. **Search:**
   ```
   Type "pottery" → See all pottery vendors nationwide
   Select "Oregon" + type "pottery" → See Oregon pottery vendors only
   ```

### For Vendors:

1. **Onboarding** (already implemented in `vendor-onboarding.tsx`):
   - Location step collects state during vendor setup
   - State is saved to vendor profile

2. **Subscription Logic:**
   - $15/month → `subscription_type = 'monthly'`, auto-added to all live events
   - $20 one-time → `subscription_type = 'event_pass'`, manually added to specific event

---

## 🎨 Brand Identity

Events now follow your naming convention:
```
Overboard Market – [Location Scope] [Theme/Season] [Type]
```

Examples:
- ✅ Overboard Market – National Winter Wonderland Fair
- ✅ Overboard Market – Midwest Spring Artisan Market  
- ✅ Overboard Market – National New Year Makers Market

---

## 🚀 Next Steps to Deploy

### 1. **Database Setup (Required)**
Run `app/utils/nationwideFrameworkSchema.sql` in Supabase SQL Editor

### 2. **Test the Shop Local Page**
Navigate to `/shop-local` to see the filtering in action

### 3. **Link Shop Local from Navigation**
You can add a button/link to Shop Local from:
- Home page
- Community page
- Shop page header
- Tab navigation (if desired)

Example link:
```tsx
<TouchableOpacity onPress={() => router.push('/shop-local')}>
  <Text>Shop Local</Text>
</TouchableOpacity>
```

### 4. **Vendor Data Migration (If Using Real Data)**
If you have existing vendors in Supabase:
```sql
-- Update existing vendors with state info
UPDATE vendors 
SET state = 'WI', region = 'Midwest' 
WHERE business_name = 'Example Vendor';
```

### 5. **Event Creation**
When creating events through admin, use the new naming convention:
```
Event Name: Overboard Market – [Region] [Season] Market
Event Type: Seasonal | Regional | State | National | Themed
Location Scope: Nationwide | Midwest | Wisconsin | etc.
Featured States: ['WI', 'MN', 'IL'] (for multi-state events)
```

---

## 🎯 Key Benefits

1. **Scalable Nationwide** - Works for vendors across all 50 states
2. **Local Discovery** - Shoppers find vendors near them easily
3. **Flexible Events** - Support national, regional, and state-specific fairs
4. **Simple Pricing** - $15/month flat fee, no commissions
5. **Smart Filtering** - Region + state + search + event filtering
6. **Future-Ready** - Schema supports expansion (multi-state markets, seasonal rotations, etc.)

---

## 📝 Implementation Notes

### What's Already Working:
- ✅ Mock data (6 vendors, 4 events) has full state/region data
- ✅ Vendor onboarding collects state during location step
- ✅ VendorAuthContext passes state through signup
- ✅ Shop Local page fully functional with filtering
- ✅ Event naming follows your brand guidelines

### What Needs Database Deploy:
- Run the SQL schema file to enable this in production
- Link Shop Local page from your main navigation
- Start creating events using the new structure

---

## 🌊 Overboard Market Brand

All implementations follow your brand identity:
- **Colors**: Nautical Blue, Seafoam Teal, Driftwood Beige
- **Tagline**: "Where small shops set sail"
- **Voice**: Friendly, supportive, small-town charm
- **Mission**: Helping makers thrive without commissions or complex fees

---

## Questions or Issues?

The framework is production-ready. Once you run the SQL schema:
1. Your existing vendor onboarding will collect state data ✅
2. Shop Local page will work immediately ✅
3. You can start creating nationwide/regional events ✅

Let me know if you need help with:
- Adding Shop Local to navigation
- Creating your first real event
- Migrating existing vendor data
- Setting up admin event creation tools
