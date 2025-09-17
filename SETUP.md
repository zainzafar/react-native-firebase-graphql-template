# Quick Setup Guide

This guide will help you quickly set up the Firebase Authentication Template for your project.

# Template Assumptions

This template is designed for a dual-app setup with separate staging and production environments. You'll create two apps per platform (iOS and Android) - one for staging/development and one for production. This approach provides complete separation between environments without using Android flavors. For example, you might use bundle identifiers like `com.yourcompany.yourapp.staging` and `com.yourcompany.yourapp` for iOS, and package names like `com.yourcompany.yourapp.staging` and `com.yourcompany.yourapp` for Android.

---

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

## 2. Play Store Setup

You'll need to create two separate Android apps in Google Play Console:

1. **Staging App**: Create an Android app for staging/testing
   - Use this for development and staging builds
   - Can be distributed via internal testing or closed testing
   - The package name will be automatically detected when you upload your first AAB file

2. **Production App**: Create an Android app for production
   - Use this for Google Play Store releases
   - The package name will be automatically detected when you upload your first AAB file

**Important**: Google Play Console doesn't ask for package names upfront. The package name is automatically detected from your first uploaded AAB file. Make sure your `ANDROID_APPLICATION_ID` in your `.env` file matches what you want to use.

**App Data Safety Policy**: Google Play Store requires you to declare how your app collects and uses data. Since this template includes a debug screen that collects device information, you must add an App Data Safety policy that describes the use of Device or other IDs. Go to Google Play Console → Your App → Monitor and Improve → Policy and Programs → App Content → Data safety → Add data type → Device or other IDs → Select "Collected" and provide details about how device information is used for debugging purposes.

## 3. Firebase Project Setup

This template supports flexible Firebase project configurations. You can choose between two approaches:

### Option A: Single Firebase Project (Recommended for Simplicity)

Create one Firebase project and add multiple apps with descriptive names:

1. **Create Firebase Project**: Create a single Firebase project
2. **Add Staging Apps**:
   - Add iOS app with bundle identifier from your staging App Store Connect app (name it "Your App (Staging)")
   - Add Android app with package name from your `.env` file (name it "Your App (Staging)")
   - You can skip the SHA-1 certificate step for now - you'll add these later
3. **Add Production Apps**:
   - Add iOS app with bundle identifier from your production App Store Connect app (name it "Your App (Production)")
   - Add Android app with package name from your `.env` file (name it "Your App (Production)")
   - You can skip the SHA-1 certificate step for now - you'll add these later
4. **Add Web App**: Add one web app to this project

### Option B: Separate Firebase Projects (For Complete Separation)

If you prefer complete separation between staging and production environments:

1. **Staging Project**: Create your first Firebase project for staging environment
   - Add iOS app using the bundle identifier from your staging App Store Connect app
   - Add Android app using the package name from your `.env` file
   - You can skip the SHA-1 certificate step for now - you'll add these later
   - Add Web app to this project
   - Use this project for development and staging builds

2. **Production Project**: Create your second Firebase project for production environment
   - Add iOS app using the bundle identifier from your production App Store Connect app
   - Add Android app using the package name from your `.env` file
   - You can skip the SHA-1 certificate step for now - you'll add these later
   - **Note**: For production builds, you'll also need to upload your upload signing key to your CI/CD system
   - Add Web app to this project
   - Use this project for production builds only

### Getting SHA Keys for Android

**When to add SHA keys**: After creating your Android apps in Firebase, you'll need to add SHA-1 and SHA-256 keys to enable authentication features. You can add these keys later by going to Firebase Console → Project Settings → Your Apps → Android app → Add fingerprint.

Firebase requires SHA-1 or SHA-256 keys for Android apps to enable certain authentication features. You'll need to add multiple SHA keys to your Firebase project to support different build types and distribution methods.

For each Android app (staging and production), you'll typically need to add **3 different sets of SHA keys**:

| Keystore Type | SHA-1 | SHA-256 | Usage |
|---------------|-------|---------|-------|
| Debug Keystore | Required | Required | Local development builds |
| Upload Keystore | Required | Required | Release builds uploaded to Play Store |
| Google App Signing | Required | Required | Play Store distributed builds |

#### 1. Debug Keystore

Used for local development and testing builds.

**Location**: `~/.android/debug.keystore`  
**Alias**: `AndroidDebugKey`  
**Store Password**: `android`  
**Key Password**: `android`

**Getting the SHA keys:**
```bash
cd mobile/android
./gradlew :app:signingReport
```

Look for the `debug` variant output:
```
Variant: debug
Config: debug
Store: /Users/username/.android/debug.keystore
Alias: AndroidDebugKey
SHA1: 11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44
SHA-256: AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99
```

**Notes:**
- This template automatically uses the system debug keystore
- Gradle will automatically generate the debug keystore if it doesn't exist
- To manually generate: `keytool -genkeypair -v -storepass android -keypass android -keystore ~/.android/debug.keystore -alias AndroidDebugKey -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Android Debug,O=Android,C=US"`

#### 2. Upload Keystore

Used for release builds that you upload to Google Play Store.

**Getting the SHA keys:**
```bash
cd mobile/android
./gradlew :app:signingReport
```

Look for the `release` variant output and check which keystore it's using:

**If the release variant is using a separate upload keystore:**
```
Variant: release
Config: release
Store: /path/to/your/upload-keystore.jks
Alias: your-key-alias
SHA1: 22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55
SHA-256: BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA
```

**If the release variant is using the debug keystore** (Store: `/Users/username/.android/debug.keystore`), you need to generate a proper release keystore:

```bash
cd mobile/android/app
keytool -genkeypair -v -keystore release.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

This will prompt you for:
- Keystore password (choose a strong password)
- Key password (can be same as keystore password)
- Your name, organizational unit, organization, city, state, and country code

**Note**: The `android/app/build.gradle` file automatically uses the release keystore when it's created in the `mobile/android/app/` directory. After generating your release keystore, run `./gradlew :app:signingReport` again to get the new SHA keys.

#### 3. Google App Signing

When you upload your app to Google Play Store, Google may re-sign your APK/AAB with their own App Signing key. This is the SHA key that will be used for distributed builds.

**Getting the SHA keys:**
1. Go to **Google Play Console → Select App → Test and Release → App integrity → Play app signing → settings**
2. Copy the **SHA-1** and **SHA-256** from the "App signing key certificate" section
3. These are the keys that Google Play uses to sign your distributed app

**Important**: You must add all three sets of SHA keys to your Firebase project to ensure authentication works across all build types and distribution methods.

### Replace Firebase Configuration Files

**IMPORTANT**: This template does not include Firebase configuration files. You must download the actual Firebase configuration files from the Firebase Console and add them to your project as follows.

#### Android Files to Add:
1. From your Firebase project → Project Settings → Your Apps → Android app, download `google-services.json`.
2. For local development, place it at: `mobile/android/app/google-services.json`.
3. For CI, store the file as base64 in `GOOGLE_SERVICES_JSON_B64`; the workflow writes it to `mobile/android/app/google-services.json`.
4. If using separate Firebase projects, ensure the correct file is provided (locally or via CI secret) according to the `ANDROID_APPLICATION_ID` you target.

#### iOS Files to Add:
1. From your Firebase project → Project Settings → Your Apps → iOS app, download `GoogleService-Info.plist`.
2. Add it to: `mobile/ios/GoogleService-Info.plist`.

**Notes**:
- For production iOS builds, you can store the `GoogleService-Info.plist` content as base64 in your CI environment; the workflow writes it to `mobile/ios/GoogleService-Info.plist`.
- CI may write a minimal placeholder to bypass build errors, but you must replace it with your real file for actual usage.

## 4. Mobile Environment Configuration

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

# Getting the Google Web Client ID (required for both iOS and Android Google Sign-In):
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
- Set `GRAPHQL_API_URL` to your actual backend endpoint

## 5. Install Dependencies & Run

```bash
npm install --legacy-peer-deps
cd ios && pod install
cd ..
npm run ios     # For iOS
npm run android # For Android
```

## 6. Project Cleanup System

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

---

# Backend API Setup

## 7. Copy API Environment File

The API includes an example environment file with all required configuration variables:

```bash
cp api/.env.example api/.env
```

## 8. Update API Environment Variables

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

## 9. Start the API Server

```bash
cd api
npm install
npx prisma migrate dev
npm run dev
```

## 10. Promote a Super Admin (optional)

Grant `SUPER_ADMIN` to an existing user (the user must have logged in at least once so they exist in the DB):

```bash
cd api
SEED_SUPER_ADMIN_EMAIL="admin@example.com" npm run prisma:seed
```

You can re-run the command with a different email to grant additional super admins.

## 11. Theme System (Optional)

The app includes a scalable theme system that supports multiple themes with automatic discovery. For detailed information about:

- Adding new themes
- Theme composition and overrides
- Auto-discovery system
- Type safety and best practices

See: [Theme System Documentation](./mobile/theme.md)

## 12. First Android Build Upload (Required)

**⚠️ Important Google Play Store Limitation**: Fastlane can only upload to Google Play Store if there has been at least one manual upload of your app to the store first. This is a Google Play Console requirement, not a Fastlane limitation. You must manually upload your first AAB through the Google Play Console before automated uploads via Fastlane will work.

### Building Your First AAB File

To create your first AAB file for manual upload:

1. **Use GitHub Actions Android Build**:
   - Go to your repository → Actions → Android Build
   - Click "Run workflow"
   - Configure the following options:
     - **Lane**: `build`
     - **Google Play track for beta lane**: `internal`
     - **Release status**: `draft`
     - **Android build type**: `release`
     - **Packaging format**: `AAB`
     - **Build Number**: Leave empty for auto-increment

2. **Download the AAB File**:
   - Once the build completes, go to the workflow run
   - Download the `android-artifacts` artifact
   - Extract the `.aab` file from the downloaded archive

3. **Upload to Google Play Console**:
   - Go to Google Play Console → Your App → Release → Production (or Internal testing)
   - Click "Create new release"
   - Upload the `.aab` file
   - Complete the release process

4. **Enable Automated Uploads**:
   - After the first manual upload, Fastlane will be able to upload subsequent builds automatically
   - You can now use the `beta` lane in GitHub Actions for automated uploads

## 13. GitHub Actions CI/CD Setup

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
- **Available Lanes**:
  - `build`: Dual-mode builds (simulator debug or signed release)
  - `beta`: TestFlight uploads with automatic build number management
- **Build Modes**:
  - `auto`: Automatically selects simulator or release based on lane
  - `simulator`: Creates debug builds for testing
  - `release`: Creates signed release builds
- **Features**:
  - Flexible signing options (App Store Connect API or Fastlane Match)
  - Automatic build number management
  - TestFlight uploads

#### 3. **Android Build Workflow** (`.github/workflows/android.yml`)
- **Triggers**: Manual dispatch only
- **Purpose**: Build and deploy Android apps
- **Available Lanes**:
  - `build`: Creates APK or AAB files for manual distribution
  - `beta`: Uploads to Google Play Store with selectable track
- **Build Types**:
  - `debug`: Development builds
  - `release`: Production builds
- **Packaging Formats**:
  - `APK`: Direct installation files
  - `AAB`: Android App Bundles for Play Store
- **Google Play Tracks**:
  - `internal`: Internal testing
  - `alpha`: Alpha testing
  - `beta`: Beta testing
  - `production`: Production releases
- **Features**:
  - Flavorless builds (env-driven package name and Firebase file)
  - Automatic version code management
  - Flexible keystore handling
  - Selectable release status (draft/completed)

### Setting Up GitHub Actions

#### 1. **Configure Repository Secrets**

Go to your repository → Settings → Secrets and variables → Actions, and add the required secrets based on your deployment needs.

**📋 Complete Variable Reference**: See [VARIABLES.md](VARIABLES.md) for a comprehensive list of all available secrets, environment variables, and workflow inputs.

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

**⚠️ First Build Requirement**: Before using the `beta` lane for automated Play Store uploads, you must manually upload your first AAB file. See [First Android Build Upload (Required)](#12-first-android-build-upload-required) for detailed instructions.

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
- **Google Play Upload Errors**: If you get "Package not found" errors when uploading to Google Play Store, you must first manually upload your app through the Google Play Console. Fastlane can only upload to apps that have been manually uploaded at least once. See [this GitHub issue](https://github.com/fastlane/fastlane/issues/21749) for details.

For detailed variable documentation, see [VARIABLES.md](VARIABLES.md).

## ⚠️ Common Setup Issues

1. **Firebase Configuration Not Found**: Make sure you've replaced all dummy Firebase files
2. **Google Sign-In Fails**: Verify Web Client ID and SHA-1 fingerprints
3. **Apple Sign-In Issues**: Check Apple Developer account and Xcode capabilities
4. **Build Errors**: Ensure all app identifiers are updated consistently
5. **Theme Not Found**: Run `npm run generate-themes` after adding new theme folders
6. **CI/CD Build Failures**: Check GitHub Actions logs and verify all secrets are configured
