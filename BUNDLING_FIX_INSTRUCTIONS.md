# 🔧 Bundling Error Fix Instructions

## ✅ Import Paths Status
All import paths in the codebase have been verified and are **CORRECT**:
- ✅ All app imports use `@/app/...` format
- ✅ All lib imports use `@/lib/...` format  
- ✅ All mocks imports use `@/mocks/...` format
- ✅ Babel alias configured correctly: `@: './'`
- ✅ TypeScript paths configured correctly

## 🎯 Root Cause
The bundling errors are caused by **Metro bundler cache issues**, not incorrect imports.

## 🛠️ Solution Steps

### Step 1: Clear All Caches
Run the cache clearing script:
```bash
bash clear-metro-cache.sh-
```

Or manually run these commands:
```bash
# Stop Metro processes
pkill -f "metro" || true

# Clear all caches
rm -rf .expo
rm -rf node_modules/.cache
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-*
watchman watch-del-all 2>/dev/null || true
```

### Step 2: Start Fresh
Start the development server with clear cache flag:
```bash
bun expo start --clear
```

Or use the start script:
```bash
bun start
```

### Step 3: If Issues Persist
If you still see bundling errors:

1. **Reset the bundler completely:**
   ```bash
   # Kill all Node/Metro processes
   killall node
   
   # Remove node_modules and reinstall
   rm -rf node_modules
   bun install
   
   # Clear cache and restart
   bash clear-metro-cache.sh
   bun expo start --clear
   ```

2. **Check for phantom processes:**
   ```bash
   # Find and kill any lingering Metro processes
   ps aux | grep metro
   ps aux | grep node
   ```

3. **Restart your terminal/IDE:**
   Sometimes the bundler cache is tied to your IDE or terminal session.

## 🔍 Verification
After clearing cache and restarting:
- The bundler should start without errors
- All imports should resolve correctly
- No "Unable to resolve" errors should appear

## 📝 Import Rules Reference
For future development, follow these rules:

### ✅ Correct Import Patterns
```typescript
// From app folder to other app folders
import Colors from '@/app/constants/colors';
import { useCart } from '@/app/contexts/CartContext';
import Button from '@/app/components/Button';
import { getDistance } from '@/app/utils/zipDistance';

// From anywhere to lib folder
import { supabase } from '@/lib/supabase';
import { trpc } from '@/lib/trpc';

// From anywhere to mocks folder
import { products } from '@/mocks/products';
import { vendors } from '@/mocks/vendors';

// From anywhere to backend folder
import { appRouter } from '@/backend/trpc/app-router';
```

### ❌ Incorrect Import Patterns
```typescript
// Missing 'app/' prefix
import Colors from '@/app/constants/colors'; // ❌
import { useCart } from '@app/contexts/CartContext'; // ❌

// Relative imports (should use alias)
import Colors from '../../constants/colors'; // ❌
import { useCart } from '../contexts/CartContext'; // ❌
```

## 🎉 Expected Result
After following these steps, your app should:
- Build successfully
- Bundle without errors
- Resolve all imports correctly
- Run on both mobile and web

## 💡 Tips
- Always use `--clear` flag when starting after code changes
- If developing, periodically clear cache to avoid stale module resolution
- Metro bundler caches module resolution aggressively
