# Roadmap

What the extension does today and what is still open. How it works is in [ARCHITECTURE.md](ARCHITECTURE.md), and the reasons behind each choice in [ADR.md](ADR.md) and skinvault-api's ADR-023. History lives in git and the pull requests.

## Built

1. **Foundation**: WXT with TypeScript (ADR-001), builds for Chromium and Firefox, Prettier and ESLint, Vitest with WXT's in-memory browser.
2. **Steam login bridge**: the QR login started and polled from the background script, and the content script carrying the challenge and the refresh token to and from SkinVault's page (see Protocol in ARCHITECTURE.md).
3. **Popup** (ADR-002): whether the browser granted access to Steam's login, with a button to grant it, and a link to the account page; the name, description and texts in seven languages.
4. **GitHub releases**: each `vX.Y.Z` tag publishes the Chromium and Firefox zips as a release, with install steps in the README.
5. **Account page**: skinvault-web offers the extension as the second option and sends the token with its link ticket to skinvault-api.

## Open

- The rest of the live check on the test site: linking with a real account worked in Chrome. Still open: Firefox, and the server using a session linked this way (the ADR-021 trade-offer cycle).
- Store listings and privacy policy; publishing on the Chrome Web Store and addons.mozilla.org.
