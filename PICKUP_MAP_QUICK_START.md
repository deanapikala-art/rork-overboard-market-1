# 🗺️ Pickup Map System - Quick Start Guide

## What Was Built

A complete **Google Maps-powered pickup location system** for Overboard Market vendors with:
- Interactive map picker with drag-and-drop pin placement
- Privacy-first coordinate rounding (~0.6 mile accuracy)
- Automatic distance-based pickup availability (25/50/75/100 mile radius)
- Customer map previews with Google Maps integration
- Safety tips modal for vendors
- Cross-platform support (iOS, Android, Web)

---

## 🎯 For Vendors: How to Set Up Pickup

### Step 1: Enable Local Pickup
1. Go to **Vendor Dashboard → Shipping Settings**
2. Toggle **"Enable Local Pickup"** to ON
3. You'll see the pickup configuration section appear

### Step 2: Configure Your Pickup Location
1. **Enter Your ZIP Code** (5 digits, e.g., "54016")
   - This is used for distance calculations only
   - It's never shown to customers

2. **Interactive Map Appears**
   - Map automatically centers on your ZIP code
   - You'll see a pin and a radius circle

3. **Set Your Exact Pickup Spot** (3 ways):
   - **Drag the pin** on the map to your preferred location
   - **Click "Use My Location"** to auto-set (requires GPS permission)
   - **Click "Reset"** to return to ZIP center

4. **Choose Pickup Radius**
   - Select: **25, 50, 75, or 100 miles**
   - Customers outside this range won't see pickup option
   - Default: 75 miles

5. **Add Public Location Name**
   - Example: `"Hudson, WI – Downtown Park & Ride"`
   - This is what customers will see
   - Use a general area or public meeting spot (NOT your home address)

6. **Add Pickup Instructions**
   - Example: `"Pickup by appointment. Message me to schedule. Look for blue truck."`
   - These appear to customers at checkout

### Step 3: Review & Save
1. Check the **"Customer Preview"** box to see what buyers will see
2. Click **"Save Settings"**
3. Your pickup location is now active!

---

## 🛒 For Customers: How Pickup Works

### Finding Pickup Products
- Products with pickup show: **"🚚 Shipping from $X • Local pickup available"**
- Tap to see approximate pickup area

### At Checkout
1. Add items to cart from pickup-enabled vendor
2. At checkout, see **"Pick up locally instead"** toggle
3. If toggle is **enabled**: You're within the vendor's radius ✅
4. If toggle is **disabled/grayed**: You're too far away ❌
5. Toggle on to see:
   - Map preview with approximate location
   - Pickup instructions
   - "Open in Google Maps" button for directions

### After Purchase
- Exact pickup details provided in order confirmation
- Message vendor to schedule time
- Follow their pickup instructions

---

## 🔒 Privacy & Safety

### Vendor Privacy Protection
✅ **Coordinates are automatically rounded** to ~0.6 mile accuracy  
✅ **Only general area shown** to customers before purchase  
✅ **Public label controls** what customers see (e.g., "Hudson area")  
✅ **No home addresses** displayed publicly  

### Safety Tips (Shown on First Pickup Enable)
The system includes a safety modal with guidance on:
- Choosing safe meeting spots (public areas, police stations)
- Meeting during daylight hours
- Verifying orders before handoff
- Bringing someone along for high-value items
- Documenting transactions

---

## 📱 Platform Support

| Feature | iOS | Android | Web |
|---------|-----|---------|-----|
| Interactive Map | ✅ Full Native | ✅ Full Native | 🟡 Placeholder |
| Pin Placement | ✅ Drag & Drop | ✅ Drag & Drop | 🟡 Coordinates |
| "Use My Location" | ✅ GPS | ✅ GPS | 🟡 Browser API |
| Customer Preview | ✅ Full | ✅ Full | ✅ Full |
| Google Maps Link | ✅ Opens App | ✅ Opens App | ✅ Opens Browser |

**Web Note**: Web shows a placeholder with coordinates instead of interactive map. "Use My Location" uses browser geolocation. Fully functional but less visual.

---

## 🧪 Testing Your Setup

### Vendor Testing Checklist
1. [ ] Enable pickup and enter your ZIP
2. [ ] See map load with pin
3. [ ] Drag pin to a new location
4. [ ] Try "Use My Location" button
5. [ ] Try different radius options
6. [ ] Add public label and notes
7. [ ] Check customer preview looks good
8. [ ] Save and reload page
9. [ ] Verify coordinates persisted

### Customer Testing Checklist
1. [ ] View product with pickup enabled
2. [ ] See "Local pickup available" text
3. [ ] Add to cart
4. [ ] See pickup toggle at checkout
5. [ ] Toggle on to see map preview
6. [ ] Click "Open in Google Maps"
7. [ ] Verify correct location opens

---

## 🎨 What Customers See

### Product Page (Compact View)
```
🏠 Pickup available near
Hudson, WI – Park & Ride
[View in Maps]
(Approximate location)
```

### Checkout Page (Detailed View)
```
📍 Pickup Location
[MAP PREVIEW]
Hudson, WI – Downtown Park & Ride
Pickup by appointment. Message me to schedule.
[Open in Google Maps]
📍 Approximate area shown. Exact address provided after order.
```

---

## ⚙️ Technical Details

### Data Stored (Per Vendor)
```typescript
{
  pickupOriginZip: "54016",          // For distance calculations
  pickupGeoLat: 44.974,              // Rounded latitude
  pickupGeoLon: -92.756,             // Rounded longitude
  pickupPublicLabel: "Hudson, WI",   // Customer-facing name
  pickupNotes: "Pickup instructions",
  pickupRadiusMiles: "75",           // Max distance
  pickupAddressHidden: true,         // Privacy toggle
  allowLocalPickup: true,            // Master enable
}
```

### Distance Calculation
- Uses **Haversine formula** for accurate distances
- Compares customer ZIP to vendor ZIP
- Shows/hides pickup toggle based on radius
- See: `app/utils/zipDistance.ts`

---

## 📖 Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `PickupMapPicker` | `app/components/PickupMapPicker.tsx` | Vendor-side interactive map |
| `PickupMapPreview` | `app/components/PickupMapPreview.tsx` | Customer-side map display |
| `PickupSafetyTipsModal` | `app/components/PickupSafetyTipsModal.tsx` | Safety guidance for vendors |
| Vendor Settings | `app/vendor-shipping-settings.tsx` | Main configuration screen |
| Distance Utils | `app/utils/zipDistance.ts` | ZIP-to-ZIP distance calculations |

---

## 🐛 Troubleshooting

### Map doesn't appear
- **Check**: Did you enter a valid 5-digit ZIP code?
- **Try**: Refresh the page after entering ZIP

### "Use My Location" not working
- **Check**: Did you grant location permissions?
- **iOS**: Settings → Privacy → Location Services → [App Name]
- **Android**: Settings → Apps → [App Name] → Permissions
- **Web**: Browser should prompt for permission

### Coordinates not saving
- **Check**: Did you click "Save Settings" at the bottom?
- **Try**: Make sure you have unsaved changes indicator

### Customer can't see pickup option
- **Check**: Is customer within your pickup radius?
- **Check**: Do you have `allowLocalPickup` enabled?
- **Check**: Did you save your settings?

---

## 🎉 Example Use Cases

### Use Case 1: Urban Vendor with Parking Lot
```
ZIP: 55414 (Minneapolis)
Public Label: "Lake Street Public Parking Lot"
Radius: 50 miles
Notes: "Park in back row. I'll meet you at your car."
```

### Use Case 2: Rural Vendor with Police Station
```
ZIP: 54016 (Hudson, WI)
Public Label: "Hudson Police Department Parking"
Radius: 75 miles
Notes: "Meet by main entrance. Call when you arrive: (555) 123-4567"
```

### Use Case 3: Event Vendor at Farmers Market
```
ZIP: 53703 (Madison)
Public Label: "Dane County Farmers Market"
Radius: 25 miles
Notes: "Saturdays only, 8am-12pm. Look for booth #42."
```

---

## 💡 Pro Tips

1. **Choose busy public areas** for safer meetups
2. **Set realistic radius** based on your travel willingness
3. **Update notes seasonally** (e.g., "Winter: Meet at indoor entrance")
4. **Test your Google Maps link** to verify accuracy
5. **Message customers** to confirm pickup times
6. **Keep pickup items separate** from shipped items for easy handoff

---

## 📞 Need Help?

- **Documentation**: See `PICKUP_MAP_SYSTEM.md` for full technical details
- **Support**: Contact support@overboardmarket.com
- **Community**: Join vendor Facebook group for tips

---

## ✅ Quick Reference

| Action | Result |
|--------|--------|
| Toggle pickup ON | Pickup section appears |
| Enter 5-digit ZIP | Map loads automatically |
| Drag pin | Updates coordinates (rounded) |
| Click "Use My Location" | Auto-sets to your GPS location |
| Change radius | Updates customer visibility range |
| Click "Save Settings" | All changes persist |
| Customer within radius | Sees pickup toggle (enabled) |
| Customer outside radius | Sees pickup toggle (disabled) |

---

**Ready to go!** 🚀 Your pickup location system is fully configured and protecting both you and your customers.

Happy selling! 🎣✨
