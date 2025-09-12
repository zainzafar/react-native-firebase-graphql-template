# Fastlane Variables Reference

This document explains all the variables used in the Fastlane setup for iOS and Android builds. All variables are **optional** - the system will work with sensible defaults, but you can configure them for production builds and deployments.

## 📋 Quick Reference

- **GitHub Secrets**: Set in your repository's Settings → Secrets and variables → Actions
- **Environment Variables**: Set in `.env` file or GitHub Actions environment
- **Workflow Inputs**: Set when manually triggering workflows

---

## 🔧 GitHub Secrets

### App Configuration
| Secret | Description | Required For | Default |
|--------|-------------|--------------|---------|
| `APP_NAME` | Internal app name used in build scripts | All builds | `"App"` |
| `APP_DISPLAY_NAME` | User-facing app name displayed on device | All builds | `"App"` |
| `ANDROID_APPLICATION_ID` | Android package name (e.g., `com.company.app`) | Android builds | `"com.example.app"` |
| `IOS_BUNDLE_ID` | iOS bundle identifier (e.g., `com.company.app`) | iOS builds | `"com.example.app"` |
| `GRAPHQL_API_URL` | Backend GraphQL API endpoint URL | All builds | None |

### iOS Signing (Choose ONE method)

#### 1. App Store Connect API Key (Recommended)
| Secret | Description | Required For |
|--------|-------------|--------------|
| `ASC_KEY_ID` | App Store Connect API Key ID | iOS Release builds & TestFlight |
| `ASC_ISSUER_ID` | App Store Connect API Issuer ID | iOS Release builds & TestFlight |
| `ASC_KEY_CONTENTS` | App Store Connect API Key content (JSON) | iOS Release builds & TestFlight |

#### 2. Fastlane Match (Alternative)
| Secret | Description | Required For |
|--------|-------------|--------------|
| `MATCH_GIT_URL` | Git repository URL for certificates/profiles | iOS Release builds & TestFlight |
| `MATCH_PASSWORD` | Password for encrypted certificates repository | iOS Release builds & TestFlight |

### Android Signing
| Secret | Description | Required For |
|--------|-------------|--------------|
| `ANDROID_KEYSTORE_BASE64` | Base64-encoded keystore file | Android Release builds |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password | Android Release builds |
| `ANDROID_KEY_ALIAS` | Key alias in keystore | Android Release builds |
| `ANDROID_KEY_PASSWORD` | Key password | Android Release builds |

### Google Play Store (Choose ONE method)

#### 1. Base64-encoded Service Account Key (Recommended)
| Secret | Description | Required For |
|--------|-------------|--------------|
| `GOOGLE_PLAY_SERVICE_KEY_B64` | Base64-encoded Google Play service account JSON | Android Play Store uploads |

#### 2. Inline JSON Data (Alternative)
| Secret | Description | Required For |
|--------|-------------|--------------|
| `GOOGLE_PLAY_JSON_DATA` | Inline Google Play service account JSON | Android Play Store uploads |

### Google Services (Firebase)
| Secret | Description | Required For |
|--------|-------------|--------------|
| `GOOGLE_SERVICES_JSON_B64` | Base64-encoded google-services.json file | Android builds with Firebase |
| `GOOGLE_SERVICE_INFO_PLIST_B64` | Base64-encoded GoogleService-Info.plist file | iOS builds with Firebase |
| `GOOGLE_WEB_CLIENT_ID` | Google OAuth web client ID | iOS builds with Google Sign-In |
| `GOOGLE_REVERSED_CLIENT_ID` | Google OAuth reversed client ID | iOS builds with Google Sign-In |

---

## 🌍 Environment Variables

### Build Configuration
| Variable | Description | Set By | Default |
|----------|-------------|---------|---------|
| `CI` | Indicates if running in CI environment | GitHub Actions | `"true"` in CI |
| `GITHUB_RUN_NUMBER` | GitHub Actions run number for build numbering | GitHub Actions | Dynamic |
| `BUILD_NUMBER` | Override build number (manual input) | Workflow input | Auto-increment |

### iOS Build Mode
| Variable | Description | Values | Default |
|----------|-------------|---------|---------|
| `IOS_BUILD_MODE` | iOS build mode selection | `"auto"`, `"simulator"`, `"release"` | `"auto"` |

### Android Configuration
| Variable | Description | Set By | Default |
|----------|-------------|---------|---------|
| `ANDROID_KEYSTORE_PATH` | Path to keystore file | GitHub Actions | `"android/app/release.keystore"` |
| `GOOGLE_PLAY_JSON_PATH` | Path to Google Play service account JSON (auto-generated from [Base64-encoded Service Account Key](#1-base64-encoded-service-account-key-recommended)) | GitHub Actions | Auto-generated |
| `GOOGLE_PLAY_JSON_DATA` | Inline Google Play service account JSON (auto-generated from [Base64-encoded Service Account Key](#1-base64-encoded-service-account-key-recommended)) | GitHub Actions | Auto-generated |
| `RELEASE_STATUS` | Play Store release status | Workflow input | `"draft"` |

---

## 🎛️ Workflow Inputs

### iOS Workflow (`ios.yml`)
| Input | Description | Options | Default |
|-------|-------------|---------|---------|
| `lane` | Fastlane lane to execute | `"build"`, `"beta"` | `"build"` |
| `ios_build_mode` | Force specific iOS build mode | `"auto"`, `"simulator"`, `"release"` | `"auto"` |
| `build_number` | Override build number | Any integer | Auto-increment |

### Android Workflow (`android.yml`)
| Input | Description | Options | Default |
|-------|-------------|---------|---------|
| `lane` | Fastlane lane to execute | `"build"`, `"beta"` | `"build"` |
| `track` | Google Play track for beta lane | `"internal"`, `"alpha"`, `"beta"`, `"production"` | `"internal"` |
| `release_status` | Play Store release status | `"draft"`, `"completed"` | `"draft"` |
| `build_number` | Override build number | Any integer | Auto-increment |

---

## 📱 Build Modes & Behaviors

### iOS Build Modes
- **`auto`**: Automatically chooses based on signing availability
  - If signing configured → `release` (signed archive)
  - If no signing → `simulator` (debug build)
- **`simulator`**: Debug build for iOS Simulator (no signing required)
- **`release`**: Signed archive for App Store/TestFlight (requires signing)

### Android Build Types
- **Debug**: Built when no keystore is provided
- **Release**: Built when keystore is available

---

## 🔄 Build Number Logic

### iOS
1. **Manual override**: If `BUILD_NUMBER` is set, use that value
2. **CI with signing**: Fetch latest TestFlight build number + 1
3. **Fallback**: Auto-increment from Xcode project

### Android
1. **Manual override**: If `BUILD_NUMBER` is set, use that value
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

### Production Setup
1. **Set basic app info**:
   ```
   APP_NAME=MyApp
   APP_DISPLAY_NAME=My App
   ANDROID_APPLICATION_ID=com.mycompany.myapp
   IOS_BUNDLE_ID=com.mycompany.myapp
   ```

2. **For iOS App Store**:
   - Set up App Store Connect API Key (`ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_KEY_CONTENTS`)
   - Or use Fastlane Match (`MATCH_GIT_URL`, `MATCH_PASSWORD`)

3. **For Android Play Store**:
   - Set up keystore (`ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`)
   - Set up Google Play service account (`GOOGLE_PLAY_SERVICE_KEY_B64`)

4. **For Firebase**:
   - **Android**: Set `GOOGLE_SERVICES_JSON_B64` with your google-services.json
   - **iOS**: Set `GOOGLE_SERVICE_INFO_PLIST_B64` with your GoogleService-Info.plist
   - Set `GRAPHQL_API_URL` for your backend

---

## 🔍 Troubleshooting

### Common Issues
- **"No signing configured"**: Set up iOS signing secrets
- **"Missing google-services.json"**: Add Firebase config files or the build will proceed without Firebase
- **"Unknown IOS_BUILD_MODE"**: Use `auto`, `simulator`, or `release`
- **Build number conflicts**: Use `BUILD_NUMBER` input to override

### Debug Mode
- iOS: Use `ios_build_mode: simulator` for unsigned builds
- Android: Omit keystore secrets for debug builds
