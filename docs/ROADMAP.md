# Roadmap

What the extension does today and what is still open. How it works is in [ARCHITECTURE.md](ARCHITECTURE.md), and the reasons behind each choice in [ADR.md](ADR.md) and skinvault-api's ADR-023. History lives in git and the pull requests.

## Built

1. **Foundation**: WXT with TypeScript (ADR-001), builds for Chromium and Firefox, Prettier and ESLint, Vitest with WXT's in-memory browser.

## Open

- The Steam login bridge: start the QR login and poll it from the background script, and pass the challenge and the refresh token between it and SkinVault's page through a content script.
- The popup with the extension's status (ADR-002), in the seven languages of skinvault-web.
- skinvault-web's account page offering the extension and sending the token with its link ticket to skinvault-api.
- A live check with a real account on the test site, together with skinvault-api's: the token working from the server, and the ADR-021 trade-offer cycle.
- Store listings and privacy policy; publishing on the Chrome Web Store and addons.mozilla.org.
