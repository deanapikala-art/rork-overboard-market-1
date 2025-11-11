# 🔍 How to Use the Diagnostic Tool

## 🎯 Quick Start (30 seconds)

1. **Open your app**
2. **Navigate to `/diagnostic`**
3. **Tap "Run Diagnostic Check"**
4. **Review results**

That's it! The tool will tell you exactly what's wrong and how to fix it.

---

## 📱 Accessing the Diagnostic Screen

### Method 1: Direct URL
In your browser or app: `http://localhost:8081/diagnostic`

### Method 2: Add a Debug Button
Add this to any screen temporarily:

```typescript
import { router } from 'expo-router';
import { TouchableOpacity, Text } from 'react-native';

<TouchableOpacity 
  onPress={() => router.push('/diagnostic')}
  style={{ padding: 20, backgroundColor: '#3b82f6' }}
>
  <Text style={{ color: '#fff' }}>🔍 Run Diagnostic</Text>
</TouchableOpacity>
```

---

## 📊 Understanding the Results

### The Summary Card
Shows three numbers:
- **Passed** (Green) - Everything working ✅
- **Warnings** (Yellow) - Not critical ⚠️
- **Errors** (Red) - Needs fixing ❌

### The Detailed Results
Each check shows:
- **Icon** - Visual status (✅ ⚠️ ❌)
- **Section** - What was checked
- **Message** - What the result means
- **Details** - Technical information (if error)

---

## 🎨 Color Meanings

### ✅ Green (Success)
Everything is working perfectly. No action needed.

**Example:**
```
✅ 2. Table Check: customers
   Table 'customers' exists and is accessible
```

### ⚠️ Yellow (Warning)
Not critical, but good to know. May require manual testing.

**Example:**
```
⚠️ 3. Auth Session
   No active auth session
```
This is normal if you're not logged in!

### ❌ Red (Error)
Something is broken and needs fixing.

**Example:**
```
❌ 8. Customer Carts Table
   customer_carts table DOES NOT EXIST - NEEDS CREATION
```
This needs the SQL fix.

---

## 🔧 Common Scenarios

### Scenario 1: Fresh Install
**Expected Results:**
- ❌ customer_carts missing
- ❌ customer_favorites missing
- ❌ admin_users has policy issues

**Action:** Run `FINAL_COMPREHENSIVE_FIX.sql`

---

### Scenario 2: After Running SQL Fix
**Expected Results:**
- ✅ All tables exist
- ✅ No policy errors
- ⚠️ No active session (if not logged in)

**Action:** Test signup and functionality

---

### Scenario 3: After Customer Signup
**Expected Results:**
- ✅ All database checks pass
- ✅ Active session found
- ✅ Customer profile loaded

**Action:** Test cart and favorites

---

### Scenario 4: Something Still Broken
**Expected Results:**
- Mix of ✅ and ❌
- Specific error details shown

**Action:** Read the error details, follow recommendations

---

## 🛠️ What to Do When You See Errors

### Error: "Table does not exist" (PGRST205)

**What it means:**
The table wasn't created in your Supabase database.

**Fix:**
1. Open Supabase Dashboard
2. Go to SQL Editor  
3. Copy `app/utils/FINAL_COMPREHENSIVE_FIX.sql`
4. Paste and run
5. Refresh schema cache

**Time:** 5 minutes

---

### Error: "Infinite recursion" (42P17)

**What it means:**
Admin_users policy is checking itself in a loop.

**Fix:**
Same as above - run the SQL fix file.

**Time:** 5 minutes

---

### Error: "Cannot access table"

**What it means:**
Permissions or RLS policies are blocking access.

**Fix:**
Run the SQL fix file to reset all policies.

**Time:** 5 minutes

---

### Warning: "No active auth session"

**What it means:**
You're not logged in. This is expected!

**Fix:**
None needed. This is normal.

---

### Warning: "Manual testing required"

**What it means:**
Some things can't be auto-tested (like signup flow).

**Fix:**
Manually test:
- Customer signup
- Vendor signup
- Admin login

---

## 📋 Step-by-Step Fix Process

### 1️⃣ Run Diagnostic
```
1. Navigate to /diagnostic
2. Tap "Run Diagnostic Check"
3. Wait 5-10 seconds
4. Review results
```

### 2️⃣ Note Errors
```
Look for red ❌ items
Common errors:
- Missing customer_carts table
- Missing customer_favorites table  
- Admin policy recursion
```

### 3️⃣ Apply Fix
```
1. Open Supabase Dashboard
2. SQL Editor
3. Copy app/utils/FINAL_COMPREHENSIVE_FIX.sql
4. Paste all 576 lines
5. Click RUN
6. Wait for success
```

### 4️⃣ Refresh Cache
```
1. Supabase → Settings → API
2. Click "Refresh Schema Cache"
3. Wait 30 seconds
```

### 5️⃣ Verify Fix
```
1. Return to /diagnostic
2. Run check again
3. Should show ✅ for all tables
4. May still show ⚠️ for session (OK!)
```

### 6️⃣ Test Functionality
```
1. Try customer signup
2. Add item to cart
3. Add favorite vendor
4. Check console for success messages
```

---

## 🎯 What "Success" Looks Like

After fixing everything, you should see:

```
📊 Summary: 11 passed, 1 warnings, 0 errors

✅ 1. Supabase Connection - Connected
✅ 2. Table Check: customers - exists
✅ 2. Table Check: admin_users - exists
✅ 2. Table Check: vendors - exists
✅ 2. Table Check: products - exists
✅ 2. Table Check: customer_carts - exists ← Fixed!
✅ 2. Table Check: customer_favorites - exists ← Fixed!
⚠️ 3. Auth Session - No active session (expected)
✅ 4. Customer Profile Access - accessible
✅ 5. Admin Users Access - accessible ← No more recursion!
✅ 6. Vendors Table Access - accessible
✅ 7. Products Table Access - accessible
✅ 8. Customer Carts Table - accessible ← Fixed!
✅ 9. Customer Favorites Table - accessible ← Fixed!
⚠️ 10. Customer Sign Up Test - Manual test required
⚠️ 11. Vendor Sign Up Test - Manual test required
⚠️ 12. Admin Login Test - Manual test required
```

---

## 💡 Tips for Using the Tool

### During Development
- Keep the diagnostic screen bookmarked
- Run it after making database changes
- Run it before and after applying fixes
- Check it when something doesn't work

### When Reporting Issues
- Run diagnostic first
- Take screenshot of results
- Include the error details
- Mention which checks failed

### When Testing
- Run diagnostic after each fix
- Verify green ✅ before moving on
- Test manually after diagnostic passes
- Re-run if something breaks

---

## 🚀 Pro Tips

### 1. Console Output
The diagnostic also prints to console with more details. Check it for:
- Full error messages
- Stack traces
- Detailed JSON output

### 2. Re-run Anytime
The check is non-destructive. Run it as many times as you want.

### 3. Before Asking for Help
Always run the diagnostic first. It might answer your question!

### 4. After Every Database Change
SQL query? Policy update? Run the diagnostic.

### 5. Keep It Accessible
Add a hidden button in your app settings for quick access.

---

## 📞 When to Use Each Document

- **This file (HOW_TO_USE_DIAGNOSTIC.md)** - Learn how to use the tool
- **SYSTEM_STATUS_SUMMARY.md** - Quick overview of system state
- **COMPREHENSIVE_SYSTEM_CHECK.md** - Complete troubleshooting guide
- **QUICK_FIX_GUIDE.md** - Fast fixes for common issues

---

## ✅ Success Checklist

Before considering your system "fixed":

- [ ] Ran diagnostic tool
- [ ] Saw 0 errors (❌)
- [ ] All 6 tables showing ✅
- [ ] No infinite recursion error
- [ ] Customer signup works
- [ ] Cart saves to database
- [ ] Favorites save to database
- [ ] Console shows success messages
- [ ] App functions normally

---

**Remember: When in doubt, run the diagnostic! 🔍**
