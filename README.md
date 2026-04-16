<div align="center">

# React Native + Firebase + GraphQL Template

**A production-grade, full‑stack starter for shipping real mobile products.**

A React Native 0.84 app and a Node.js GraphQL API — wired together with Firebase Authentication, a Postgres‑backed RBAC engine, impersonation, a force‑update gate, and end‑to‑end CI/CD to TestFlight and Google Play.

[![Build](https://github.com/zainzafar/react-native-firebase-graphql-template/actions/workflows/ci.yml/badge.svg)](https://github.com/zainzafar/react-native-firebase-graphql-template/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
![React Native](https://img.shields.io/badge/React%20Native-0.84-61DAFB?logo=react)
![Node](https://img.shields.io/badge/Node-22-339933?logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Auth-FFCA28?logo=firebase&logoColor=black)
![GraphQL](https://img.shields.io/badge/GraphQL-Apollo-E10098?logo=graphql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-Postgres-2D3748?logo=prisma&logoColor=white)

[Features](#-whats-inside) · [Architecture](#-architecture) · [Quick Start](SETUP.md) · [Variables](VARIABLES.md) · [Contributing](CONTRIBUTING.md)

</div>

---

## Why this template?

Most starter kits give you a login screen. This one gives you the **day‑two plumbing** you would otherwise spend months building: a real permission model, impersonation for support teams, staged rollouts with force‑update, GraphQL codegen across the stack, and a CI pipeline that actually ships to TestFlight and Google Play.

It is opinionated on purpose — so you can delete what you don't need instead of inventing it.

> **Who this is for:** indie hackers and teams building a B2C/B2B mobile product who want a correct, secure foundation from day one, and developers who want to *learn* how a modern full‑stack mobile app is wired end‑to‑end.

---

## What's inside

### Mobile — `mobile/`
- **React Native 0.84 + React 19 + TypeScript (strict)** with the New Architecture ready stack
- **Firebase Authentication** — Email/Password, Google, Apple (iOS), and Phone/SMS, all behind one `AuthProvider`
- **Apollo Client 4** with automatic token refresh, an `x-impersonation` header, and an Android `localhost` remap for simulators
- **Redux Toolkit + redux‑persist** — auth state, offline banner, selectors and typed hooks
- **React Navigation 7** — native stack + bottom tabs, with **permission‑gated admin routes**
- **GraphQL Codegen** generates fully‑typed operations and hooks from `.graphql` files
- **Theme system** with auto‑discovery of theme folders (light / dark / your own)
- **Offline UX** via `@react-native-community/netinfo` with a banner and safe rendering during flaps
- **Impersonation** — secure token storage via `react-native-keychain`, `getEffectiveToken()`, and admin UI hidden while impersonating
- **App version gate** — bottom sheet that softly or forcibly asks users to update based on server rules
- **Debug screen** — device info, token inspection, and environment details for triage

### API — `api/`
- **Node 22 + Express 5 + Apollo Server 5** with a modular, file‑based resolver loader
- **Prisma 6 + PostgreSQL** — migrations, indexes, and type‑safe resolvers via Prisma mappers
- **Firebase Admin** verifies ID tokens → the API issues a short‑lived app JWT aligned with the Firebase expiry
- **RBAC with delegation matrices** — single role per user, direct per‑user overrides, and a wildcard‑capable "who can grant what to whom" model
- **Impersonation mutation** that only super‑privileged users can call, with a reduced‑TTL token
- **App Release Rules** — per‑platform `minVersion` / `latestVersion` / `enforced` with optional store URLs
- **GraphQL Codegen** for both **server resolvers** (with Prisma types) and the **mobile client** — one source of truth

### CI/CD — `.github/workflows/`
- **`ci.yml`** — lint, typecheck, build, and test API + mobile on every PR and push to `main`
- **`ios.yml`** — Fastlane lanes for simulator debug, signed release, and TestFlight upload. Signing via **Match** *or* Xcode automatic. Build numbers auto‑fetched from App Store Connect.
- **`android.yml`** — Fastlane lanes for APK/AAB, flavorless builds driven by env, keystore from base64 secret, Play Store upload with selectable track and release status. Version codes auto‑fetched from Play.
- Every workflow uploads **downloadable artifacts** (IPA, dSYM, APK, AAB, mapping.txt).

---

## Architecture

```
┌─────────────────────────┐         ┌─────────────────────────────────────┐
│      Mobile App         │         │          GraphQL API                │
│  React Native 0.84      │         │    Node 22 · Express 5 · Apollo 5   │
│                         │         │                                     │
│  ┌───────────────────┐  │         │  ┌───────────────────────────────┐  │
│  │   AuthProvider    │──┼── idToken ─┤ loginWithIdToken              │  │
│  │ Firebase SDK      │  │         │  │ (Firebase Admin verifies)     │  │
│  └─────────┬─────────┘  │         │  └──────────────┬────────────────┘  │
│            │ app JWT    │         │                 │ signs app JWT     │
│  ┌─────────▼─────────┐  │         │  ┌──────────────▼────────────────┐  │
│  │  Apollo Client    │──┼── Bearer + x-impersonation?                 │  │
│  │  (with token      │  │         │  │       Apollo Server           │  │
│  │   refresh)        │  │         │  │                               │  │
│  └─────────┬─────────┘  │         │  │  Resolvers ── RBAC guard ──┐  │  │
│            │            │         │  │                            │  │  │
│  ┌─────────▼─────────┐  │         │  │  ┌─────────────────────────▼──┴────┐
│  │ Redux (Toolkit)   │  │         │  │  │   Prisma 6 · PostgreSQL         │
│  │ persist · offline │  │         │  │  │   Users · Roles · Permissions   │
│  │ impersonation     │  │         │  │  │   GrantRules · AppVersionRules  │
│  └───────────────────┘  │         │  │  └─────────────────────────────────┘
│                         │         │  └────────────────────────────────┘  │
│  React Navigation 7     │         │                                     │
│  (admin routes gated    │         │         GraphQL Codegen              │
│   by permissions)       │──────────┼── shared types & operations ◄──────┤
└─────────────────────────┘         └─────────────────────────────────────┘
                                                   │
                                     ┌─────────────┴──────────────┐
                                     │        Firebase             │
                                     │   Auth · Admin SDK · Users  │
                                     └─────────────────────────────┘
```

**Auth flow in one paragraph.** The app signs in with Firebase (email, Google, Apple, or phone) and receives a Firebase ID token. It sends that token to the API's `loginWithIdToken` mutation, which verifies it with Firebase Admin, upserts a `User` row in Postgres, and returns a signed **app JWT** whose expiry matches the Firebase token. Apollo Client then attaches that JWT to every request. When an admin *impersonates* another user, a second short‑lived token is issued and stored separately; `getEffectiveToken()` returns it instead, and the `x-impersonation: true` header tells the server to scope the request accordingly.

---

## What you'll learn

Reading this repo top‑to‑bottom is a crash course in building a correct mobile product:

| Concept | Where to look |
|---|---|
| Unified auth across 4 providers with one provider component | `mobile/src/auth/AuthProvider.tsx` |
| Secure token storage, refresh, and impersonation swapping | `mobile/src/auth/tokenStorage.ts`, `session.ts` |
| GraphQL Codegen for resolvers **and** client hooks | `api/codegen.yml` |
| Modular resolver loading by file convention | `api/src/graphql/loadResolvers.ts` |
| RBAC with role ownership and **delegation matrices** (scope = `ALL` wildcard) | `api/src/graphql/rbac/*` |
| Permission‑gated navigation with route guards | `mobile/src/navigation/RootNavigator.tsx` |
| Server‑driven force‑update UX | `mobile/src/update/*`, `api/prisma/schema.prisma` (`AppVersionRule`) |
| Flavorless Android builds driven by env | `mobile/android/app/build.gradle`, `scripts/run-android.sh` |
| Fastlane lanes that dual‑mode between simulator and release | `mobile/fastlane/Fastfile` |
| Typed offline state machine with Redux + netinfo | `mobile/src/store/offlineSlice.ts` |

---

## Tech stack

<table>
<tr>
<td valign="top" width="50%">

**Mobile**
- React Native 0.84 · React 19 · TypeScript 5.9
- `@react-native-firebase/*` v23 (auth, app)
- Google Sign‑In · Apple Authentication · libphonenumber‑js
- Apollo Client 4 · GraphQL Codegen
- Redux Toolkit 2 · redux‑persist · RxJS
- React Navigation 7 (stack + tabs)
- react‑native‑keychain · react‑native‑config
- react‑native‑device‑info · react‑native‑vector‑icons

</td>
<td valign="top" width="50%">

**API**
- Node 22 · Express 5 · Apollo Server 5
- Prisma 6 · PostgreSQL
- Firebase Admin 13 · jsonwebtoken
- GraphQL Codegen 6 (server + client)

**Tooling & CI**
- GitHub Actions (CI + iOS + Android)
- Fastlane (Match, Pilot, Supply, `copy_artifacts`)
- ESLint + Prettier + Jest
- Comprehensive `scripts/cleanup.sh`

</td>
</tr>
</table>

---

## Quick start

> For the complete walk‑through (Firebase console, App Store Connect, Play Console, SHA keys, signing, and CI secrets) see **[SETUP.md](SETUP.md)**.

```bash
# 1. Clone
git clone https://github.com/zainzafar/react-native-firebase-graphql-template.git
cd react-native-firebase-graphql-template

# 2. API — Postgres required
cd api
cp .env.example .env            # edit DATABASE_URL, APP_JWT_SECRET, Firebase admin creds
npm install
npx prisma migrate dev
npm run dev                     # http://localhost:3000/graphql

# 3. Mobile
cd ../mobile
cp .env.example .env            # edit IOS_BUNDLE_ID, ANDROID_APPLICATION_ID, GRAPHQL_API_URL, Google IDs
npm install --legacy-peer-deps
# drop in your Firebase config files:
#   mobile/ios/GoogleService-Info.plist
#   mobile/android/app/google-services.json
cd ios && pod install && cd ..
npm run ios        # or: npm run android
```

**Assumptions.** Two apps per store (staging + production) with distinct bundle/package IDs, both driven by env — no Android flavors, no Xcode schemes to juggle. See [SETUP.md §Template Assumptions](SETUP.md#template-assumptions).

---

## Repository layout

```
.
├── api/                        Node + Apollo + Prisma GraphQL server
│   ├── prisma/                 schema.prisma, migrations, seed
│   └── src/
│       ├── graphql/
│       │   ├── rbac/           core, delegation, validation, capabilities
│       │   ├── resolvers/      mutations/ queries/ types/ (file-based loader)
│       │   └── types/          *.graphql SDL (base, auth, admin, appSettings)
│       ├── services/           firebaseAdmin, appJwt, prisma
│       └── routes/             health, root
│
├── mobile/                     React Native app
│   ├── android/ · ios/         native projects (flavorless)
│   ├── fastlane/               Fastfile, Appfile, Matchfile
│   ├── scripts/                cleanup.sh, run-android.sh, generate-themes.js
│   └── src/
│       ├── auth/               AuthProvider, tokenStorage, session, secureStorage
│       ├── components/         Button, Screen, ImpersonationBanner, ui primitives
│       ├── features/auth/      authSlice, selectors, hooks, permission helpers
│       ├── graphql/            client, operations, mutations, queries
│       ├── navigation/         RootNavigator (permission-gated)
│       ├── screens/
│       │   ├── AuthScreen/     Email + Phone forms
│       │   └── Admin/          Users · Roles · Delegation · AppReleases · Debug
│       ├── store/              Redux store, persist, offlineSlice
│       ├── theme/              base + light/dark, ThemeProvider
│       └── update/             force-update bottom sheet + version utils
│
├── .github/workflows/          ci.yml, ios.yml, android.yml
├── SETUP.md                    step-by-step setup for both platforms + CI
├── VARIABLES.md                every secret / variable / workflow input, explained
├── FEATURES.md                 feature matrix
├── CONTRIBUTING.md             how to contribute
└── SECURITY.md                 vulnerability reporting
```

---

## Deep dives

### 1. Authentication — one `AuthProvider` to rule them all

`mobile/src/auth/AuthProvider.tsx` exposes a single context with `signInWithEmail`, `signInWithGoogle`, `signInWithApple`, `signInWithPhone` + `confirmPhoneCode`, plus `updatePassword` and `signOut`. Cancellations from Google and Apple are treated as **non‑errors**. On Firebase auth state change, the provider exchanges the fresh Firebase ID token for an app JWT, stores it, and hydrates Redux with the DB user (including permissions and role).

Email enumeration protection is disabled in Firebase to allow a **unified sign‑up/sign‑in** flow — see [SETUP.md](SETUP.md#disable-email-enumeration-protection) for why and how.

### 2. RBAC with delegation matrices

Most RBAC systems answer *"does this user have permission X?"*. This one also answers *"is this user allowed to **grant** role/permission Y to user Z?"* — which is the actual question every real admin panel needs.

- **User → Role** (1:1 via `UserRole`)
- **User → Permission** (direct grants via `UserPermission`, bypassing role)
- **Role → Permission** (via `RolePermission`)
- **Role → Role grant rules** (`RoleGrantRule`, scope = `ROLE` or `ALL`) — "admins can grant the `support` role"
- **Role → Permission grant rules** (`PermissionGrantRule`, scope = `PERMISSION` or `ALL`) — "admins can grant any permission directly"

Wildcard rules use `scope = ALL` with a `NULL` target. Validation utilities prevent **privilege escalation**: you cannot grant what you cannot grant yourself.

### 3. Impersonation — designed for support teams

A super‑admin calls `startImpersonation(userId)` → receives a short‑lived token plus the target user. The mobile app:
1. Stores the impersonation token separately from the primary token.
2. `getEffectiveToken()` returns the impersonation token when present, so Apollo transparently scopes requests.
3. Sets `x-impersonation: true` so the server can audit and refuse sensitive mutations.
4. Hides all admin UI via route guards and selectors while impersonating.
5. Calls `resetApollo()` on begin/end of impersonation to avoid cache bleed.

### 4. Force‑update gate

The API stores `AppVersionRule` rows per platform (`ios`, `android`) with `minVersion`, `latestVersion`, `enforced`, `message`, and `storeUrl`. The mobile `useAppUpdateGate` hook compares the installed version and shows an **`UpdateBottomSheet`** that can be dismissable (soft) or blocking (hard). Managed from the in‑app **Admin → App Releases** screen.

### 5. CI/CD that actually ships

- **Smart build numbers.** iOS fetches the latest TestFlight build number and adds 1. Android fetches the latest Play Store version code and adds 1. Both fall back gracefully when credentials are missing.
- **Dual‑mode builds.** The `build` lane chooses simulator (debug) or signed release based on whether signing credentials exist. No separate workflows to maintain.
- **Flexible signing.** iOS supports **Fastlane Match** *or* Xcode automatic signing, chosen via the `ios_signing_mode` input.
- **Artifacts.** Every CI run uploads downloadable IPAs, APKs, AABs, dSYMs, and ProGuard mappings.

See **[VARIABLES.md](VARIABLES.md)** for the full matrix of secrets, variables, and workflow inputs.

---

## Customizing it for your product

- **Rename** — update `APP_NAME`, `APP_DISPLAY_NAME`, `IOS_BUNDLE_ID`, `ANDROID_APPLICATION_ID` in your `.env` files and GitHub repo variables.
- **Add screens** — place them in `mobile/src/screens/`, register in `RootNavigator.tsx`, gate with `usePermissions()` if needed.
- **Add a resolver** — drop a file under `api/src/graphql/resolvers/queries/` or `mutations/`, and an SDL snippet in `api/src/graphql/types/`. Both are auto‑loaded. Run `npm run codegen` to regenerate types for the mobile client.
- **Add a theme** — create `mobile/src/theme/<your-theme>/` then run `npm run generate-themes`. The `ThemeProvider` will discover it automatically.
- **Add a permission** — insert it in `api/prisma/seed.ts`, migrate, and reference it in the mobile `usePermissions` hook.

---

## Scripts cheatsheet

**Mobile** (`cd mobile`)

| Script | What it does |
|---|---|
| `npm run ios` / `android` | Run on simulator/emulator |
| `npm start` | Metro bundler |
| `npm run lint` / `typecheck` / `test` | Quality gates (what CI runs) |
| `npm run clean` / `clean:deep` / `clean:ios` / `clean:android` | The cleanup script you'll actually use |
| `npm run generate-types` | Pull latest types from the API via codegen |
| `npm run generate-themes` | Re-index theme folders |
| `npm run bundle:ios` / `bundle:android` | Create an offline JS bundle |

**API** (`cd api`)

| Script | What it does |
|---|---|
| `npm run dev` | Nodemon + codegen in watch mode |
| `npm run build` | `prisma generate` + codegen + `tsc` + copy SDL |
| `npm run typecheck` | Fast type check |
| `npm run prisma:migrate` / `prisma:generate` | Database migrations and client |
| `npm run seed` | Seed permissions/roles; use `SEED_SUPER_ADMIN_EMAIL=…` to promote a super admin |
| `npm run codegen` / `codegen:watch` | Regenerate types for API + mobile client |

---

## Documentation

- **[SETUP.md](SETUP.md)** — 20+ steps covering App Store Connect, Play Console, Firebase, SHA keys, env files, API, seeds, and CI
- **[VARIABLES.md](VARIABLES.md)** — every secret, variable, and workflow input, with where to get it
- **[FEATURES.md](FEATURES.md)** — concise feature matrix
- **[mobile/theme.md](mobile/theme.md)** — theme composition, overrides, and type safety
- **[CONTRIBUTING.md](CONTRIBUTING.md)** · **[SECURITY.md](SECURITY.md)**

---

## Roadmap ideas

This template gives you the foundation; here are natural extensions to build on top:

- Push notifications (FCM/APNs) with topic‑based targeting
- Stripe or RevenueCat for subscriptions
- File uploads via signed S3/CloudFront URLs
- Feature flags (GrowthBook, PostHog)
- E2E tests with Detox
- Sentry / PostHog analytics wiring

PRs welcome — see **[CONTRIBUTING.md](CONTRIBUTING.md)**.

---

## Security

This repository contains **zero real credentials**. Firebase config files and keystores must be provided by you, locally or via CI secrets. If you discover a vulnerability, please disclose responsibly — see **[SECURITY.md](SECURITY.md)**.

---

## License

[MIT](LICENSE) — free for educational and commercial use. Please comply with Firebase and platform terms of service.

---

<div align="center">

If this template saved you weeks of work, consider giving it a ⭐ — it helps other developers find it.

**Built for people who ship.**

</div>
