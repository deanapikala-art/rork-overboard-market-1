# ⚡ Quick Fix for "Database error saving new user"

## 🎯 The Problem
Customer signup fails with "Database error saving new user"

## 🔧 The Fix (5 minutes)

### 1️⃣ Clean up failed users
Supabase Dashboard → **Authentication** → **Users** → Delete all test users

### 2️⃣ Disable email confirmation  
Supabase Dashboard → **Authentication** → **Settings** → **Uncheck** "Enable email confirmations" → **Save**

### 3️⃣ Run the SQL fix
1. Open: **Supabase Dashboard** → **SQL Editor**
2. Open file: `app/utils/ULTIMATE_DATABASE_FIX.sql`
3. Copy **ALL** contents
4. Paste in SQL Editor
5. Click **RUN**
6. Wait for completion (~10 seconds)

### 4️⃣ Restart dev server
```bash
bun expo start --clear
```

### 5️⃣ Test signup
- Open app
- Tap "Customer"
- Enter NEW email (one you haven't tried before)
- Create account
- Should work! ✅

---

## ❌ If Still Not Working

### Check Supabase Logs
Dashboard → **Database** → **Logs** → Look for errors during signup

### Verify triggers exist
```sql
SELECT tgname FROM pg_trigger 
WHERE tgrelid = 'auth.users'::regclass 
AND tgname LIKE '%customer%';
```
Should return: `on_auth_user_created_customer`

### Nuclear option
```sql
-- Delete everything and start fresh
DELETE FROM customer_favorites;
DELETE FROM customer_carts;  
DELETE FROM customers;
-- Then delete users in Auth UI
-- Then re-run ULTIMATE_DATABASE_FIX.sql
```

---

## 📚 Detailed Help
See: `DATABASE_FIX_FINAL_INSTRUCTIONS.md` for complete troubleshooting

## ✅ Expected Result
- Customer signup completes without errors
- User appears in auth.users table
- Profile appears in customers table
- App redirects to market selection
- Console shows: `[CustomerAuth] User signed up successfully`

---

**Need help?** Check the detailed instructions in `DATABASE_FIX_FINAL_INSTRUCTIONS.md`
