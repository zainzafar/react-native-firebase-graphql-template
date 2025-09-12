# Quick Setup Guide

This guide will help you quickly set up the Firebase Authentication Template for your project.

## Template assumptions

- Two apps per platform, no Android flavors in code:
  - iOS: `com.example.app.staging` and `com.example.app`
  - Android: `com.example.app.staging` and `com.example.app`
- Bundle/package IDs are provided via environment variables (`IOS_BUNDLE_ID`, `ANDROID_APPLICATION_ID`).
- Firebase native files are required:
  - iOS: `mobile/ios/GoogleService-Info.plist` (locally or via CI secret; for fresh start, CI writes a placeholder to avoid build errors)
  - Android: `mobile/android/app/google-services.json` (locally or via CI secret; for fresh start, CI ignores the google-signin config in build.gradle to avoid build errors)
- Android Play upload track is selectable in CI (defaults to `internal`).

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
     - Copy the SHA-1 from the `debug` variant output
   - Add Web app to this project
   - Use this project for development and staging builds

2. **Production Project**: Create your second Firebase project for production environment
   - Add iOS app using the bundle identifier from your production App Store Connect app
   - Add Android app using the package name from your `.env` file
     - When prompted for SHA-1 certificate, run: `cd mobile/android && ./gradlew :app:signingReport`
     - Copy the SHA-1 from the `release` variant output
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
1. From your **staging Firebase project** → Project Settings → Your Apps → Android app, download `google-services.json`.
2. For local development, place it at: `mobile/android/app/google-services.json`.
3. For CI, store the file as base64 in `GOOGLE_SERVICES_JSON_B64`; the workflow writes it to `mobile/android/app/google-services.json`.
4. Repeat for your **production Firebase project** when building production; ensure the correct file is provided (locally or via CI secret) according to the `ANDROID_APPLICATION_ID` you target.

#### iOS Files to Add:
1. From your **staging Firebase project** → Project Settings → Your Apps → iOS app, download `GoogleService-Info.plist`.
2. Add it to: `mobile/ios/GoogleService-Info.plist`.

**Notes**:
- For production iOS builds, you can store the `GoogleService-Info.plist` content as base64 in your CI environment; the workflow writes it to `mobile/ios/GoogleService-Info.plist`.
- CI may write a minimal placeholder to bypass build errors, but you must replace it with your real file for actual usage.

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
GRAPHQL_API_URL=https://api.yourcompany.com/graphql  # Your GraphQL API endpoint

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

The API includes an example environment file with all required configuration variables:

```bash
cp api/.env.example api/.env
```

## 2. Update API Environment Variables

Edit `api/.env` and update the following variables:

```bash
# Get the Firebase service account JSON from Firebase Console → Project Settings → Service Accounts → Generate New Private Key
# Firebase service account as base64 encoded JSON string
# Convert using: base64 -i path/to/serviceAccountKey.json
FIREBASE_SERVICE_ACCOUNT_B64="your-base64-encoded-service-account-json-string-here"

# Set up your database and update the connection string
DATABASE_URL="postgresql://username:password@localhost:5432/your_database?schema=public"

# JWT secret for authentication (generate a secure random string)
APP_JWT_SECRET=a0fdc9d3b2f73ed6e4d0c75f1f5e2a53c82a5c8cdaefb11cc74031fd96ec4569

# App store URLs (optional - for app store redirects in app version rules)
IOS_APP_STORE_URL=
ANDROID_PLAY_STORE_URL=
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

## 6. GitHub Actions CI/CD Setup

This template includes comprehensive GitHub Actions workflows for automated building, testing, and deployment. The CI/CD system supports both iOS and Android builds with flexible configuration options.

### Available Workflows

#### 1. **CI Workflow** (`.github/workflows/ci.yml`)
- **Triggers**: Runs on every push to `main` and on pull requests
- **Purpose**: Automated testing and validation
- **What it does**:
  - Installs dependencies for both API and mobile
  - Runs TypeScript type checking
  - Builds the API
  - Lints and tests the mobile app
  - Ensures code quality before merging

#### 2. **iOS Build Workflow** (`.github/workflows/ios.yml`)
- **Triggers**: Manual dispatch only
- **Purpose**: Build and deploy iOS apps
- **Features**:
  - Dual-mode builds (simulator debug or signed release)
  - TestFlight uploads
  - Automatic build number management
  - Flexible signing options (App Store Connect API or Fastlane Match)

#### 3. **Android Build Workflow** (`.github/workflows/android.yml`)
- **Triggers**: Manual dispatch only
- **Purpose**: Build and deploy Android apps
- **Features**:
  - Flavorless builds (env-driven package name and Firebase file)
  - Google Play Store uploads with selectable track (internal/alpha/beta/production)
  - Automatic version code management
  - Flexible keystore handling

### Setting Up GitHub Actions

#### 1. **Configure Repository Secrets**

Go to your repository → Settings → Secrets and variables → Actions, and add the required secrets based on your deployment needs.

**📋 Complete Variable Reference**: See [mobile/fastlane/VARIABLES.md](mobile/fastlane/VARIABLES.md) for a comprehensive list of all available secrets, environment variables, and workflow inputs.

**Quick Start Secrets:**
- **Basic Setup**: `APP_NAME`, `APP_DISPLAY_NAME`, `ANDROID_APPLICATION_ID`, `IOS_BUNDLE_ID`, `GRAPHQL_API_URL`
- **iOS Production**: `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_KEY_CONTENTS` (or `MATCH_GIT_URL`, `MATCH_PASSWORD`)
- **Android Production**: `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`, `GOOGLE_PLAY_SERVICE_KEY_B64`
- **Firebase**: `GOOGLE_SERVICES_JSON_B64`, `GOOGLE_SERVICE_INFO_PLIST_B64`, `GOOGLE_WEB_CLIENT_ID`, `GOOGLE_REVERSED_CLIENT_ID`

#### 2. **Running Builds**

**For Testing (CI):**
- Push to `main` or create a pull request
- CI workflow runs automatically
- Check the Actions tab for results

**For iOS Builds:**
1. Go to Actions → iOS Build
2. Click "Run workflow"
3. Choose your options:
   - **Lane**: `build` (dual-mode) or `beta` (TestFlight upload)
   - **Build Mode**: `auto` (recommended), `simulator`, or `release`
   - **Build Number**: Leave empty for auto-increment

**For Android Builds:**
1. Go to Actions → Android Build
2. Click "Run workflow"
3. Choose your options:
   - **Lane**: `build` (dual-mode) or `beta` (Play Store upload)
   - **Track**: `internal` (default), `alpha`, `beta`, or `production`
   - **Release Status**: `draft` or `completed`
   - **Build Number**: Leave empty for auto-increment

#### 3. **Build Outputs**

The workflows will build your apps and upload them to the respective stores:

**iOS Builds:**
- **Release builds**: Creates signed `.ipa` files and uploads to TestFlight
- **Simulator builds**: Creates debug builds for testing

**Android Builds:**
- **APK builds**: Creates signed `.apk` files for direct installation
- **AAB builds**: Creates Android App Bundles and uploads to Google Play Store

#### 4. **Artifacts (Downloadable from GitHub Actions)**

During CI, build outputs are also copied into artifact directories and uploaded as workflow artifacts:

- **Local artifact directories (ignored by git):**
  - `mobile/artifacts/ios` — `.ipa`, `.dSYM.zip`, `.xcarchive` (release), or `.app` (simulator)
  - `mobile/artifacts/android` — `.apk`, `.aab` (beta lane), and ProGuard `mapping` files
- **GitHub Actions artifact names:**
  - `ios-artifacts` uploaded by `.github/workflows/ios.yml`
  - `android-artifacts` uploaded by `.github/workflows/android.yml`

Artifacts are collected using Fastlane’s `copy_artifacts` action and Android’s Gradle lane context when available, with glob fallbacks. See Fastlane docs: [copy_artifacts](https://docs.fastlane.tools/actions/copy_artifacts/) and [lane_context](https://docs.fastlane.tools/advanced/lanes/#lane-context).

### CI/CD Best Practices

1. **Start Simple**: Begin with the CI workflow to ensure code quality
2. **Test Locally First**: Run `npm run lint && npm run typecheck && npm test` before pushing
3. **Gradual Setup**: Add signing secrets only when ready for production builds
4. **Monitor Builds**: Check the Actions tab regularly for build status
5. **Use Manual Triggers**: iOS and Android builds are manual to prevent accidental deployments

### Troubleshooting CI/CD

- **Build Failures**: Check the Actions logs for detailed error messages
- **Missing Secrets**: Ensure all required secrets are configured in repository settings
- **Signing Issues**: Verify your signing certificates and provisioning profiles
- **Firebase Errors**: Check that Firebase configuration files are properly base64 encoded

For detailed variable documentation, see [mobile/fastlane/VARIABLES.md](mobile/fastlane/VARIABLES.md).

## ⚠️ Common Setup Issues

1. **Firebase Configuration Not Found**: Make sure you've replaced all dummy Firebase files
2. **Google Sign-In Fails**: Verify Web Client ID and SHA-1 fingerprints
3. **Apple Sign-In Issues**: Check Apple Developer account and Xcode capabilities
4. **Build Errors**: Ensure all app identifiers are updated consistently
5. **Theme Not Found**: Run `npm run generate-themes` after adding new theme folders
6. **CI/CD Build Failures**: Check GitHub Actions logs and verify all secrets are configured
