#!/bin/bash

# Comprehensive cleanup script for React Native project
# Cleans build artifacts, caches, and temporary files

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default options
DEEP_CLEAN=false
IOS_ONLY=false
ANDROID_ONLY=false
HELP=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --deep)
            DEEP_CLEAN=true
            shift
            ;;
        --ios-only)
            IOS_ONLY=true
            shift
            ;;
        --android-only)
            ANDROID_ONLY=true
            shift
            ;;
        --help|-h)
            HELP=true
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Show help
if [ "$HELP" = true ]; then
    echo -e "${BLUE}React Native Cleanup Script${NC}"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --deep          Also clean node_modules and reinstall dependencies"
    echo "  --ios-only      Clean only iOS build artifacts"
    echo "  --android-only  Clean only Android build artifacts"
    echo "  --help, -h      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                    # Basic cleanup"
    echo "  $0 --deep            # Deep cleanup with node_modules"
    echo "  $0 --ios-only        # Clean only iOS artifacts"
    echo "  $0 --android-only    # Clean only Android artifacts"
    exit 0
fi

# Safety check - ensure we're in a React Native project
if [ ! -f "package.json" ] || [ ! -d "android" ] || [ ! -d "ios" ]; then
    echo -e "${RED}Error: This doesn't appear to be a React Native project directory${NC}"
    echo "Please run this script from the root of your React Native project"
    exit 1
fi

echo -e "${BLUE}🧹 Starting React Native cleanup...${NC}"
echo ""

# Function to remove directory if it exists
remove_dir() {
    if [ -d "$1" ]; then
        echo -e "${YELLOW}  Removing: $1${NC}"
        rm -rf "$1"
    fi
}

# Function to remove file if it exists
remove_file() {
    if [ -f "$1" ]; then
        echo -e "${YELLOW}  Removing: $1${NC}"
        rm -f "$1"
    fi
}

# Function to remove files by pattern
remove_files() {
    local pattern="$1"
    local files=$(find . -name "$pattern" -not -path "./node_modules/*" 2>/dev/null || true)
    if [ -n "$files" ]; then
        echo -e "${YELLOW}  Removing files matching: $pattern${NC}"
        echo "$files" | xargs rm -f 2>/dev/null || true
    fi
}

# Android cleanup
if [ "$IOS_ONLY" = false ]; then
    echo -e "${GREEN}📱 Cleaning Android artifacts...${NC}"
    
    remove_dir "android/app/build"
    remove_dir "android/build"
    remove_dir "android/.gradle"
    remove_dir "android/app/.cxx"
    remove_file "android/link-assets-manifest.json"
    remove_files ".DS_Store"
    
    echo -e "${GREEN}✅ Android cleanup complete${NC}"
    echo ""
fi

# iOS cleanup
if [ "$ANDROID_ONLY" = false ]; then
    echo -e "${GREEN}🍎 Cleaning iOS artifacts...${NC}"
    
    remove_dir "ios/build"
    remove_dir "ios/Pods"
    remove_file "ios/.xcode.env.local"
    remove_file "ios/link-assets-manifest.json"
    remove_dir "ios/app.xcworkspace/xcuserdata"
    remove_dir "ios/app.xcodeproj/xcuserdata"
    
    echo -e "${GREEN}✅ iOS cleanup complete${NC}"
    echo ""
fi

# React Native & Metro cleanup
if [ "$IOS_ONLY" = false ] && [ "$ANDROID_ONLY" = false ]; then
    echo -e "${GREEN}⚛️  Cleaning React Native artifacts...${NC}"
    
    remove_dir ".metro"
    remove_files "*.log"
    remove_files "*.tmp"
    
    echo -e "${GREEN}✅ React Native cleanup complete${NC}"
    echo ""
fi

# Deep clean (node_modules)
if [ "$DEEP_CLEAN" = true ]; then
    echo -e "${GREEN}🔄 Deep cleaning (including node_modules)...${NC}"
    
    if [ -d "node_modules" ]; then
        echo -e "${YELLOW}  Removing: node_modules${NC}"
        rm -rf node_modules
    fi
    
    if [ -f "package-lock.json" ]; then
        echo -e "${YELLOW}  Removing: package-lock.json${NC}"
        rm -f package-lock.json
    fi
    
    echo -e "${GREEN}📦 Reinstalling dependencies...${NC}"
    npm install --legacy-peer-deps
    
    echo -e "${GREEN}🍎 Reinstalling iOS pods...${NC}"
    cd ios && pod install && cd ..
    
    echo -e "${GREEN}✅ Deep cleanup complete${NC}"
    echo ""
fi

# Final cleanup of any remaining system files
echo -e "${GREEN}🧽 Final cleanup...${NC}"
remove_files ".DS_Store"

echo -e "${GREEN}🎉 Cleanup completed successfully!${NC}"
echo ""
echo -e "${BLUE}💡 Tips:${NC}"
echo "  • Run 'npm run clean:deep' for a complete reset"
echo "  • Use 'npm run clean:ios' or 'npm run clean:android' for platform-specific cleaning"
echo "  • Consider running 'npx react-native doctor' if you encounter build issues"
