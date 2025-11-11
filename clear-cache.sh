#!/bin/bash

echo "🧹 Clearing Metro bundler cache..."

# Clear Metro bundler cache
rm -rf .expo
rm -rf node_modules/.cache
rm -rf $TMPDIR/metro-* 2>/dev/null
rm -rf $TMPDIR/haste-* 2>/dev/null

echo "✅ Cache cleared!"
echo "📦 Restarting bundler..."

# Restart expo
bun expo start --clear
