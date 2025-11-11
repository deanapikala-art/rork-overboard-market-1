#!/bin/bash

echo "🔧 Fixing bundler issues..."
echo ""

echo "Step 1: Clearing all caches..."
rm -rf .expo
rm -rf node_modules/.cache
rm -rf $TMPDIR/metro-* 2>/dev/null
rm -rf $TMPDIR/haste-* 2>/dev/null
rm -rf $TMPDIR/react-* 2>/dev/null

echo "Step 2: Clearing watchman..."
watchman watch-del-all 2>/dev/null || echo "Watchman not installed, skipping..."

echo "Step 3: Reinstalling node_modules..."
rm -rf node_modules
bun install

echo ""
echo "✅ All caches cleared and dependencies reinstalled!"
echo ""
echo "Now run: bun start"
