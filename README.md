# skinvault-extension

SkinVault's browser extension, for Chromium and Firefox. It lets a seller link their Steam account to SkinVault with a QR login started from their own browser, so Steam shows their own location when they approve it, instead of SkinVault's server's.

## Install

Download the zip for your browser from the [latest release](https://github.com/skinvaultcc/skinvault-extension/releases/latest):

- **Chromium** (Chrome, Edge, Brave…): unzip [skinvault-extension-chrome.zip](https://github.com/skinvaultcc/skinvault-extension/releases/latest/download/skinvault-extension-chrome.zip), open `chrome://extensions`, turn on Developer mode and choose **Load unpacked** with the unzipped folder.
- **Firefox**: open `about:debugging#/runtime/this-firefox`, choose **Load Temporary Add-on** and pick [skinvault-extension-firefox.zip](https://github.com/skinvaultcc/skinvault-extension/releases/latest/download/skinvault-extension-firefox.zip). Firefox removes it when it closes, because it only keeps add-ons signed by addons.mozilla.org.

## Docs

- How it works: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- Decisions: [docs/ADR.md](docs/ADR.md), and skinvault-api's ADR-023
- What's built and what's open: [docs/ROADMAP.md](docs/ROADMAP.md)
- How to contribute: [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md)
