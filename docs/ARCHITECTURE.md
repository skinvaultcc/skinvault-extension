# Architecture

## Purpose

SkinVault needs a live Steam session for every seller (skinvault-api's ADR-021). When SkinVault's server starts the Steam QR login, Steam shows the server's location to the seller with a security warning. This extension starts that login from the seller's own browser instead, so Steam shows their own location, and hands the resulting refresh token to SkinVault's page (skinvault-api's ADR-023). Everything after that happens on SkinVault's server, as with any linked session.

A web page can't do this itself: `api.steampowered.com` doesn't allow requests from other origins (CORS). An extension with host access to it can.

## Technology

- [WXT](https://wxt.dev) with TypeScript, one Manifest V3 codebase for Chromium and Firefox (ADR-001).
- The `browser` API from WXT, the same in both browsers.
- Prettier, ESLint (typescript-eslint) and TypeScript's own check.
- Vitest with WXT's plugin, which provides its auto-imports and an in-memory `browser` (`@webext-core/fake-browser`).

## Project structure

- `entrypoints/`: one file per entrypoint, as WXT expects. `background.ts` makes the Steam calls; `content.ts` runs on SkinVault's pages and carries messages between the page and the background script; `popup/` is the toolbar popup (ADR-002). Each only wires up the code in `lib/`.
- `lib/`: `steam-login.ts` (the two Steam calls), `login-handler.ts` (the background script's side of the protocol), `page-bridge.ts` (the content script's side), `protocol.ts` (the messages and SkinVault's origins), `permissions.ts` (the host access, shared by the manifest and the popup) and `popup.ts`.
- `public/`: files copied as-is into the package: the icons (SkinVault's, resized from skinvault-web's `static/icon-512.png`; the toolbar button uses them too), and `_locales/` with the extension's name, description and popup texts.
- `wxt.config.ts`: the manifest's fields and permissions.

## Permissions and origins

- **Host access** to `https://api.steampowered.com/IAuthenticationService/*` only. Browsers grant host permissions per host, so in practice it covers `api.steampowered.com`; the extension calls nothing else there. No `cookies`, `tabs`, `storage` or other permissions: it never reads the browser's Steam session.
- **SkinVault's origins:** the content script runs on `https://skinvault.cc` and `https://test.skinvault.cc`, plus `http://localhost:5173` (skinvault-web's dev server) in development builds only.

## Popup

The toolbar popup (ADR-002) checks whether the browser has granted the host access above (`permissions.contains`). Chromium grants it at install; Firefox can leave Manifest V3 host access to the user, so when it is missing the popup says so and offers a button that requests exactly that access (`permissions.request`, from the click, as browsers require). When the access is there, it says the extension is ready and that the account page shows whether Steam is linked: it keeps nothing after a link, so it can't know the account's state. It always links to the account page on skinvault.cc and says how linking works. It is built with `textContent` only.

## Languages

The extension's name, description and popup texts come from `public/_locales/`, through `browser.i18n`, in skinvault-web's seven languages. The browsers' locale codes need a region for Portuguese and Chinese, so they are `en` (the default), `es`, `de`, `fr`, `pt_PT`, `pt_BR`, `zh_CN` and `ar`; a test keeps every locale's keys equal to English's. The popup sets its `lang` and its text direction from the browser.

## Protocol

SkinVault's page and the content script talk through `window.postMessage`; the content script and the background script through `runtime.sendMessage`.

1. When it loads, the content script posts `{ source: 'skinvault-extension', ready: true, version }`. A page that started listening later sends a `ping` and gets `{ type: 'ready', version }` back.
2. The page posts `{ source: 'skinvault-page', id, request }`, where `request` is `start`, `poll` or `cancel`. The content script answers with `{ source: 'skinvault-extension', id, response }`:
   - `start` begins a Steam QR login (`BeginAuthSessionViaQR`, platform `WebBrowser`, as skinvault-api's own link): `started` with the challenge URL the page shows as a QR code.
   - `poll`, every few seconds (`PollAuthSessionStatus`): `pending` (with a new challenge URL when Steam rotates it), `approved` with the refresh token and the account name, or `failed` with `expired`, `steam_error` or `not_started`.
   - `cancel` drops the login: `cancelled`.
3. The page sends the refresh token, with its link ticket, to skinvault-api (`POST /users/me/steam-session/token`, through skinvault-web's proxy). The extension keeps nothing once it has answered `approved`.

Who can talk to whom:

- The content script accepts only messages the page posted to itself (same window, same origin) and tagged `skinvault-page`, and posts only to the page's own origin, so neither an embedded frame nor another site can use it or read its replies.
- The background script answers only this extension's content script in a tab on one of SkinVault's origins, and keeps one login per tab, in memory. If the browser stops the background script between two polls, the next poll answers `not_started` and the page starts again.

## Testing

Unit tests sit next to the code as `*.test.ts`. The tiers are in [AGENTS.md](../AGENTS.md).

## Build and publishing

`pnpm run build` and `pnpm run build:firefox` write the unpacked extension to `.output/`, which can be loaded in the browser for manual testing. `pnpm run zip` and `pnpm run zip:firefox` build the store packages at release time (see Release in [CONTRIBUTING.md](CONTRIBUTING.md)).
