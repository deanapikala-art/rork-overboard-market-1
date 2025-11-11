# Overboard Market - Functional Testing Scenario

**Version:** 1.0  
**Last Updated:** January 2025  
**Test Environment:** Development/Staging  

---

## Test Execution Instructions

1. Execute tests in order (some tests depend on previous steps)
2. Mark each test as: ✅ PASS | ❌ FAIL | ⚠️ PARTIAL | ⏭️ SKIP
3. Document any failures with screenshots and reproduction steps
4. Test on minimum 2 platforms (iOS/Android + Web)
5. Use both real devices and simulators/emulators

---

## 1. Environment Setup

### 1.1 Platform Compatibility
- [ ] **iOS Device** - App launches without crashes
- [ ] **Android Device** - App launches without crashes  
- [ ] **Tablet (iOS/Android)** - Responsive layout displays correctly
- [ ] **Web Browser (Chrome)** - React Native Web renders properly
- [ ] **Web Browser (Safari)** - React Native Web renders properly
- [ ] **Web Browser (Firefox)** - React Native Web renders properly

### 1.2 Initial Load
- [ ] Splash screen displays correctly
- [ ] No JavaScript errors in console
- [ ] App loads within 3 seconds on good connection
- [ ] App shows loading state during initial data fetch
- [ ] Network error handling works when offline

### 1.3 Visual Integrity
- [ ] Logo appears correctly in header
- [ ] Navigation bar alignment is correct
- [ ] Hamburger menu icon visible and properly positioned
- [ ] No overlapping text or UI elements
- [ ] Color scheme matches brand guidelines
- [ ] Font rendering is consistent across screens

---

## 2. Authentication & Onboarding

### 2.1 Guest Access
- [ ] "Browse as Guest" button is visible on welcome screen
- [ ] Guest mode allows browsing marketplace
- [ ] Guest mode allows viewing vendor profiles
- [ ] Guest mode restricts access to vendor dashboard
- [ ] Guest mode restricts access to cart/checkout
- [ ] Guest mode shows "Sign in to continue" prompt when needed

### 2.2 Email Sign-Up
- [ ] Email signup form validates email format
- [ ] Password field requires minimum 8 characters
- [ ] Password visibility toggle works
- [ ] "Sign Up" button disabled until form is valid
- [ ] Success message displays after registration
- [ ] Confirmation email is sent (check inbox/spam)
- [ ] User is logged in automatically after signup

### 2.3 Email Sign-In
- [ ] Email/password fields accept input
- [ ] "Forgot Password" link navigates correctly
- [ ] Invalid credentials show appropriate error
- [ ] Valid credentials log user in successfully
- [ ] User redirects to home page after login
- [ ] Session persists after app close/reopen

### 2.4 Social Authentication
- [ ] "Sign in with Google" button appears
- [ ] Google OAuth flow opens in browser/WebView
- [ ] Successful Google auth returns to app
- [ ] User profile data populated from Google
- [ ] "Sign in with Apple" button appears (iOS only)
- [ ] Apple OAuth flow completes successfully
- [ ] Apple Sign In creates account with limited data

### 2.5 User Type Selection
- [ ] User can select "Shopper" during onboarding
- [ ] User can select "Vendor" during onboarding
- [ ] User can select "Both" during onboarding
- [ ] Selection persists in user profile
- [ ] User can change type later in profile settings

---

## 3. Home Page

### 3.1 Hero Section
- [ ] Welcome message displays correctly
- [ ] "Shop Small, Shop Local" tagline is visible
- [ ] Hero image/banner loads properly
- [ ] CTA buttons are properly styled and functional

### 3.2 Featured Content
- [ ] Featured vendors section loads
- [ ] Vendor cards show logo, name, and tagline
- [ ] Tapping vendor card navigates to vendor profile
- [ ] Featured collections display correctly
- [ ] Live fair highlights show active events
- [ ] "LIVE NOW" badges appear for active vendors

### 3.3 Category Navigation
- [ ] "Marketplace" button navigates to product listings
- [ ] "Live Fairs" button navigates to events page
- [ ] "Services" button navigates to service vendors
- [ ] "Community Hub" button navigates to community page
- [ ] Icons display correctly for each category
- [ ] Button press animations work smoothly

### 3.4 Info Modal
- [ ] "What is Overboard Market?" button opens modal
- [ ] Modal displays mission statement
- [ ] Modal has close button that works
- [ ] Modal can be dismissed by tapping outside
- [ ] Content is readable and properly formatted

### 3.5 Search & Navigation
- [ ] Search bar appears in header
- [ ] Search accepts text input
- [ ] Search results display relevant products/vendors
- [ ] Hamburger menu opens navigation drawer
- [ ] Navigation drawer shows all app sections
- [ ] Drawer closes when selecting an item

---

## 4. Marketplace

### 4.1 Product Listings
- [ ] Products load in grid layout
- [ ] Product images display correctly
- [ ] Product names, prices, and vendor names visible
- [ ] Tapping product opens detail page
- [ ] Infinite scroll/pagination works correctly
- [ ] Loading spinner shows while fetching more products
- [ ] No duplicate products appear

### 4.2 Filtering
- [ ] "Filter" button opens filter modal
- [ ] Category filter shows all available categories
- [ ] Selecting category updates product list
- [ ] Price range slider functions correctly
- [ ] Rating filter (1-5 stars) works
- [ ] Vendor type filter (Product/Service) works
- [ ] Multiple filters can be applied simultaneously
- [ ] "Clear All Filters" button resets to default
- [ ] Filter count badge updates correctly

### 4.3 Sorting
- [ ] Sort dropdown shows options (Newest, Price, Popularity)
- [ ] "Newest First" sorts by creation date
- [ ] "Price: Low to High" sorts ascending
- [ ] "Price: High to Low" sorts descending
- [ ] "Most Popular" sorts by views/sales
- [ ] Sort persists when navigating back to marketplace

### 4.4 Product Actions
- [ ] "Add to Cart" button adds item successfully
- [ ] Cart icon badge updates with item count
- [ ] "Favorite" heart icon toggles on/off
- [ ] Favorited items save to user profile
- [ ] "Share" button opens native share sheet
- [ ] Product availability status displays (In Stock/Out of Stock)

### 4.5 Product Detail Page
- [ ] Full product images load in carousel/gallery
- [ ] Image zoom/pinch-to-zoom works
- [ ] Product description displays completely
- [ ] Price and stock information visible
- [ ] Vendor info card shows correctly
- [ ] "Visit Vendor" button navigates to vendor profile
- [ ] Quantity selector increments/decrements
- [ ] Product options/variants display (if applicable)
- [ ] Related products section loads

---

## 5. Vendor Profiles

### 5.1 Vendor Info Display
- [ ] Vendor name appears in header
- [ ] Vendor logo displays correctly
- [ ] Business bio/description is readable
- [ ] Location shows correctly (if public)
- [ ] "Location Hidden" message if location private
- [ ] Star rating and review count visible
- [ ] Social media links open correctly

### 5.2 Product Grid
- [ ] Vendor's products load in grid
- [ ] Product count displays accurately
- [ ] Products filter by category within vendor
- [ ] Tapping product opens detail page
- [ ] "No products available" message if empty
- [ ] Service listings appear for service vendors

### 5.3 Vendor Actions
- [ ] "Message Vendor" button opens chat
- [ ] "Follow" button toggles follow status
- [ ] Follower count updates correctly
- [ ] "Share Profile" button works
- [ ] "Report Vendor" option available in menu

### 5.4 Live Status
- [ ] "LIVE NOW" badge appears when vendor broadcasting
- [ ] Live video player embeds correctly
- [ ] Video controls (play/pause/volume) function
- [ ] Video quality adjusts to connection speed
- [ ] Live viewer count displays

---

## 6. Vendor Onboarding

### 6.1 Step 1: Account Creation
- [ ] Vendor signup form appears
- [ ] Email and password fields validate
- [ ] "Continue" button navigates to Step 2
- [ ] Progress indicator shows "Step 1 of 5"

### 6.2 Step 2: Business Details
- [ ] Business name field accepts input
- [ ] Business type dropdown shows options
- [ ] Address fields (street, city, state, zip) validate
- [ ] Phone number field formats correctly
- [ ] Tax ID field (optional) accepts input
- [ ] "Location Public" toggle works
- [ ] "Continue" button enabled when required fields filled

### 6.3 Step 3: Product/Service Setup
- [ ] "Product Vendor" / "Service Vendor" selection works
- [ ] Product vendor sees product form
- [ ] Service vendor sees service form
- [ ] Product name, description, price fields validate
- [ ] Image upload button opens picker
- [ ] Multiple images can be uploaded
- [ ] Category dropdown populated with options
- [ ] "Add Another Product" creates new form
- [ ] "Skip for now" option available

### 6.4 Step 4: Payment Setup
- [ ] Stripe Connect button appears
- [ ] Stripe onboarding opens in WebView
- [ ] Successful Stripe setup returns to app
- [ ] Bank account info displays once connected
- [ ] "Skip for now" option available (with warning)

### 6.5 Step 5: Confirmation
- [ ] Summary of vendor info displays
- [ ] Terms and Conditions link opens
- [ ] "I agree to terms" checkbox required
- [ ] "Complete Setup" button submits form
- [ ] Success message displays
- [ ] User redirects to vendor dashboard

### 6.6 Data Persistence
- [ ] Closing app mid-onboarding saves progress
- [ ] Reopening app returns to last completed step
- [ ] Form data persists between steps
- [ ] Images remain uploaded after navigation

---

## 7. Live Vendor Fair (Walk the Fair)

### 7.1 Fair Landing Page
- [ ] Active fairs display in list
- [ ] Fair banner images load correctly
- [ ] Fair dates and times display
- [ ] Vendor count shows accurately
- [ ] "Walk the Fair" button navigates to booth view
- [ ] "View Map" button opens booth map
- [ ] Past fairs show "Event Ended" status

### 7.2 Booth-by-Booth Experience
- [ ] First booth loads automatically
- [ ] Vendor wooden sign displays at top
- [ ] Vendor name and location visible
- [ ] Booth has cozy craft fair aesthetic
- [ ] String lights / banners animate subtly

### 7.3 Vendor Intro Step
- [ ] Vendor logo appears clearly
- [ ] "LIVE NOW" badge pulses if vendor broadcasting
- [ ] Live video embeds inside booth (if live)
- [ ] Video audio fades in when entering booth
- [ ] Intro screen stays visible for ~2 seconds
- [ ] Transition to products is smooth

### 7.4 Product Showcase Step
- [ ] 1-2 featured products display at a time
- [ ] Product images load clearly
- [ ] Product names and prices visible
- [ ] "View Item" button appears below each product
- [ ] Products rotate every 3 seconds
- [ ] Maximum 4 products shown per vendor
- [ ] Slide/fade animations between products
- [ ] Wooden table aesthetic maintained

### 7.5 Auto-Advance Transition
- [ ] After products shown, booth auto-scrolls to next
- [ ] Transition animation is smooth (no jank)
- [ ] Audio fades out when leaving booth
- [ ] Next booth loads without delay
- [ ] Status line shows "Booth X of Y"

### 7.6 Navigation Controls
- [ ] "Auto Walk" mode button toggles on/off
- [ ] Auto Walk scrolls through booths automatically
- [ ] "Manual Step" mode shows "Next Booth" button
- [ ] "Previous Booth" button navigates back
- [ ] Pause button stops auto-advance
- [ ] Resume button continues from current booth
- [ ] Map icon in corner opens booth map
- [ ] Selecting booth on map jumps to that vendor

### 7.7 Ambient Features
- [ ] Background music plays softly (if enabled)
- [ ] Crowd noise ambient sound (optional)
- [ ] Music volume adjusts with system volume
- [ ] Sound settings toggle in menu

### 7.8 Multi-Platform Performance
- [ ] Booth transitions smooth on iOS
- [ ] Booth transitions smooth on Android
- [ ] Video playback works on web (React Native Web)
- [ ] No memory leaks during extended walking
- [ ] Fair works on tablet landscape orientation

---

## 8. Cart & Checkout

### 8.1 Cart Management
- [ ] Cart icon shows item count badge
- [ ] Tapping cart icon opens cart page
- [ ] All added items display correctly
- [ ] Item images, names, prices visible
- [ ] Quantity selector increments/decrements
- [ ] Item subtotal updates with quantity
- [ ] "Remove" button deletes item from cart
- [ ] Empty cart shows "Your cart is empty" message

### 8.2 Cart Calculations
- [ ] Subtotal calculates correctly
- [ ] Tax calculates based on location
- [ ] Shipping fee displays accurately
- [ ] Total = Subtotal + Tax + Shipping
- [ ] Discount codes can be applied
- [ ] Valid coupon code reduces total
- [ ] Invalid coupon shows error message

### 8.3 Checkout Flow
- [ ] "Checkout" button enabled when cart has items
- [ ] Guest users prompted to sign in or continue as guest
- [ ] Shipping address form validates fields
- [ ] Address autocomplete works (if integrated)
- [ ] Saved addresses populate for logged-in users
- [ ] Payment method selection displays
- [ ] Credit card form validates card number
- [ ] CVV and expiration date required

### 8.4 Order Confirmation
- [ ] "Place Order" button submits payment
- [ ] Loading spinner shows during processing
- [ ] Success screen displays order number
- [ ] Order confirmation email sent
- [ ] Order appears in user's order history
- [ ] Cart clears after successful purchase

### 8.5 Edge Cases
- [ ] Out-of-stock items show warning in cart
- [ ] Checkout blocked if items unavailable
- [ ] Payment failure shows clear error message
- [ ] Network timeout handled gracefully

---

## 9. Services Marketplace

### 9.1 Service Listings
- [ ] "Services" tab shows only service vendors
- [ ] Service cards display provider name and category
- [ ] Service description visible on card
- [ ] Price range displays (e.g., "$50-$100")
- [ ] Location/travel radius shown (if applicable)
- [ ] Rating and review count visible

### 9.2 Filtering Services
- [ ] Category filter shows service categories only
- [ ] "Product" and "Service" tabs don't overlap
- [ ] Location filter shows services near user
- [ ] Price range filter works for services
- [ ] Availability filter (e.g., "Available This Week")

### 9.3 Service Detail Page
- [ ] Full service description loads
- [ ] Provider bio and credentials display
- [ ] Portfolio/work samples gallery works
- [ ] "Book Now" or "Request Quote" button present
- [ ] Contact form or inquiry modal opens
- [ ] Booking calendar integration (if applicable)

### 9.4 Service Booking
- [ ] Booking form validates fields
- [ ] Date/time picker opens correctly
- [ ] Service duration selector works
- [ ] Booking confirmation sent to provider
- [ ] User receives booking confirmation
- [ ] Booking appears in user's orders/appointments

---

## 10. Community Hub & FAQ

### 10.1 Community Hub
- [ ] Community Hub navigation link works
- [ ] Bulletin board displays community posts
- [ ] Vendor spotlights section loads
- [ ] Fair schedule displays upcoming events
- [ ] Shoutouts wall shows recent shoutouts
- [ ] "Post Shoutout" button opens modal
- [ ] Shoutout form validates text input
- [ ] Submitted shoutout appears on wall

### 10.2 FAQ Page
- [ ] FAQ link in navigation opens FAQ page
- [ ] "Shopper FAQ" section displays
- [ ] "Vendor FAQ" section displays
- [ ] Questions are categorized logically
- [ ] Tapping question expands answer
- [ ] Tapping again collapses answer
- [ ] Only one answer expanded at a time (accordion)
- [ ] All answers properly formatted

### 10.3 Contact & Support
- [ ] "Contact Us" section displays email
- [ ] Email link (info@overboardnorth.com) opens mail app
- [ ] "Submit Feedback" button opens feedback modal
- [ ] Feedback form validates fields
- [ ] Feedback submission success message
- [ ] "Support" page accessible from menu

---

## 11. Notifications & Favorites

### 11.1 Push Notifications
- [ ] Permission prompt appears on first launch
- [ ] Granting permission registers device
- [ ] Test notification received when vendor goes live
- [ ] Sale alert notification received
- [ ] Order update notification received
- [ ] Tapping notification opens relevant screen
- [ ] Notification settings page allows toggle

### 11.2 In-App Notifications
- [ ] Notification bell icon shows unread count
- [ ] Notification list displays recent alerts
- [ ] Notifications marked as read when opened
- [ ] "Clear All" button clears notification list

### 11.3 Favorites
- [ ] Favorited products save to profile
- [ ] "My Favorites" page displays saved items
- [ ] Favorited vendors save to profile
- [ ] Unfavoriting removes from list
- [ ] Favorites persist across sessions
- [ ] Favorites sync across devices

---

## 12. Performance & Accessibility

### 12.1 Performance Metrics
- [ ] Home page loads in < 3 seconds
- [ ] Product listing page loads in < 3 seconds
- [ ] Vendor profile loads in < 2 seconds
- [ ] Scroll performance is smooth (60fps)
- [ ] Image loading doesn't block UI
- [ ] No memory leaks during 10-minute session

### 12.2 Accessibility
- [ ] All buttons have accessible labels
- [ ] Screen reader announces UI elements correctly
- [ ] Tab navigation works on web
- [ ] Focus indicators visible when tabbing
- [ ] Color contrast meets WCAG AA standards
- [ ] Font sizes are readable (minimum 14px body text)
- [ ] Touch targets minimum 44x44 points

### 12.3 Error Handling
- [ ] Network errors show user-friendly messages
- [ ] Retry buttons work after network failure
- [ ] App doesn't crash on invalid data
- [ ] Form validation errors are clear
- [ ] Loading states prevent duplicate submissions

---

## 13. Data Validation

### 13.1 Database Integrity
- [ ] Vendor data pulls correctly from Supabase
- [ ] Product data displays accurate info
- [ ] User authentication state syncs with database
- [ ] Orders save correctly to database
- [ ] No orphaned records (e.g., products without vendors)

### 13.2 Image Loading
- [ ] Product images load from correct URLs
- [ ] Vendor logos display without broken links
- [ ] Fallback image shows for missing images
- [ ] Image caching works (images don't reload on revisit)

### 13.3 Caching & Offline Mode
- [ ] Previously loaded data accessible offline
- [ ] "Offline mode" indicator displays when disconnected
- [ ] Actions queue for sync when online
- [ ] App doesn't crash when offline
- [ ] User can browse cached content

---

## 14. Cross-Platform Sync

### 14.1 Account Sync
- [ ] Login on Device A, data visible on Device B
- [ ] Cart syncs across devices
- [ ] Favorites sync across devices
- [ ] Order history syncs across devices
- [ ] Logout on one device doesn't affect others

### 14.2 Real-Time Updates
- [ ] Live vendor status updates across devices
- [ ] New messages appear in real-time
- [ ] Cart updates reflect immediately
- [ ] Notifications sync across devices

---

## 15. Final Pass

### 15.1 Branding & Messaging
- [ ] "Shop Small, Shop Local" tagline visible on key screens
- [ ] Overboard Market logo consistent across app
- [ ] Brand colors match style guide
- [ ] Fonts consistent throughout app

### 15.2 External Links
- [ ] Vendor social media links open correctly
- [ ] External vendor websites open in browser
- [ ] Email links open default mail client
- [ ] Phone number links open dialer (mobile only)

### 15.3 Console & Network
- [ ] No JavaScript errors in browser console
- [ ] No failed API requests (check network tab)
- [ ] No 404 errors for images/assets
- [ ] No memory warnings in dev tools

### 15.4 Legal & Compliance
- [ ] Terms of Service link works
- [ ] Privacy Policy link works
- [ ] Refund Policy accessible
- [ ] Prohibited Items list accessible
- [ ] Vendor Agreement accessible

---

## Test Completion Checklist

- [ ] All critical paths tested (P0)
- [ ] All major features tested (P1)
- [ ] All edge cases documented (P2)
- [ ] Cross-platform testing completed
- [ ] Accessibility audit passed
- [ ] Performance benchmarks met
- [ ] Security checks passed
- [ ] Final sign-off from product owner

---

## Bug Report Template

**Bug ID:** [AUTO-GENERATED]  
**Priority:** P0 (Critical) | P1 (High) | P2 (Medium) | P3 (Low)  
**Status:** Open | In Progress | Resolved | Closed  

**Title:** [Short description]

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Result:**  


**Actual Result:**  


**Device/Platform:**  


**Screenshots/Video:**  


**Additional Notes:**  


---

## Sign-Off

**Tested By:** ___________________  
**Date:** ___________________  
**Build Version:** ___________________  
**Status:** ✅ Ready for Production | ⚠️ Issues Found | ❌ Critical Failures  

**Notes:**


