# Contributing to OpenMusic

Thanks for taking the time to look into contributing. This is a personal project but outside help is genuinely welcome, whether that's a bug report, a small fix, or a bigger feature idea. This document covers how things work so you're not flying blind.

---

## Before you start

It's worth opening an issue before writing code for anything non-trivial. Not because there's a formal approval process, but because it saves you from spending time on something that's already in progress, already been decided against, or that needs a bit of design discussion first. For small things like typos, obvious bugs, or minor UI polish, just go ahead and open a PR directly.

---

## Setting up locally

You'll need Node 18 or newer (20 LTS is what CI uses). Clone the repo, install dependencies, and copy the env file:

```bash
git clone https://github.com/Mohammad-Faiz-Cloud-Engineer/OpenMusic.git
cd OpenMusic
npm install --legacy-peer-deps
cp .env.example .env
```

The `--legacy-peer-deps` flag is there because React 19 has a peer conflict with some test packages. If a plain `npm install` works on your machine, that's fine too.

Start the dev server:

```bash
npx expo start
```

Press `a` for Android, `i` for iOS simulator, or scan the QR code with Expo Go on your phone.

---

## How the codebase is laid out

A quick orientation so you know where to look:

```
App.tsx              Root providers and app shell
src/
  api/               JioSaavn API client, types, input validation
  components/        Shared UI (TrackCard, MiniPlayer, SkeletonCard, etc.)
  config/            Environment variable parsing and validation
  hooks/             Small reusable hooks (network status, etc.)
  i18n/              Translations, currently English only
  navigation/        Stack + tab navigators, deep-link config, route types
  screens/           One file per screen
  services/          Monitoring / global error handler (Sentry wrapper)
  store/             Zustand stores (player, likes, recent plays, playlists, settings)
  theme/             Color tokens and useTheme hook
  utils/             Small helpers (a11y, devLog, playerUtils, storageTrack)
__tests__/           Jest tests, mirroring the src structure
```

The player is the most complex part. `playerStore.ts` owns all playback logic including queue management, stream URL caching, shuffle/repeat, and the expo-av sound instance. If you're touching anything audio-related, read through that file first.

---

## Making changes

A few things that keep the codebase consistent:

**TypeScript** - strict mode is on. Don't use `any` unless there's a genuinely good reason, and if there is, leave a comment explaining it.

**Styles** - styles live inside `useMemo` blocks that depend on the current theme colors. This is intentional; it keeps dark/light mode working correctly without a separate stylesheet per theme. Follow the same pattern when adding new UI.

**Stores** - the Zustand stores use a specific hydration pattern (merge in-memory state with disk state, in-session edits win on collision). If you're adding persistence to something new, follow the same approach as `likeStore` or `userPlaylistStore`.

**Storage** - anything written to AsyncStorage goes through `sanitizeTrackForStorage` first. This strips the `stream_url` field (signed CDN URLs shouldn't be persisted) and normalises the shape. Don't skip this.

**Logging** - use `devWarn` and `devError` from `src/utils/devLog.ts` instead of `console.warn`/`console.error` directly. They're no-ops in production builds.

**Accessibility** - use the `a11yButton`, `a11yHeader`, and `a11yImage` helpers from `src/utils/a11y.ts` on interactive elements. Don't add touchable elements without an `accessibilityLabel`.

---

## Running the checks

Before opening a PR, run the full CI pipeline locally:

```bash
npm run ci
```

That runs TypeScript, all Jest tests, and the build check in one go. If any of those fail, the PR won't pass CI either.

You can also run them individually:

```bash
npm run typecheck        # TypeScript only
npm test                 # Jest only
npm run build:check      # Structure + tsc check
npm run test:coverage    # Tests with a coverage table
```

Tests use mocks for Expo AV, AsyncStorage, NetInfo, and native modules so they run in Node without a simulator. If you're adding a new module that needs mocking, add it to `jest.setup.js`.

---

## Writing tests

If you're fixing a bug, a test that reproduces the bug before the fix and passes after is ideal. If you're adding a feature, cover the core logic, especially anything in the stores or utils. UI component tests are welcome but not required for every change.

Tests live in `__tests__/` and mirror the `src/` structure. Keep test files focused; one file per module is the pattern.

---

## Pull requests

- Keep PRs focused. One thing per PR is easier to review and easier to revert if something goes wrong.
- Write a short description of what changed and why. You don't need an essay, a few sentences is enough.
- Run `npm run ci` before pushing. A PR that fails CI won't be merged.
- If your change touches the player, test it on a real device or simulator. Audio behaviour in Jest mocks doesn't reflect real playback.
- Don't bump the version in `package.json` or `app.json`, that's handled separately.

---

## Reporting bugs

Open a GitHub issue. Include:

- What you expected to happen
- What actually happened
- Steps to reproduce (the more specific the better)
- Device/OS/Expo Go version if it's a runtime issue

If it's a crash, the stack trace from Metro or the device logs is really helpful.

---

## Feature requests

Open an issue and describe what you're thinking. If it's something that fits the scope of the app and doesn't require a big architectural change, there's a good chance it'll happen. If it's a bigger idea, a discussion first is better than a surprise PR.

---

## Code of conduct

Be straightforward and respectful. Disagreements about code are fine, that's how good software gets made. Personal attacks or dismissive behaviour aren't welcome here.

---

## License

By contributing, you agree that your changes will be licensed under the same [BSD 2-Clause License](LICENSE) that covers the rest of the project.
