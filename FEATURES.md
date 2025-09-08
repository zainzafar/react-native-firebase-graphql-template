## Template Features

This React Native 0.81 template ships with a production-ready mobile app and a Node.js GraphQL API. It includes Firebase Auth, RBAC with delegation, Apollo Client/Server, Prisma + Postgres, and an impersonation flow.

### Mobile (React Native, TypeScript)
- Authentication: Email/password, Google, Apple (iOS), phone; Firebase via `@react-native-firebase/*`
- Apollo Client with token refresh, x-impersonation header, Android localhost remap
- Redux Toolkit store with persistence; auth, offline slices and selectors
- Impersonation: secure token storage, `getEffectiveToken()`, admin UI disabled while impersonating
- Navigation: native stack + bottom tabs; admin routes gated by permissions
- Offline UX: basic banner slice; safe rendering during network flaps
- Theming: base theme, components, icons
- TypeScript: strict config via `@react-native/typescript-config`

Scripts (mobile/package.json)
- android, ios, start, clean, lint, typecheck, test
- bundle:ios, bundle:android

Environment
- Use `react-native-config` keys: `GRAPHQL_API_URL`, `GOOGLE_WEB_CLIENT_ID`, `ANDROID_APPLICATION_ID`, `APP_DISPLAY_NAME`
- Place Firebase native files in platform folders (see README) and keep out of VCS

### API (Node 20, Express 5, Apollo Server 5)
- GraphQL server with modular typeDefs/resolvers
- Firebase Admin auth; app JWT signed with Firebase-aligned expiry
- RBAC with single-role model, direct permissions, and delegation matrices
- Prisma schema with indexes and constraints; migrations ready
- App release rules (min/latest/enforced) with resolvers

Scripts (api/package.json)
- dev (nodemon), build (prisma generate + compile + copy SDL), start, typecheck
- prisma:generate, prisma:migrate, seed

Environment
- Required: `DATABASE_URL`, `JWT_SECRET`
- Optional (Firebase Admin): `FIREBASE_SERVICE_ACCOUNT` (base64 JSON), or `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
- Optional web config endpoint: `FIREBASE_WEB_CONFIG`

### Impersonation Flow
1) Admin calls `startImpersonation` mutation → receives short-lived impersonation token + target user
2) Mobile stores token securely; `getEffectiveToken()` returns impersonation token when present
3) Apollo sets `authorization` and `x-impersonation: true` only when impersonating
4) Admin UI is hidden while impersonating (route guards + selectors). End impersonation restores original user. Consider calling `resetApollo()` on begin/end to prevent data bleed

### RBAC/Permissions
- Single role per user; direct user permissions
- Delegation matrices with wildcard (ALL) and specific rules for roles/permissions
- Validation utilities prevent escalation when assigning roles/permissions

### CI
- GitHub Actions runs API build/typecheck and Mobile lint/typecheck/tests on push/PR

### Quick Start
See README for setup, environment, Firebase config placement, and running both services.

