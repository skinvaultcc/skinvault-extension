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

- `entrypoints/`: one file or folder per entrypoint, as WXT expects (the background script, the content script, the popup).
- `public/`: files copied as-is into the package, such as the icons.
- `wxt.config.ts`: the manifest's fields and permissions.

## Testing

Unit tests sit next to the code as `*.test.ts`. The tiers are in [AGENTS.md](../AGENTS.md).

## Build and publishing

`pnpm run build` and `pnpm run build:firefox` write the unpacked extension to `.output/`, which can be loaded in the browser for manual testing. `pnpm run zip` and `pnpm run zip:firefox` build the store packages at release time (see Release in [CONTRIBUTING.md](CONTRIBUTING.md)).
