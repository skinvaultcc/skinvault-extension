# Contributing

How work gets done in skinvault-extension. Every change, however small (code, docs or configuration), follows the same workflow. There are no exceptions. [skinvault-api](https://github.com/ruben2k1/skinvault-api) and [skinvault-web](https://github.com/ruben2k1/skinvault-web) follow the same one.

The repository has no branch protection configured. Nothing technical prevents a direct push to `main` or `dev`, so the workflow is enforced by discipline alone.

## Before you start

```bash
pnpm install
pnpm run dev            # Chromium, with the extension loaded and reloading on change
pnpm run dev:firefox    # Firefox
```

Trying it against SkinVault also needs skinvault-web and skinvault-api running locally (see their CONTRIBUTING.md), or the test site.

## Branches

- **`main`:** what is published. Each release builds the store packages from it (see [Release](#9-release)).
- **`dev`:** the integration branch. Every change lands here first.
- **Work branches:** one per issue, short-lived, created from `dev`.

## Workflow

```
issue → branch → tests → implementation → PR → review → fixes (if needed) → merge and close issue
```

Changes reach `main` in [releases](#9-release).

### 1. Issue

Every change starts with a GitHub issue.

- Describe the problem or goal, and why it matters.
- List **acceptance criteria**: observable conditions that must hold when the work is done. They become the tests in step 3.
- Reference the related [roadmap](ROADMAP.md) item and any ADR involved.
- Add the label matching the change type (see [Labels](#labels)).

### 2. Branch

Create a branch from an up-to-date `dev`:

```bash
git switch dev
git pull
git switch -c <type>/<issue>-<short-description>
```

- `<type>`: `feat`, `fix`, `docs`, `refactor`, `test` or `chore`.
- `<issue>`: the issue number.
- Example: `feat/2-steam-login-bridge`.

Never commit directly to `main` or `dev`.

### 3. Tests

Write the tests first, from the issue's acceptance criteria, and check that they **fail** for the right reason before implementing.

- **Unit tests:** `*.test.ts` next to the code (Vitest, with WXT's in-memory `browser`).
- **Rigor:** each flow's tier sets it; see the testing strategy in [AGENTS.md](../AGENTS.md).

Changes without testable behaviour (documentation, configuration) do not skip this step: define up front how each acceptance criterion will be **verified** (e.g. internal links resolve, a command succeeds, a check passes), and describe that verification in the PR.

### 4. Implementation

Write the code until the tests pass. Before opening the PR, everything must be green:

```bash
pnpm run lint             # Prettier check and ESLint
pnpm run check            # TypeScript
pnpm run build
pnpm run build:firefox
pnpm run test
```

Update the documentation in the same branch when the change affects it, and keep the docs consistent with each other and with skinvault-api's ADR-023 ([AGENTS.md](../AGENTS.md)).

### 5. Pull request

Open a PR against `dev`.

- **Title:** what the change does, in the imperative (e.g. "Start Steam's QR login from the browser").
- **Description:** summary of the change, how it was tested, and `Closes #<issue>`.
- If the PR completes an open item, or adds or removes a capability, update [ROADMAP.md](ROADMAP.md) in the same PR.
- Keep the PR focused on its issue. Unrelated changes go in their own issue.

### 6. Review

The maintainer reviews every PR before merging, and the findings and the outcome are recorded as a PR comment. The maintainer usually writes it; when the approval is given outside GitHub, the PR author records it in that comment, stating that the maintainer approved. The review checks:

- **Correctness:** the acceptance criteria are met and edge cases are handled.
- **Tests:** they cover the criteria and would catch a regression.
- **Security:** permissions, message origins, what reaches the page, secrets.
- **Design:** consistency with the architecture and the ADRs.
- **Documentation:** updated where needed, including the roadmap items the PR completes.

### 7. Fixes

If the review finds problems, fix them with new commits on the same branch and push. The review is repeated until nothing is left to address.

If `dev` moves while the PR is open, keep the branch up to date by merging `dev` into it and re-running the checks:

```bash
git fetch
git merge origin/dev
```

Merging instead of rebasing avoids force-pushing; squash merge leaves no trace of it on `dev`.

### 8. Merge and close

- There is no CI workflow: the [local checks](#4-implementation) on the branch's last commit, merged with `origin/dev`, are recorded in the PR as a table of command and result.
- Merge with **squash merge**: each PR becomes a single commit on `dev`, titled after the PR and followed by its number (e.g. `Start Steam's QR login from the browser (#2)`). Set that title explicitly: for single-commit PRs, GitHub defaults to the commit message instead of the PR title.
- Delete the branch after merging.
- `Closes #<issue>` only closes an issue automatically when the PR merges into the default branch, `main`, so close it by hand after merging into `dev`.

```bash
gh pr merge <pr> --squash --delete-branch --subject "<PR title> (#<pr>)"
gh issue close <issue>
```

### 9. Release

When `dev` is stable, open a PR from `dev` into `main` and merge it with a **merge commit**, not a squash, so `dev` stays an ancestor of `main`. Bump `version` in `package.json` in that PR: the stores refuse a package whose version they have already seen.

Then build the store packages from `main` and upload them (`.output/*-chrome.zip` to the Chrome Web Store, `.output/*-firefox.zip` and its sources zip to addons.mozilla.org):

```bash
pnpm run zip
pnpm run zip:firefox
```

Finally, fast-forward `dev` to `main`:

```bash
git fetch origin
git merge-base --is-ancestor origin/dev origin/main   # must succeed
git push origin origin/main:dev
git switch main && git merge --ff-only origin/main
git rev-parse main origin/main dev origin/dev | sort -u | wc -l   # must print 1
```

- **Why:** the release's merge commit exists only on `main`. Without the fast-forward, `dev` falls one more commit behind `main` with every release.
- **Not a force push:** `dev` is already an ancestor of `main`, so nothing is rewritten.
- **Not a PR:** a PR merge would create a commit of its own and leave the branches apart again. This fast-forward is the one push to `dev` that does not go through a PR.

## Labels

Every issue and PR gets the label of its change type:

| Branch type                 | Label           |
| --------------------------- | --------------- |
| `feat`                      | `enhancement`   |
| `fix`                       | `bug`           |
| `docs`                      | `documentation` |
| `refactor`, `test`, `chore` | none            |

## Commits

- Messages in English, with an imperative subject line (e.g. "Add the Steam login bridge").
- Commits are authored by the contributor. No AI attribution trailers (`Co-Authored-By`, "Generated with…") in commits or PRs.
- Branch commits can be granular; squash merge collapses them into one commit on `dev`.

## Documentation

Everything in the repository (code, comments, docs, commits, PRs, issues) is written in English.

The docs describe the current state only, in the present tense. They contain no history (what something used to be, when or why it changed) and no mention of anything removed: when something changes, every mention of the old state goes in the same PR. The history lives in git and in PR descriptions, which may tell it.
