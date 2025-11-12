#!/bin/bash

echo "🔧 Fixing bundler issues..."

# Clear all caches
echo "📦 Clearing Metro bundler cache..."
rm -rf .expo
rm -rf node_modules/.cache

# Clear watchman cache if available
if command -v watchman &> /dev/null; then
    echo "👁️ Clearing watchman cache..."
    watchman watch-del-all
fi

# Clear temp files
echo "🗑️ Clearing temp files..."
rm -rf /tmp/metro-* /tmp/haste-*

echo "✅ Cache cleared!"
echo ""
echo "🚀 Now run: bun expo start --clear"
