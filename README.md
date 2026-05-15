# OpenMusic

[![CI](https://github.com/faiz2/OpenMusic/actions/workflows/ci.yml/badge.svg)](https://github.com/faiz2/OpenMusic/actions/workflows/ci.yml)
[![Tests](https://img.shields.io/badge/tests-Jest-2e93ff?logo=jest)](https://github.com/faiz2/OpenMusic/actions/workflows/ci.yml)
[![Build Check](https://img.shields.io/badge/build%20check-passing-brightgreen)](https://github.com/faiz2/OpenMusic/blob/main/scripts/build-check.js)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Expo](https://img.shields.io/badge/Expo-SDK%2054-000020?logo=expo&logoColor=white)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB?logo=react&logoColor=black)](https://reactnative.dev/)
[![Coverage](https://img.shields.io/badge/coverage-npm%20run%20test%3Acoverage-lightgrey)](./package.json)

> Replace `faiz2/OpenMusic` in badge URLs with your GitHub `owner/repo` after you fork or publish.

OpenMusic is a mobile music app built with React Native and Expo. Browse charts, search for songs, build a queue, and listen with a full-screen player and a mini player that stays above the tab bar while you explore. The UI is dark-first, purple-accented, and meant to feel closer to a streaming app than a demo.

Audio is powered by a backend that wraps JioSaavn-style metadata and stream URLs. The app does not ship its own music library—it talks to an API you configure.

## What you can do

- **Home** — Trending picks, quick-play grids, top charts, and curated rows (romantic, Punjabi, and more).
- **Search** — Live suggestions, genre shortcuts, and full result lists.
- **Library** — Your current queue plus recently played tracks (saved on device).
- **Player** — Play/pause, skip, seek, shuffle, repeat (off / all / one), and a peek at what’s up next.
- **Charts & playlists** — Open a chart or playlist and play or shuffle the whole list.

Background playback is supported on iOS and Android so music can keep going when you leave the app.

## Tech stack

| Layer | Choice |
|--------|--------|
| Framework | Expo SDK 54, React Native 0.81, React 19 |
| Navigation | React Navigation (tabs + stack) |
| Server state | TanStack React Query |
| Player state | Zustand + Expo AV |
| Persistence | AsyncStorage (recent plays) |
| i18n | i18next + expo-localization |
| HTTP | Axios |
| Tests | Jest, React Native Testing Library |

TypeScript is used throughout. Navigation routes and params are typed so refactors are less painful.

## Requirements

- **Node.js** 18+ (20 LTS recommended)
- **npm** or **yarn**
- For device testing: [Expo Go](https://expo.dev/go) on your phone, or Android Studio / Xcode for emulators and production builds

## Getting started

Clone the repo and install dependencies:

```bash
git clone https://github.com/your-username/OpenMusic.git
cd OpenMusic
npm install --legacy-peer-deps
```

`--legacy-peer-deps` avoids a peer-resolution quirk between React 19 and some test packages. If a plain `npm install` works on your machine, you can skip the flag.

Copy the environment template and adjust if needed:

```bash
cp .env.example .env
```

By default the app points at the public API URL in `.env.example`. Change `EXPO_PUBLIC_API_BASE_URL` if you run your own backend.

Start the dev server:

```bash
npx expo start
```

Then press `i` for iOS simulator, `a` for Android, or scan the QR code with Expo Go.

### Optional: crash reporting

Add a Sentry DSN to `.env`:

```env
EXPO_PUBLIC_SENTRY_DSN=https://your-key@sentry.io/your-project
```

If it’s empty, the app still runs—errors are only reported in development logs and through the in-app error boundary.

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start Expo dev server |
| `npm run android` | Open on Android |
| `npm run ios` | Open on iOS |
| `npm run web` | Run in the browser (limited audio behavior) |
| `npm test` | Run all unit tests (Jest) |
| `npm run test:watch` | Tests in watch mode |
| `npm run test:coverage` | Tests with coverage report |
| `npm run test:build` | Run only build-check tests |
| `npm run typecheck` | TypeScript check without emitting files |
| `npm run build:check` | Validate project structure + `tsc` (CI build gate) |
| `npm run ci` | Full pipeline: typecheck → tests → build check |

## Project layout

```
App.tsx                 # Root providers, offline banner, query client
src/
  api/                  # JioSaavn API client and types
  components/           # TrackCard, MiniPlayer, charts, errors, etc.
  config/               # Env (API URL, Sentry)
  hooks/                # Network status
  i18n/                 # Translations (en today, easy to extend)
  navigation/           # Navigators, types, deep-link config
  screens/              # Home, Search, Library, Player, …
  services/             # Monitoring / global error handling
  store/                # Player + recent-play Zustand stores
  theme/                # Colors and typography
  utils/                # Small shared helpers
__tests__/              # Jest tests
```

Native `ios/` and `android/` folders are generated by Expo prebuild and are gitignored. Run `npx expo prebuild` when you need a bare workflow or store builds.

## Deep linking

The app registers the custom scheme `openmusic://` and paths such as:

- `openmusic://home`
- `openmusic://search`
- `openmusic://player`
- `openmusic://playlist/:id`
- `openmusic://charts`

Universal links are configured for `https://openmusic.app` in `app.json`; you’ll need to host the associated domain files on that domain for production verification.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `EXPO_PUBLIC_API_BASE_URL` | No | API base URL (default in `.env.example`) |
| `EXPO_PUBLIC_SENTRY_DSN` | No | Sentry DSN for crash reporting |

Only `EXPO_PUBLIC_*` variables are embedded in the client bundle—never put secrets there.

## Testing

![Test suites](https://img.shields.io/badge/tests-45%20passing-brightgreen)
![Test suites](https://img.shields.io/badge/suites-12-blue)
![Build gate](https://img.shields.io/badge/build%20gate-tsc%20%2B%20structure-success)

Run everything locally (same as CI):

```bash
npm run ci
```

Or run steps individually:

```bash
npm test                 # All Jest tests
npm run test:build       # Build-check tests only
npm run build:check      # Structure + TypeScript (no Jest)
npm run test:coverage    # Tests with coverage table
```

### What is covered

| Suite | What it checks |
|--------|----------------|
| `__tests__/build/` | **Build check** — required files, `app.json` / `package.json`, strict TS, `tsc --noEmit` |
| `__tests__/api/` | API validation, HTTP success paths, proxy URL, error mapping |
| `__tests__/store/` | Player store actions, recent-play persistence |
| `__tests__/utils/` | Stream cache expiry, shuffle index, a11y helpers |
| `__tests__/config/` | Environment URL / Sentry DSN parsing |
| `__tests__/navigation/` | Deep-link prefixes and screen paths |
| `__tests__/components/` | `SectionHeader`, `QueryErrorView`, `TrackCard` |

Tests use mocks for Expo AV, AsyncStorage, NetInfo, and native UI modules so they run in Node without a simulator—suitable for GitHub Actions and pre-push checks.

### CI

On every push/PR to `main` or `master`, [`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs:

1. `npm run typecheck`
2. `npm test -- --ci --coverage`
3. `npm run build:check`

## Building for stores

This project uses the managed Expo workflow. Typical flow:

```bash
npx expo prebuild
eas build --platform all
```

You’ll need your own Apple/Google credentials, bundle IDs (`com.openmusic.app` in `app.json`), and signing setup. Background audio and foreground service permissions are already declared for playback.

## API note

Streaming depends on the configured backend (default: Hugging Face Space in `.env.example`). Rate limits, URL expiry, and regional availability are controlled by that service—not by this app. The player caches signed stream URLs briefly and falls back to a proxy play URL when direct fetches fail.

## Contributing

Issues and pull requests are welcome. Run `npm run ci` before opening a PR. Keep changes focused; this codebase was audited for production hygiene and prefers small, clear diffs over drive-by refactors.

## License

See [LICENSE](LICENSE) in the repository root.
