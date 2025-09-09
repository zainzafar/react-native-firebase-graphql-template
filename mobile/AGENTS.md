# Agent Guide — Mobile (React Native + TypeScript)

## Project Shape
- **Type:** React Native app using TypeScript  
- **Entry:** `index.js` → `App.tsx`  
- **Native projects:** `ios/` (Xcode) and `android/` (Gradle). *Avoid editing native code unless strictly necessary.*  
- **Package manager:** npm only (`package-lock.json` present).  

## How to Run
- **iOS:** `npm run ios`  
- **Android:** `npm run android`  
- **Metro bundler:** `npm start`  

## Conventions
- Prefer **functional components** and **React hooks**.  
- Strongly type **props** and **state**; use `.tsx` / `.ts`.  
- Create platform-specific files (`*.ios.tsx`, `*.android.tsx`) only when absolutely required.  
- Co-locate styles; use `StyleSheet` or the existing styling system.  
- Keep state **simple**; introduce global state only if explicitly requested.  

## Assets & Modules
- Use `assets/` for images; import via `require` or URI.  
- Avoid Node-only APIs; use **React Native–compatible** libraries.  
- For native modules:
  - Run `pod install` in `ios/` after changes.  
  - Ensure Android builds cleanly.  
  - Do **not** commit build outputs.  

## Boundaries
- Scope changes to `mobile/` only.  
- Never commit:
  - `node_modules/`  
  - `ios/build/`, `DerivedData/`  
  - `android/build/`  
  - `.metro-cache/`  
- Keep `.env` out of git; maintain a `.env.example`.  
- When given a task, **focus only on that task**; avoid unrelated changes.  
- If these rules need updating to reflect reality, update **this file** as part of the task.  

## Navigation & Structure
- For navigation, use **React Navigation**.  
- Keep navigators in `navigation/`.  
- Place screens in `screens/` and components in `components/`.  
- Share logic via `hooks/` or `services/`.  

## Testing
- Use **Jest** + `@testing-library/react-native`.  
- Place tests under `__tests__/` or alongside source files.  

## Code Style
- Respect **eslint**/**prettier** configs; avoid unrelated formatting changes.  
- Prioritize readability; avoid deep prop drilling → prefer context/hooks.  
- **Critical styling rules:**  
  - ❌ Never use raw typography, colors, or spacing directly in `StyleSheet.create` (will cause linter errors).  
  - ✅ Always use **inline style arrays** with theme values first, local styles second.  
  - Example:  
    ```tsx
    style={[
      { color: colors.text, fontSize: typography.sizes.body },
      styles.localStyle
    ]}
    ```  

## App Build
- After making code changes, **do not trigger a full build** unless necessary.