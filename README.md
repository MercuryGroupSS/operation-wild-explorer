# Operation Wild Explorer

Mobile-first, camera-free family hiking RPG. This repository imports the previously delivered **Mobile v2 / 2.0.0** game unchanged. The user reported enjoying the deployed game. The current live site's file bytes were not independently verified during this repository preparation.

## One-time GitHub → Netlify setup

1. Create a **private** repository named `operation-wild-explorer` under `MercuryGroupSS`.
2. Upload **the contents of this folder**, not the ZIP and not an additional enclosing folder. The repository root must contain `netlify.toml`, `public/`, and `scripts/`.
3. In the **existing** Netlify project `operation-wild-explorer`, open **Project configuration → Developer settings → Continuous deployment → Repository → Link repository**. Choose GitHub, authorize Netlify for this repository, and select it. Do not create a new Netlify project.
4. Use production branch `main`, base directory blank, build command `node scripts/check.mjs`, publish directory `public`. These build/publish values are included in `netlify.toml`.
5. Wait for the initial Git-backed production deploy to be ready. Verify the existing address and your Home Screen app, then test a separate pull request preview before relying on the update workflow.
6. Grant the ChatGPT GitHub connection access to this new repository if that connection is restricted to selected repositories. Read access alone is not code-write access; a write-capable tool or authorized development environment is needed to publish code changes.

Existing address: https://operation-wild-explorer.netlify.app
Existing Netlify project ID: 142205d8-6800-49d7-996f-5e0ee5094ee7
The account connection was confirmed as MercuryGroupSS during preparation. **This package does not create a remote repository or link Netlify automatically.**

## Structure

- `public/` — the unchanged playable site, assets, PWA files and security headers.
- `scripts/check.mjs` — dependency-free static release checks, run before Netlify publishes.
- `docs/` — original usage and testing notes, plus the initial file-hash baseline.
- `AGENTS.md` — requirements for future AI-assisted changes.
- `.github/PULL_REQUEST_TEMPLATE.md` — review checklist.

Only `public/` is deployed. No database, app API key, Node package dependency or server runtime is needed for gameplay. Node is used only for the build checks.

## Clean update workflow

Create `feature/<short-description>` from `main`; make the smallest useful change; run `node scripts/check.mjs`; open a pull request; check its Netlify Deploy Preview on a phone; merge approved changes into `main` to trigger production deployment. Configure any desired branch-protection rules in GitHub; this package does not enforce server-side review policies.

Increment the application VERSION, service-worker VERSION, and the versioned JS/CSS URLs in `index.html` and `sw.js` together for an actual game release. The source import itself stays at 2.0.0 because game bytes are unchanged. An incorrectly published change should be corrected in a new commit and redeployed.

After linking, future commits to the production branch supersede manual uploads. Use the repo for subsequent releases rather than mixing untracked drag-and-drop versions with Git deploys.

## Preserve family progress

The game uses `wildExplorerSaveV2` and the legacy `wildExplorerSave` local-storage keys. Keep these and the existing HTTPS origin; do not reset saves on deployment. Moving files into the repository's `public/` directory does not change their served URL paths. Saves remain local to the browser/device; they do not become GitHub or Netlify data. Preview subdomains have separate browser storage, so an empty preview is not a lost production save. Export a backup through the game's settings before larger upgrades.

Never commit real exported family saves, journals, GPS data, tokens or passwords. The included `.gitignore` excludes `.netlify/`, environment files and common exported save filenames.

## Validation

`node scripts/check.mjs` verifies JavaScript syntax, referenced local assets, the manifest, save-key constants and synchronized cache versions. It is not a full gameplay or security test. Refer to `docs/TESTING.txt` and the pull request checklist for phone checks.

## Official setup references

- https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository
- https://docs.netlify.com/build/git-workflows/repo-permissions-linking/
- https://docs.netlify.com/deploy/deploy-types/deploy-previews/
