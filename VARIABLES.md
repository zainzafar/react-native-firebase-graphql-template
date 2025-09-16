# Fastlane Variables Reference

This document provides a complete reference for all variables used in the iOS and Android build workflows. All variables are **optional** - the system works with sensible defaults, but you can configure them for production builds and deployments.

## 📋 Quick Reference

- **GitHub Secrets**: Set in your repository's Settings → Secrets and variables → Actions → Secrets
- **GitHub Variables**: Set in your repository's Settings → Secrets and variables → Actions → Variables  
- **Workflow Inputs**: Set when manually triggering workflows in GitHub Actions
- **Environment Variables**: Automatically set by workflows or Fastfile

---

## 🏗️ App Configuration

### GitHub Variables

| Variable | Description | Where to Get | Example | Required For |
|----------|-------------|--------------|---------|--------------|
| `APP_NAME` | Internal app name used in build scripts | Choose your app name | `MyApp` | All builds |
| `APP_DISPLAY_NAME` | User-facing app name displayed on device | Choose your display name | `My App` | All builds |
| `ANDROID_APPLICATION_ID` | Android package name | Choose your package name | `com.mycompany.myapp` | Android builds |
| `IOS_BUNDLE_ID` | iOS bundle identifier | Choose your bundle ID | `com.mycompany.myapp` | iOS builds |
| `GRAPHQL_API_URL` | Backend GraphQL API endpoint URL | Your backend URL | `https://api.myapp.com/graphql` | All builds |

**How to set**: Go to your repository → Settings → Secrets and variables → Actions → Variables → New repository variable

---

## 🔐 iOS Configuration

### App Store Connect API Key (Required for TestFlight uploads)

#### GitHub Variables
| Variable | Description | Where to Get | Example |
|----------|-------------|--------------|---------|
| `APP_STORE_CONNECT_API_KEY_ID` | App Store Connect API Key ID | App Store Connect → Users and Access → Keys → Generate API Key | `ABC123DEF4` |
| `APP_STORE_CONNECT_ISSUER_ID` | App Store Connect Issuer ID | App Store Connect → Users and Access → Keys → Generate API Key | `12345678-1234-1234-1234-123456789012` |
| `APP_STORE_CONNECT_TEAM_ID` | App Store Connect Team ID | See below for multiple methods to obtain this value | `1234567890` |
| `APPLE_DEVELOPER_TEAM_ID` | Apple Developer Team ID | Apple Developer → Membership → Team ID | `ABC123DEF4` |

#### GitHub Secrets
| Secret | Description | Where to Get | How to Encode |
|--------|-------------|--------------|---------------|
| `APP_STORE_CONNECT_API_KEY_CONTENT_B64` | Base64-encoded App Store Connect API Key (.p8 file) | App Store Connect → Users and Access → Keys → Download .p8 file | See below |

**Step-by-step setup:**
1. Go to [App Store Connect](https://appstoreconnect.apple.com) → Users and Access → Keys
2. Click "Generate API Key" → Select "App Manager" or "Admin" role
3. Download the `.p8` file
4. Copy the Key ID and Issuer ID from the key details
5. Encode the `.p8` file: `base64 -i AuthKey_ABC123DEF4.p8`
6. **Get App Store Connect Team ID** using one of these methods:
   - **Method 1 (Easiest)**: Run `fastlane deliver` and it will show available teams with their IDs
   - **Method 2**: Visit [App Store Connect API endpoint](https://appstoreconnect.apple.com/WebObjects/iTunesConnect.woa/ra/user/detail) and look for `contentProviderId` in the `associatedAccounts` array
   - **Method 3**: Use Spaceship playground: `fastlane spaceship` → `Spaceship::Tunes.select_team`
7. Set all values in GitHub repository settings

### Code Signing (Choose ONE method)

#### Option A: Fastlane Match (Recommended for CI)

##### GitHub Variables
| Variable | Description | Where to Get | Example |
|----------|-------------|--------------|---------|
| `MATCH_GIT_URL` | Git repository URL for certificates/profiles | Create a private Git repository for certificates | `https://github.com/yourcompany/certificates.git` |

##### GitHub Secrets
| Secret | Description | Where to Get | Example |
|--------|-------------|--------------|---------|
| `MATCH_PASSWORD` | Password for encrypted certificates repository | Choose a strong password | `MySecurePassword123!` |
| `MATCH_GIT_BASIC_AUTHORIZATION` | Basic auth for private match repository (optional) | GitHub → Settings → Developer settings → Personal access tokens | `base64(username:token)` |

**Step-by-step setup:**
1. Create a private Git repository for storing certificates
2. Choose a strong password for encrypting certificates
3. Set `MATCH_GIT_URL` to your repository URL
4. Set `MATCH_PASSWORD` to your chosen password
5. (Optional) Create a GitHub Personal Access Token and encode it for `MATCH_GIT_BASIC_AUTHORIZATION`:
   ```bash
   echo -n "username:your_personal_access_token" | base64
   ```

#### Option B: Xcode Automatic/Managed Signing

**Requirements:**
- Set `APPLE_DEVELOPER_TEAM_ID` (GitHub Variable)
- Use `ios_signing_mode: automatic` in workflow input

### iOS Workflow Inputs

| Input | Description | Options | Default | When to Use |
|-------|-------------|---------|---------|-------------|
| `environment` | Target environment | `staging`, `production` | `staging` | Choose based on your deployment target |
| `lane` | Fastlane lane to execute | `build`, `beta` | `build` | `build` for local builds, `beta` for TestFlight |
| `ios_build_mode` | Force specific iOS build mode | `auto`, `simulator`, `release` | `auto` | Override automatic mode selection |
| `ios_signing_mode` | iOS signing method (only applies when build mode is release) | `""` (auto), `match`, `automatic` | `""` (auto) | Override automatic signing method |
| `build_number` | Override build number | Any integer | Auto-increment | Manual build number control |

---

## 🤖 Android Configuration

### Signing Configuration

#### GitHub Secrets
| Secret | Description | Where to Get | How to Encode |
|--------|-------------|--------------|---------------|
| `ANDROID_KEYSTORE_BASE64` | Base64-encoded keystore file | Generate with `keytool` or use existing | See below |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password | Choose when creating keystore | `MyKeystorePassword123!` |
| `ANDROID_KEY_ALIAS` | Key alias in keystore | Choose when creating keystore | `my-key-alias` |
| `ANDROID_KEY_PASSWORD` | Key password | Choose when creating keystore | `MyKeyPassword123!` |

**Step-by-step setup:**
1. Generate a keystore: `keytool -genkeypair -v -keystore my-upload-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000`
2. Encode the keystore: `base64 -i my-upload-key.keystore`
3. Set all keystore values in GitHub repository settings

### Google Play Store Upload (Choose ONE method)

#### Option A: Base64-encoded Service Account Key (Recommended)

##### GitHub Secrets
| Secret | Description | Where to Get | How to Encode |
|--------|-------------|--------------|---------------|
| `GOOGLE_PLAY_SERVICE_KEY_B64` | Base64-encoded Google Play service account JSON | Google Play Console → Setup → API access → Create service account | See below |

**Step-by-step setup:**
1. Go to [Google Play Console](https://play.google.com/console) → Setup → API access
2. Create a new service account or use existing one
3. Download the JSON key file
4. Encode the JSON file: `base64 -i play-store-service-key.json`
5. Set the encoded value in GitHub repository settings

#### Option B: Inline JSON Data (Alternative)

##### GitHub Secrets
| Secret | Description | Where to Get | Example |
|--------|-------------|--------------|---------|
| `GOOGLE_PLAY_JSON_DATA` | Inline Google Play service account JSON | Google Play Console → Setup → API access → Create service account | `{"type": "service_account", "project_id": "my-project", ...}` |

### Android Workflow Inputs

| Input | Description | Options | Default | When to Use |
|-------|-------------|---------|---------|-------------|
| `environment` | Target environment | `staging`, `production` | `staging` | Choose based on your deployment target |
| `lane` | Fastlane lane to execute | `build`, `beta` | `build` | `build` for local builds, `beta` for Play Store |
| `track` | Google Play track for beta lane | `internal`, `alpha`, `beta`, `production` | `internal` | Choose your distribution track |
| `release_status` | Play Store release status | `draft`, `completed` | `draft` | `draft` for testing, `completed` for release |
| `build_type` | Android build type | `auto`, `Release`, `Debug` | `auto` | Override automatic build type selection |
| `packaging` | Packaging format | `aab`, `apk`, `auto` | `aab` | `aab` for Play Store, `apk` for testing |
| `build_number` | Override build number | Any integer | Auto-increment | Manual build number control |

---

## 🔥 Firebase Configuration

### GitHub Secrets
| Secret | Description | Where to Get | How to Encode |
|--------|-------------|--------------|---------------|
| `GOOGLE_WEB_CLIENT_ID` | Google OAuth web client ID | Firebase Console → Authentication → Sign-in method → Google → Web SDK configuration | `123456789-abcdefghijklmnop.apps.googleusercontent.com` |
| `GOOGLE_REVERSED_CLIENT_ID` | Google OAuth reversed client ID | iOS GoogleService-Info.plist → REVERSED_CLIENT_ID key | `com.googleusercontent.apps.123456789-abcdefghijklmnop` |
| `GOOGLE_SERVICE_INFO_PLIST_B64` | Base64-encoded GoogleService-Info.plist file | Firebase Console → Project Settings → iOS app → Download GoogleService-Info.plist | See below |
| `GOOGLE_SERVICES_JSON_B64` | Base64-encoded google-services.json file | Firebase Console → Project Settings → Android app → Download google-services.json | See below |

**Step-by-step setup:**
1. Go to [Firebase Console](https://console.firebase.google.com) → Your Project → Project Settings
2. Add your iOS and Android apps
3. Download the configuration files:
   - iOS: `GoogleService-Info.plist`
   - Android: `google-services.json`
4. Encode the files:
   ```bash
   base64 -i GoogleService-Info.plist
   base64 -i google-services.json
   ```
5. For Google Sign-In, enable Google authentication and copy the Web Client ID
6. For iOS, copy the REVERSED_CLIENT_ID from the plist file
7. Set all values in GitHub repository settings

---

## 🔄 Build Number Logic

### iOS Build Numbers
1. **Manual override**: If `build_number` input is set, use that value
2. **CI with signing**: Fetch latest TestFlight build number + 1
3. **Fallback**: Auto-increment from Xcode project

### Android Build Numbers
1. **Manual override**: If `build_number` input is set, use that value
2. **CI with Play Store access**: Fetch latest Play Store version code + 1
3. **CI fallback**: Use `GITHUB_RUN_NUMBER`
4. **Local fallback**: Use current timestamp

---

## 🚀 Getting Started

### Minimal Setup (Works Out of the Box)
No secrets required! The system will:
- Build debug/simulator versions
- Use default app names and bundle IDs
- Auto-increment build numbers
- Skip signing and store uploads

### Production Setup Checklist

#### 1. Basic App Configuration
- [ ] Set `APP_NAME` and `APP_DISPLAY_NAME`
- [ ] Set `ANDROID_APPLICATION_ID` and `IOS_BUNDLE_ID`
- [ ] Set `GRAPHQL_API_URL`

#### 2. iOS App Store (Choose ONE signing method)
- [ ] Set App Store Connect API Key variables and secret
- [ ] **Option A**: Set up Fastlane Match (recommended)
- [ ] **Option B**: Set up Xcode automatic signing

#### 3. Android Play Store
- [ ] Generate and encode Android keystore
- [ ] Set up Google Play service account
- [ ] Encode service account key

#### 4. Firebase Integration
- [ ] Download and encode Firebase config files
- [ ] Set up Google Sign-In credentials

---

## 🔍 Troubleshooting

### Common Issues

| Error | Solution |
|-------|----------|
| "No signing configured" | Set up iOS signing secrets (App Store Connect API Key + Match or Automatic) |
| "Missing GoogleService-Info.plist" | Add Firebase config files or build will proceed without Firebase |
| "Unknown IOS_BUILD_MODE" | Use `auto`, `simulator`, or `release` |
| "App Store Connect API key not configured" | Set `APP_STORE_CONNECT_API_KEY_ID`, `APP_STORE_CONNECT_ISSUER_ID`, and `APP_STORE_CONNECT_API_KEY_CONTENT_B64` |
| "Build number conflicts" | Use `build_number` input to override |
| "Missing google-services.json" | Add Firebase config file for Android Release builds |
| "No Google Play credentials" | Set up Google Play service account key |

### Debug Mode
- **iOS**: Use `ios_build_mode: simulator` for unsigned builds
- **Android**: Omit keystore secrets for debug builds

### Signing Methods Explained
- **App Store Connect API Key + Match**: Recommended for CI/CD (API key for uploads, Match for signing)
- **App Store Connect API Key + Automatic Signing**: Alternative using Xcode managed signing
- **Match**: Encrypted certificate repository for code signing
- **Automatic Signing**: Xcode managed signing (requires App Store Connect API Key + Team ID)

---

## 📝 Environment Variables (Auto-Generated)

These variables are automatically set by the workflows and don't need manual configuration:

| Variable | Set By | Description |
|----------|--------|-------------|
| `CI` | GitHub Actions | Indicates if running in CI environment |
| `GITHUB_RUN_NUMBER` | GitHub Actions | GitHub Actions run number for build numbering |
| `ANDROID_KEYSTORE_PATH` | GitHub Actions | Path to keystore file (when provided) |
| `GOOGLE_PLAY_JSON_PATH` | GitHub Actions | Path to Google Play service account JSON (when provided) |
| `IOS_BUILD_MODE` | Workflow Input | iOS build mode selection |
| `IOS_SIGNING_MODE` | Workflow Input | iOS signing method |
| `ANDROID_TRACK` | Workflow Input | Google Play track for beta lane |
| `RELEASE_STATUS` | Workflow Input | Play Store release status |
| `ANDROID_BUILD_TYPE` | Workflow Input | Android build type |
| `ANDROID_PACKAGING` | Workflow Input | Packaging format |
| `BUILD_NUMBER` | Workflow Input | Override build number |