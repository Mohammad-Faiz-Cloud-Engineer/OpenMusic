# Security Policy

## Supported versions

This project is actively maintained on the `main` branch. Security fixes are applied there and released as part of the normal release cycle. Older tags or branches don't receive backported patches.

| Branch / version | Supported |
|------------------|-----------|
| `main` (latest)  | Yes       |
| Older tags       | No        |

---

## Reporting a vulnerability

If you've found a security issue, please don't open a public GitHub issue for it. Public disclosure before a fix is in place puts everyone using the app at risk.

Instead, email the maintainer directly:

**Mohammad Faiz** — you can reach out via GitHub ([@Mohammad-Faiz-Cloud-Engineer](https://github.com/Mohammad-Faiz-Cloud-Engineer)) to get a contact address, or open a [GitHub private security advisory](https://github.com/Mohammad-Faiz-Cloud-Engineer/OpenMusic/security/advisories/new) if you prefer to keep everything on GitHub.

When you report, please include:

- A description of the vulnerability and what it could allow an attacker to do
- Steps to reproduce it (or a proof of concept if you have one)
- Which part of the codebase or which dependency is involved
- Your assessment of severity, if you have one

You'll get an acknowledgement within a few days. If the issue is confirmed, a fix will be prioritised and you'll be kept in the loop on the timeline. Credit in the release notes is offered to anyone who reports a valid issue — just let me know if you'd prefer to stay anonymous.

---

## Scope

A few things worth knowing about how this app is built, which affects what kinds of issues are in scope:

**No user accounts or authentication.** The app doesn't have a login system. There's no server-side user data, no passwords, and no tokens that could be stolen from a backend.

**Local storage only.** Liked songs, recent plays, and user-created playlists are stored on-device using AsyncStorage. Nothing is synced to a server. A vulnerability that allows one app on a device to read another app's AsyncStorage is an OS-level issue, not something this app can fix.

**`EXPO_PUBLIC_*` variables are public.** The `EXPO_PUBLIC_API_BASE_URL` and `EXPO_PUBLIC_SENTRY_DSN` values are embedded in the client bundle at build time. This is how Expo's environment variable system works — anything prefixed `EXPO_PUBLIC_` is intentionally client-visible. Don't put secrets there, and if you're building your own version of this app, don't put secrets there either.

**Stream URLs are signed and short-lived.** The app fetches signed CDN URLs from the backend API. These URLs expire (the expiry is tracked in the stream cache). They're not persisted to disk — `sanitizeTrackForStorage` strips `stream_url` before anything is written to AsyncStorage.

**The backend is a separate project.** Audio metadata and stream URLs come from [OpenMusic-API](https://github.com/Mohammad-Faiz-Cloud-Engineer/OpenMusic-API). Vulnerabilities in that backend should be reported to that repository, not here.

---

## What's in scope

- Anything that could allow an attacker to exfiltrate data from the app's local storage
- Vulnerabilities in how the app handles API responses (e.g. malicious data causing unexpected behaviour)
- Issues with how environment variables or configuration are handled that could lead to secret exposure in a fork or derivative build
- Dependency vulnerabilities in production packages (run `npm audit --omit=dev` to check — the `audit:prod` script does this)
- Deep-link handling issues that could allow a malicious link to trigger unintended navigation or actions

## What's out of scope

- Issues that require physical access to an unlocked device
- Theoretical attacks with no practical exploit path
- Vulnerabilities in dev dependencies (Jest, TypeScript, etc.) that don't affect the production bundle
- The hosted API backend — report those to the API repo
- General "this app uses HTTP somewhere" reports without a concrete attack scenario

---

## Dependencies

Production dependencies are pinned in `package.json`. The `overrides` field is used to force safe versions of transitive dependencies where known vulnerabilities exist in older versions. You can audit the production dependency tree yourself:

```bash
npm audit --omit=dev
```

If you find a vulnerability in a dependency that isn't already addressed by an override, that's worth reporting.

---

## Disclosure policy

Once a fix is ready and released, the vulnerability will be disclosed publicly — either in the release notes or as a GitHub security advisory, depending on severity. The goal is to be transparent after the fact while avoiding unnecessary risk during the window between discovery and fix.
