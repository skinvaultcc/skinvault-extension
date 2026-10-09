# Architecture Decision Records (ADR)

Every significant decision and its reasons. What the extension is for, and how skinvault-api takes part, is skinvault-api's [ADR-023](https://github.com/ruben2k1/skinvault-api/blob/dev/docs/adr/23-adr-023-steam-session-link-from-the-browser-extension.md); the entries here cover the extension's own choices.

## ADR-001: WXT, One Manifest V3 Codebase for Chromium and Firefox

> Status: accepted 2026-10-09.

Decision:

The extension is built with [WXT](https://wxt.dev), from its official scaffold (vanilla TypeScript template), as one Manifest V3 codebase. `pnpm run build` and `pnpm run zip` produce the Chromium package (Chrome Web Store, which also covers Edge, Brave and Opera); the `:firefox` variants produce the Firefox one (addons.mozilla.org).

Reason:

Chromium and Firefox differ in manifest details (the background as a service worker or as a script, `browser_specific_settings` for Firefox) and in the `chrome`/`browser` APIs. WXT writes each browser's manifest from one config, gives one `browser` API for both, reloads the extension during development and builds the store zips, including the sources zip addons.mozilla.org asks for.

Alternatives considered:

- **Hand-written manifests and a plain Vite build.** No framework dependency, but the browser differences, the packaging and the development reload would all be ours to keep working.

## ADR-002: A Popup That Shows the Extension's Status

> Status: accepted 2026-10-09.

Decision:

Linking happens on SkinVault's account page, which shows the QR. The extension also has a small popup that says whether it is ready and links to that page, in the same seven languages as skinvault-web.

Reason:

Without a popup, a user who has just installed the extension has nothing to click to check it works or find where to use it.

Alternatives considered:

- **No interface at all,** only the bridge. Less to review in the stores, but no feedback after installing.
