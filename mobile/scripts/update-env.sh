#!/bin/bash

# Script to update environment variables and rebuild iOS app
echo "🔄 Updating environment variables..."

# Clean iOS build
echo "🧹 Cleaning iOS build..."
cd ios
xcodebuild clean -workspace app.xcworkspace -scheme app > /dev/null 2>&1

# Go back to mobile directory
cd ..

# Rebuild iOS app
echo "🏗️  Rebuilding iOS app..."
npx react-native run-ios --verbose

echo "✅ Environment variables updated and app rebuilt!"
