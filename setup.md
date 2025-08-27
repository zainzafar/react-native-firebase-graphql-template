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

### Replace Firebase Configuration Files

**IMPORTANT**: Download the actual Firebase configuration files from the Firebase Console and replace the dummy files.

#### Android Files to Replace:
1. Go to your **staging Firebase project** → Project Settings → Your Apps → Android app
2. Download the `google-services.json` file
3. Replace these files:
   - `mobile/android/app/src/development/google-services.json` → Use the downloaded file
   - `mobile/android/app/src/staging/google-services.json` → Use the downloaded file

4. Go to your **production Firebase project** → Project Settings → Your Apps → Android app
5. Download the `google-services.json` file
6. For production builds, store the file content as base64 in your CI environment and write it during the build process

#### iOS Files to Replace:
1. Go to your **staging Firebase project** → Project Settings → Your Apps → iOS app
2. Download the `GoogleService-Info.plist` file
3. Replace this file:
   - `mobile/ios/GoogleService-Info.plist` → Use the downloaded file (development builds use staging)

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

# Firebase Configuration
GOOGLE_WEB_CLIENT_ID=your-web-client-id.apps.googleusercontent.com    # Google OAuth Web Client ID from Firebase Console
```

**Important**: 
- Replace `your-web-client-id.apps.googleusercontent.com` with your actual Google Web Client ID from Firebase Console
- Update app identifiers (`ANDROID_APPLICATION_ID`, `IOS_BUNDLE_ID`) to match your actual app bundle/package names
- Set `API_URL` to your actual backend endpoint

## 4. Install Dependencies & Run

```bash
npm install
cd ios && pod install
cd ..
npm run ios     # For iOS
npm run android # For Android
```

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

# Use the Firebase web config from your Firebase project settings
FIREBASE_WEB_CONFIG='{"apiKey":"your-api-key","authDomain":"your-project.firebaseapp.com","projectId":"your-project","storageBucket":"your-project.firebasestorage.app","messagingSenderId":"123456789012","appId":"1:123456789012:web:abcdef1234567890"}'

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

## ⚠️ Common Setup Issues

1. **Firebase Configuration Not Found**: Make sure you've replaced all dummy Firebase files
2. **Google Sign-In Fails**: Verify Web Client ID and SHA-1 fingerprints
3. **Apple Sign-In Issues**: Check Apple Developer account and Xcode capabilities
4. **Build Errors**: Ensure all app identifiers are updated consistently
