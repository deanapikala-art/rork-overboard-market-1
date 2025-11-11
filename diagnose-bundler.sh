#!/bin/bash

echo "🔍 Diagnosing bundler issues..."
echo ""

echo "=== Environment Check ==="
echo "Node version: $(node --version 2>/dev/null || echo 'Not found')"
echo "Bun version: $(bun --version 2>/dev/null || echo 'Not found')"
echo "Expo CLI: $(bunx expo --version 2>/dev/null || echo 'Not found')"
echo ""

echo "=== Configuration Files ==="
echo "✓ Checking babel.config.js..."
if [ -f "babel.config.js" ]; then
  echo "  Found babel.config.js"
else
  echo "  ❌ Missing babel.config.js"
fi

echo "✓ Checking tsconfig.json..."
if [ -f "tsconfig.json" ]; then
  echo "  Found tsconfig.json"
else
  echo "  ❌ Missing tsconfig.json"
fi

echo "✓ Checking package.json..."
if [ -f "package.json" ]; then
  echo "  Found package.json"
else
  echo "  ❌ Missing package.json"
fi

echo "✓ Checking .env file..."
if [ -f ".env" ]; then
  echo "  Found .env"
else
  echo "  ⚠️  Missing .env file"
fi
echo ""

echo "=== Cache Status ==="
if [ -d ".expo" ]; then
  echo "  ⚠️  .expo cache exists (size: $(du -sh .expo 2>/dev/null | cut -f1))"
else
  echo "  ✓ No .expo cache"
fi

if [ -d "node_modules/.cache" ]; then
  echo "  ⚠️  node_modules/.cache exists (size: $(du -sh node_modules/.cache 2>/dev/null | cut -f1))"
else
  echo "  ✓ No node_modules cache"
fi
echo ""

echo "=== Dependencies Status ==="
if [ -d "node_modules" ]; then
  echo "  ✓ node_modules exists"
  echo "  Expo Router: $(grep -A1 '"expo-router"' package.json | tail -n1 | tr -d ' ,')"
  echo "  React Native: $(grep -A1 '"react-native"' package.json | tail -n1 | tr -d ' ,')"
else
  echo "  ❌ node_modules missing - run 'bun install'"
fi
echo ""

echo "=== Common Issues Check ==="
# Check for duplicate constants
if [ -d "constants" ] && [ -d "app/constants" ]; then
  echo "  ⚠️  Found both /constants and /app/constants directories"
fi

# Check for common problematic patterns
echo "  Checking for circular dependencies..."
if command -v madge &> /dev/null; then
  madge --circular --extensions ts,tsx app/ 2>/dev/null | head -n 5
else
  echo "    (Install 'madge' globally for circular dependency check)"
fi
echo ""

echo "=== Recommendations ==="
echo "1. Run: ./fix-bundler.sh to clear all caches"
echo "2. Restart your terminal/IDE"
echo "3. Run: bun start"
echo ""
