#!/bin/bash

echo "🧹 Clearing Metro bundler cache..."

# Stop any running Metro processes
pkill -f "react-native" || true
pkill -f "metro" || true

# Clear Expo cache
echo "Clearing Expo cache..."
rm -rf .expo

# Clear Metro cache
echo "Clearing Metro cache..."
rm -rf node_modules/.cache

# Clear React Native cache
echo "Clearing React Native cache..."
rm -rf $TMPDIR/react-*
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-*

# Clear watchman
echo "Clearing Watchman..."
watchman watch-del-all 2>/dev/null || true

# Clear Babel cache
echo "Clearing Babel cache..."
rm -rf node_modules/.cache/babel-loader

echo "✅ Cache cleared successfully!"
echo ""
echo "Now run: bun start"
