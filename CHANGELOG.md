# Changelog

All notable changes to OpenMusic are documented here. The format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [0.1.4] - 2026-05-19

### Added

#### Player screen
- Replaced native Android alert dialogs with an in-app toast when adding a song to a playlist. The toast slides up from the bottom with a spring animation, frosted glass background, green checkmark, and auto-dismisses after two and a half seconds. Fits the look and feel of the rest of the app instead of throwing a system dialog in your face.

#### Settings screen
- New Settings tab in the bottom navigation bar.
- Appearance section with a three-way theme picker: System (follows the device setting), Light, and Dark. The choice is saved and applied immediately across the whole app.
- Data and Storage section with a Clear Recent Plays option. Tapping it shows a confirmation alert before wiping the history.
- Home Screen section with individual toggles for each home screen section: Featured Banner, Quick Picks, Top Charts, Trending Now, Love Songs, and Punjabi Hits. Turn one off and it disappears from the home screen until you turn it back on. Settings are persisted and restored on launch.
- About section showing the app version (read from package.json at build time), a link to the GitHub repo, and the license.
- All settings are persisted to AsyncStorage and restored on the next launch. Invalid or unrecognised values fall back to defaults rather than crashing.

---

## [0.1.3] - 2026-05-17

This is the first public release of OpenMusic. Everything listed below is what shipped in this version. There's no prior release to diff against, so this entry covers the full feature set of the app as it stands today.

### The app

OpenMusic is a mobile music streaming app for Android and iOS, built with React Native and Expo. It connects to a custom backend ([OpenMusic-API](https://github.com/Mohammad-Faiz-Cloud-Engineer/OpenMusic-API)) that pulls song metadata, search results, charts, playlists, and signed stream URLs from JioSaavn. The app itself doesn't bundle any music, it's purely a client.

### Added

#### Home screen
- Time-aware greeting at the top of the screen (Good morning / afternoon / evening / night based on the device clock).
- Featured banner showing the first trending track with its artwork as a full-bleed background, a blurred gradient overlay, and Play Now / Shuffle buttons.
- Quick Picks grid with six trending tracks laid out in a two-column pill grid for fast one-tap playback.
- Top Charts horizontal carousel with chart artwork and a direct link to the full Charts screen.
- Trending Now section showing the top eight trending tracks in a vertical list.
- Love Songs horizontal scroll row with romantic Hindi hits.
- Punjabi Hits vertical list section.
- Pull-to-refresh on the trending and charts sections.
- Skeleton loading cards while data is being fetched, so the layout doesn't jump.
- Search shortcut button in the top-right corner that navigates directly to the Search tab.

#### Search screen
- Full-text search against the JioSaavn backend with a 400ms debounce so the API isn't hammered on every keystroke.
- Live suggestions dropdown that appears while the input is focused, showing autocomplete options. Tapping a suggestion fills the input and fires the search immediately.
- Result count shown in the section header once results load.
- Loading spinner inside the search bar while a request is in flight.
- Clear button to wipe the input and refocus.
- Empty state with a prompt when a search returns no results.
- Idle state with a prompt when the search bar hasn't been used yet.
- Input is capped at 200 characters, matching the API's query length limit.

#### Player screen
- Opens as a slide-up modal from anywhere in the app when a track starts playing.
- Full-screen blurred artwork background with a gradient overlay that adapts to light and dark mode.
- Animated artwork card that scales up when playing and shrinks slightly when paused, using a spring animation.
- Track title and artist name below the artwork.
- Like button next to the track info that toggles the track in and out of liked songs instantly.
- Seek bar with a draggable thumb. Tap anywhere on the bar to jump to that position. Current position and total duration are shown on either side.
- Play / Pause button in the centre of the transport controls. Shows a loading indicator while the stream is buffering.
- Skip back and skip forward buttons. Skip back restarts the current track if you're more than 3 seconds in, otherwise it goes to the previous track.
- Shuffle toggle. When active, the next track is picked randomly from the queue, never the same track twice in a row.
- Repeat button that cycles through three modes: off, repeat all (loops the whole queue), and repeat one (loops the current track). The active mode is highlighted with the accent colour and a small dot indicator. Repeat one shows a "1" badge on the icon.
- Queue button that opens a bottom sheet listing every track in the current queue. The active track is highlighted. Tapping any track in the list jumps to it.
- Share button that opens the native share sheet with the track title and artist name.
- Up Next section at the bottom of the scroll view showing the next three tracks in the queue with artwork, title, artist, and duration. Tapping one plays it immediately.
- More options menu with options to add the current track to a playlist, create a new playlist inline, and open the controls guide.
- Controls guide sheet that explains what every button does.
- Chevron-down button in the top-left to dismiss the modal and return to wherever you were.

#### Mini player
- Persistent mini player that floats above the tab bar whenever a track is playing.
- Shows the current track's artwork, title, and artist.
- Play/pause and skip-forward buttons directly on the mini player so you don't have to open the full player for basic controls.
- Thin progress bar along the top edge of the mini player that updates in real time.
- Slides in with a spring animation when playback starts and slides out when the queue is cleared.
- Tapping the mini player (anywhere except the control buttons) opens the full player screen.

#### Queue and playback engine
- Tracks play from a queue. Starting a track from any list sets that list as the current queue.
- Signed CDN stream URLs are cached in memory with expiry tracking. If a cached URL is still valid (more than 3 minutes from expiry), it's reused without hitting the API again.
- If the stream URL fetch fails for any reason, the player falls back to a proxy play URL automatically.
- Audio session is configured for background playback on both iOS and Android. Music keeps playing when the screen locks or you switch apps.
- Auto-advance: when a track finishes, the next track in the queue starts automatically, respecting the current repeat and shuffle settings.

#### Library screen
- Two tabs: Queue and Recent.
- Queue tab shows the full current playback queue. The active track is highlighted with the accent colour and a small musical note overlay on its artwork.
- Now Playing card at the top of the queue tab links directly to the full player screen.
- Each queue item has a remove button to pull it out of the queue without stopping playback.
- Clear button to wipe the entire queue.
- Recent tab shows the last 50 tracks played, persisted across app restarts.
- Empty states for both tabs with contextual prompts and a Find Music shortcut that navigates to Search.

#### Collection screen
- Liked Songs row showing the total count of saved tracks. Tapping it opens a full track list.
- Your Playlists section showing a horizontal carousel of user-created playlists.
- Each playlist chip shows the playlist name and track count.
- A "+" chip at the end of the carousel navigates to the full playlists management screen.
- If no playlists exist yet, a "New playlist" prompt is shown instead of the carousel.
- See All link navigates to the My Playlists screen.

#### Charts screen
- Full grid of available charts fetched from the backend, displayed in a two-column layout.
- Each chart card shows the chart artwork, title, and description.
- Pull-to-refresh support.
- Tapping a chart opens the Playlist screen for that chart.

#### Playlist screen
- Hero section with a blurred artwork background, the playlist thumbnail, title, owner name, track count, and total duration.
- Play and Shuffle buttons in the hero.
- Full track list below the hero.
- Error state with a retry button if the playlist fails to load.

#### Track List screen
- Generic screen used for "See All" links (Trending Now, Love Songs, Punjabi Hits, Liked Songs, etc.).
- Shows the list title, track count, and Play / Shuffle buttons at the top.
- Full scrollable track list below.

#### My Playlists screen
- Lists all user-created playlists with track counts.
- Create button in the header opens a modal with a text input to name the new playlist. Playlist names are capped at 72 characters.
- Trash icon on any playlist row triggers a confirmation alert before deleting.
- Empty state with a Create Playlist call-to-action.

#### User Playlist Detail screen
- Shows the tracks in a user-created playlist.
- Play and Shuffle buttons at the top.
- Each track row has a remove button that triggers a confirmation alert before removing the track.
- Empty state if the playlist has no tracks yet, with a hint explaining how to add songs from the player.

#### Liked songs
- Heart button on the full player screen toggles a track in and out of liked songs.
- Liked songs are stored on-device and persist across restarts.
- Maximum of 500 liked tracks. The oldest entries are dropped if the limit is exceeded.
- Liked songs are accessible from the Collection screen and can be played as a queue.

#### Recent plays
- Every track that starts playing is added to the recent plays list automatically.
- The list is capped at 50 tracks and persisted to AsyncStorage.
- Accessible from the Library screen's Recent tab.

#### User playlists
- Create, rename (via the player's more-options menu), and delete playlists.
- Add the currently playing track to any playlist from the player's more-options menu.
- Duplicate detection: adding a track that's already in a playlist shows a message instead of adding it twice.
- Playlist IDs are generated with a timestamp and random suffix to avoid collisions.
- All playlist data is stored on-device and persists across restarts.

#### Theme and appearance
- Full dark and light mode support, following the system setting automatically.
- Dark background: `#0A0A0F`. Light background: `#F5F5F7`.
- Accent colour: `#1DB954` (green) used for active states, the play button, liked hearts, and progress fills.
- Frosted blur backgrounds on the tab bar, mini player, sheets, and cards using `expo-blur`.
- Ambient gradient backgrounds on most screens.
- Adaptive splash screen with a dark variant for dark mode.
- Status bar style adapts to the current theme.

#### Navigation and deep linking
- Bottom tab bar with four tabs: Home, Search, Collection, Library.
- Tab bar uses a frosted glass background with a blur effect.
- Stack screens (Player, Playlist, TrackList, Charts, MyPlaylists, UserPlaylist) sit above the tab navigator.
- Player opens as a slide-up modal with a custom animation.
- Deep link scheme `openmusic://` registered for direct navigation to Home, Search, Player, Playlist, Charts.
- Universal links configured for `https://openmusic.app`.

#### Offline handling
- Network status is monitored via `@react-native-community/netinfo`.
- An offline banner appears at the top of the screen when the device loses connectivity, with a hint to reconnect.
- React Query is configured with `networkMode: 'offlineFirst'` so cached data is served when offline.
- Requests that fail due to no network connection are not retried automatically (other errors retry up to twice).

#### Error handling
- `ErrorBoundary` wraps the entire app. If a render error escapes to the top level, a fallback screen is shown with a "Try again" button that resets the boundary.
- `QueryErrorView` component used on screens where a data fetch fails, with a Retry button.
- Global unhandled error handler set via `ErrorUtils` at startup.
- Optional Sentry integration: set `EXPO_PUBLIC_SENTRY_DSN` in `.env` to enable crash reporting. The app works fine without it.

#### Accessibility
- All interactive elements have `accessibilityRole`, `accessibilityLabel`, and where useful, `accessibilityHint`.
- Section headers use `accessibilityRole="header"`.
- The offline banner uses `accessibilityRole="alert"` and `accessibilityLiveRegion="polite"`.
- Hit slop is applied to small touch targets to make them easier to tap.

#### Internationalisation
- i18next set up with an English locale file covering all UI strings.
- RTL layout detection via `expo-localization`.
- All user-facing strings go through `t()` rather than being hardcoded, so adding a new language is a matter of adding a locale file.

#### Developer experience and CI
- TypeScript strict mode throughout. All navigation routes and params are typed.
- `devWarn` and `devError` utilities that are no-ops in production builds. `console.*` calls are stripped from production bundles via `babel-plugin-transform-remove-console`.
- Jest test suite covering the API client, player store, recent store, utils, config parsing, navigation linking, and UI components.
- GitHub Actions CI pipeline: TypeScript check, Jest with coverage, build structure check, runs on every push and PR to main.
- `npm run ci` runs the full pipeline locally in one command.
- `npm audit --omit=dev` script for checking production dependency vulnerabilities.
- `package.json` overrides to force safe versions of transitive dependencies with known CVEs.

### Known limitations in this release

- No album browsing screen. Albums can be fetched via the API but there's no dedicated UI for them yet.
- Playlist renaming is only accessible from the player's more-options menu, not from the My Playlists screen directly.
- No download or offline playback support. All audio streams live.
- Search is English-biased in the default queries on the Home screen. The API supports other languages but the curated home sections are hardcoded to specific queries.
- Web support is present but limited. Audio behaviour in a browser differs from native and isn't a primary target.
- No lock screen media controls or notification player. Background audio works but there's no system-level now-playing widget in this release.

---

[0.1.4]: https://github.com/Mohammad-Faiz-Cloud-Engineer/OpenMusic/releases/tag/v0.1.4
[0.1.3]: https://github.com/Mohammad-Faiz-Cloud-Engineer/OpenMusic/releases/tag/v0.1.3
