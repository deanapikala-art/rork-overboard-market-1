# Vendor Social Media Setup Instructions

## Overview
This feature allows vendors to add their social media links (Facebook, Instagram, TikTok, Twitter, YouTube, Pinterest, LinkedIn) to their profiles. These links will be displayed on their public vendor page for customers to follow.

## Database Schema Update

### Step 1: Run the SQL Migration
Run the following SQL in your Supabase SQL Editor:

```sql
-- Located in: app/utils/vendorSocialsSchema.sql
```

This will add the following columns to the `vendors` table:
- `facebook_url` (TEXT)
- `instagram_url` (TEXT)
- `tiktok_url` (TEXT)
- `twitter_url` (TEXT)
- `youtube_url` (TEXT)
- `pinterest_url` (TEXT)
- `linkedin_url` (TEXT)

## Features Implemented

### 1. Vendor Dashboard - Settings Tab
Vendors can now add their social media URLs in the Settings tab under a new "Social Media" section.

**Location:** `app/(tabs)/vendor-dashboard.tsx`

Each platform has its own input field with placeholder URLs to guide vendors.

### 2. Public Vendor Profile
Social media links are displayed on the vendor's public profile page in a grid layout with platform icons.

**Location:** `app/vendor/[id].tsx`

- Only shows platforms that have URLs configured
- Styled buttons with brand colors for each platform
- Opens links in external browser when tapped

### 3. Type Definitions
Updated the `VendorProfile` type to include social media fields.

**Location:** `app/contexts/VendorAuthContext.tsx`

### 4. Vendor Type Interface
Updated the Vendor interface in mocks to include social media fields.

**Location:** `mocks/vendors.ts`

## UI/UX Design

### Social Media Section on Vendor Profile
- Clean grid layout (3 columns)
- Platform icons with colors:
  - Facebook: #1877F2 (blue)
  - Instagram: #E4405F (pink/red)
  - TikTok: #000000 (black)
  - Twitter: #1DA1F2 (blue)
  - YouTube: #FF0000 (red)
  - Pinterest: #E60023 (red) - custom "P" icon
  - LinkedIn: #0A66C2 (blue) - custom "in" icon
- Each button shows icon + platform name
- Tapping opens the link in external browser

### Vendor Dashboard Settings
- Input fields for each platform
- Full URL validation handled on save
- Part of the existing Settings tab flow
- Save button validates and stores all social media URLs

## Testing

### Test the Feature
1. Go to Vendor Dashboard → Settings tab
2. Scroll to "Social Media" section
3. Add URLs for different platforms
4. Click "Save Settings"
5. Preview your vendor page
6. Verify social media buttons appear
7. Click each button to test external links

### Example URLs for Testing
```
Facebook: https://facebook.com/yourpage
Instagram: https://instagram.com/yourusername
TikTok: https://tiktok.com/@yourusername
Twitter: https://twitter.com/yourusername
YouTube: https://youtube.com/@yourchannel
Pinterest: https://pinterest.com/yourusername
LinkedIn: https://linkedin.com/in/yourprofile
```

## Notes
- All social media URLs are optional
- Only platforms with URLs configured will be displayed
- URLs should be full URLs (including https://)
- Icons use lucide-react-native (Facebook, Instagram, Twitter, Youtube) and custom icons for Pinterest and LinkedIn
