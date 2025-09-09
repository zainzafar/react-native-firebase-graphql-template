# Quick Setup Guide

This guide will help you quickly set up the Firebase Authentication Template for your project.

# Mobile App Setup

## 1. App Store Connect Setup

You'll need to create two separate iOS apps in App Store Connect first, as their bundle identifiers will be used when creating Firebase iOS apps:

1. **Staging App**: Create an iOS app for staging/testing
   - Use this for development and staging builds
   - Can be distributed via TestFlight or internal testing
   - Note the bundle identifier (e.g., `com.yourcompany.yourapp.staging`)

2. **Production App**: Create an iOS app for production
   - Use this for App Store releases
   - Configure with your production bundle identifier (e.g., `com.yourcompany.yourapp`)

## 2. Firebase Project Setup

This template is designed for a multi-environment setup with separate staging and production Firebase projects. You'll need to create two Firebase projects, each containing multiple apps (iOS, Android, Web).

### Create Firebase Projects

1. **Staging Project**: Create your first Firebase project for staging environment
   - Add iOS app using the bundle identifier from your staging App Store Connect app
   - Add Android app using the package name from your `.env` file
     - When prompted for SHA-1 certificate, run: `cd mobile/android && ./gradlew :app:signingReport`
     - Copy the SHA-1 from the "development" flavor output
   - Add Web app to this project
   - Use this project for development and staging builds

2. **Production Project**: Create your second Firebase project for production environment
   - Add iOS app using the bundle identifier from your production App Store Connect app
   - Add Android app using the package name from your `.env` file
     - When prompted for SHA-1 certificate, run: `cd mobile/android && ./gradlew :app:signingReport`
     - Copy the SHA-1 from the "production" flavor output
     - **Note**: For production builds, you'll also need to upload your upload signing key to your CI/CD system
   - Add Web app to this project
   - Use this project for production builds only

#### Getting SHA Keys for Android

Firebase requires SHA-1 or SHA-256 keys for Android apps to enable certain authentication features.

**Notes:**
- Default debug keystore location: `~/.android/debug.keystore`
- Default alias: `AndroidDebugKey`, password: `android`
- Run again after configuring a release keystore to get release variant SHA keys
- **This template automatically uses the system debug keystore** at `~/.android/debug.keystore` (no local keystore file needed)
- Gradle will automatically generate the debug keystore at `~/.android/debug.keystore` if it doesn't exist
- To manually generate a debug keystore, use:
  ```bash
  keytool -genkeypair -v -storepass android -keypass android -keystore ~/.android/debug.keystore -alias AndroidDebugKey -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Android Debug,O=Android,C=US"
  ```
  This command will create the `debug.keystore` file at `~/.android/debug.keystore`.

You can obtain these keys by running the following commands from the `mobile/android` directory:

```bash
./gradlew :app:signingReport
```
or
```bash
./gradlew signingReport
```

This will output information about your app's signing configurations, including SHA-1 and SHA-256 keys. A sample output looks like this:

```
Variant: debug
Config: debug
Store: /Users/username/.android/debug.keystore
Alias: AndroidDebugKey
MD5:  AA:BB:CC:DD:EE:FF:11:22:33:44:55:66:77:88:99:00
SHA1: 11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44
SHA-256: AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99
```

### Replace Firebase Configuration Files

**IMPORTANT**: This template does not include Firebase configuration files. You must download the actual Firebase configuration files from the Firebase Console and add them to your project as follows.

#### Android Files to Add:
1. Go to your **staging Firebase project** → Project Settings → Your Apps → Android app
2. Download the `google-services.json` file
3. Place the downloaded file at:
   - `mobile/android/app/src/development/google-services.json`
   - `mobile/android/app/src/staging/google-services.json`

4. Go to your **production Firebase project** → Project Settings → Your Apps → Android app
5. Download the `google-services.json` file
6. For production builds, store the file content as base64 in your CI environment and write it during the build process

#### iOS Files to Add:
1. Go to your **staging Firebase project** → Project Settings → Your Apps → iOS app
2. Download the `GoogleService-Info.plist` file
3. Add the downloaded file to:
   - `mobile/ios/GoogleService-Info.plist` (development builds use staging)

**Note**: For production iOS builds, you can also store the `GoogleService-Info.plist` content as base64 in your CI environment and write it during the build process, similar to the Android approach.

## 3. Mobile Environment Configuration

Copy the example environment file and update it with your configuration:

```bash
cp mobile/.env.example mobile/.env
```

Edit the `.env` file and update the following variables:
```bash
# App Display Configuration
APP_NAME=Your App Name                    # Internal app name used by the build system
APP_DISPLAY_NAME=Your App Name            # Name displayed on device home screen and app store

# Android Configuration
ANDROID_APPLICATION_ID=com.yourcompany.yourapp    # Android package name (must match Firebase config)

# iOS Configuration
IOS_BUNDLE_ID=com.yourcompany.yourapp             # iOS bundle identifier (must match Firebase config)

# API Configuration
API_URL=https://api.yourcompany.com               # Your backend API endpoint

# Getting the Google Web Client ID:
# 1. Go to your Firebase Console → Authentication → Sign-in method
# 2. Enable "Google" as a sign-in provider
# 3. After enabling Google Sign-In, you'll see the Web Client ID in the configuration
# 4. Copy this Web Client ID and use it in your `.env` file
GOOGLE_WEB_CLIENT_ID=your-web-client-id.apps.googleusercontent.com    

# Getting the Google Reversed Client ID:
# 1. Open your mobile/ios/GoogleService-Info.plist file
# 2. Find the REVERSED_CLIENT_ID key and copy its value
# 3. Use this value in your `.env` file
GOOGLE_REVERSED_CLIENT_ID=com.googleusercontent.apps.your-client-id
```

**Important**: 
- Replace `your-web-client-id.apps.googleusercontent.com` with your actual Google Web Client ID from Firebase Console
- Replace `com.googleusercontent.apps.your-client-id` with your actual Google Reversed Client ID from Firebase Console
- Update app identifiers (`ANDROID_APPLICATION_ID`, `IOS_BUNDLE_ID`) to match your actual app bundle/package names
- Set `API_URL` to your actual backend endpoint

## 4. Install Dependencies & Run

```bash
npm install --legacy-peer-deps
cd ios && pod install
cd ..
npm run ios     # For iOS
npm run android # For Android
```

## 5. Project Cleanup System

This template includes a comprehensive cleanup system to help manage build artifacts, caches, and temporary files. The cleanup script provides multiple cleaning levels and platform-specific options.

### Available Cleanup Commands

```bash
# Basic cleanup (recommended for most cases)
npm run clean

# Deep cleanup including node_modules and reinstall dependencies
npm run clean:deep

# Platform-specific cleanup
npm run clean:ios
npm run clean:android

# Direct script usage with help
./scripts/cleanup.sh --help
```

### What Gets Cleaned

**Basic Cleanup (`npm run clean`):**
- Android: `android/app/build/`, `android/build/`, `android/.gradle/`, `android/app/.cxx/`
- iOS: `ios/build/`, `ios/Pods/`, `ios/.xcode.env.local`, user-specific Xcode data
- React Native: `.metro/` cache, log files, temporary files
- System: `.DS_Store` files throughout the project

**Deep Cleanup (`npm run clean:deep`):**
- Everything from basic cleanup PLUS
- `node_modules/` directory
- `package-lock.json`
- Automatic `npm install --legacy-peer-deps` after cleanup
- Automatic `pod install` for iOS dependencies

**Platform-Specific Cleanup:**
- `npm run clean:ios` - Cleans only iOS build artifacts
- `npm run clean:android` - Cleans only Android build artifacts

### When to Use Each Command

- **`npm run clean`**: Use regularly during development to clear build caches
- **`npm run clean:deep`**: Use when experiencing persistent build issues or after major dependency updates
- **`npm run clean:ios`** / **`npm run clean:android`**: Use when working on platform-specific issues
- **`./scripts/cleanup.sh --help`**: View all available options and examples

### Safety Features

The cleanup script includes several safety features:
- ✅ Safety check to ensure you're in a React Native project directory
- ✅ Colored output with progress indicators
- ✅ Error handling and graceful failures
- ✅ Help documentation
- ✅ Platform-specific options

# Backend API Setup

## 1. Copy API Environment File

```bash
cp api/.env.example api/.env
```

## 2. Update API Environment Variables

Edit `api/.env` and update the following variables:

```bash
# Get the Firebase service account JSON from Firebase Console → Project Settings → Service Accounts → Generate New Private Key
# Firebase service account as base64 encoded JSON string
# Convert using: base64 -i path/to/serviceAccountKey.json
FIREBASE_SERVICE_ACCOUNT="your-base64-encoded-service-account-json-string-here"

# Set up your database and update the connection string
DATABASE_URL="postgresql://username:password@localhost:5432/your_database?schema=public"
```

## 3. Start the API Server

```bash
cd api
npm install
npx prisma migrate dev
npm run dev
```

## 4. Promote a Super Admin (optional)

Grant `SUPER_ADMIN` to an existing user (the user must have logged in at least once so they exist in the DB):

```bash
cd api
SEED_SUPER_ADMIN_EMAIL="admin@example.com" npm run prisma:seed
```

You can re-run the command with a different email to grant additional super admins.

## 5. Theme System (Optional)

The app includes a scalable theme system that supports multiple themes with automatic discovery. For detailed information about:

- Adding new themes
- Theme composition and overrides
- Auto-discovery system
- Type safety and best practices

See: [Theme System Documentation](./mobile/theme.md)

## ⚠️ Common Setup Issues

1. **Firebase Configuration Not Found**: Make sure you've replaced all dummy Firebase files
2. **Google Sign-In Fails**: Verify Web Client ID and SHA-1 fingerprints
3. **Apple Sign-In Issues**: Check Apple Developer account and Xcode capabilities
4. **Build Errors**: Ensure all app identifiers are updated consistently
5. **Theme Not Found**: Run `npm run generate-themes` after adding new theme folders
