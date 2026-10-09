# Agent Instructions

Every change follows the workflow in [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md): issue → branch from `dev` → tests first → implementation → PR to `dev` → review → squash merge.

## Docs consistency

`docs/ARCHITECTURE.md`, `docs/ADR.md` and `docs/ROADMAP.md` must stay consistent with each other, and with skinvault-api's ADR-023, which decided what this extension is for and how the API takes part. After changing one of them, check the others for contradictions, stale references and what `ROADMAP.md` lists as built or open. Do this as part of finishing the change, without waiting to be asked again.

## Testing strategy

Rigor scales with what a mistake here would cost. The extension handles a Steam refresh token for a few seconds and hands it to SkinVault's page, so anything on that path is Critical:

- **Critical** (unit tests for every branch, including the refusals): the Steam calls in the background script, the message bridge between the page and the extension (which origins it answers, what it passes on), and the manifest's permissions and matches.
- **Low** (unit tests, or a smoke check): the popup and its texts.

Tests come first: written from the issue's acceptance criteria and seen failing before the implementation. Every test written must be run and pass (lint, typecheck, both builds and the test suite) before a task is done.
