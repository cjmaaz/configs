# Git Change Viewer

A **local-only** web app for combining git changes from two sources into one diff view, then exporting the changed files to a Salesforce `package.xml`.

- **Left pane — Files:** browse the repo (defaults to `changes/`), tick `changes/*.md` files, and the app auto-extracts the commit hashes referenced inside them (with commit descriptions). A file with no commit hash gives a shake animation.
- **Right pane — Git History:** browse recent commits, tick a whole commit or expand it to tick individual files. Search + load-more included.
- Both sources merge into one **working set**, each commit tagged `GIT` (picked from history) or `FILE: <doc>` (discovered via a changes doc).
- **View** renders the combined diff (GitHub-style, via `diff2html`).
- **Generate package.xml** turns the changed files into a Salesforce manifest, with a chooser to exclude files and an option to emit `destructiveChanges.xml` for deletions.

> Not for deployment — it reads the local filesystem and runs `git` against the repository it lives in.

## Requirements

- Node.js 20.11+ (developed on Node 24)
- Run it from inside the git repository you want to inspect (it resolves the repo root via `git rev-parse --show-toplevel`).

## Setup

```bash
cd scripts/git-change-viewer
npm install
```

## Run

**Development (recommended)** — Vite dev server with hot reload on `:5173`, API on `:3001`:

```bash
npm run dev
# open http://localhost:5173
```

**Production-style** — build once, serve the built UI + API from a single port:

```bash
npm run build
npm start
# open http://localhost:3001
```

The API port can be overridden with `PORT` (e.g. `PORT=4000 npm start`). In dev, the Vite proxy in `vite.config.js` targets `:3001`.

## How to use

1. **Left pane:** navigate to `changes/`, tick one or more `*.md` files. Their commit hashes appear underneath (auto-selected); use the per-file "select all" or individual checkboxes to refine. A file with no hash shakes.
2. **Right pane:** tick whole commits, or expand (▸) a commit to tick individual files. Use the search box for tickets/keywords and **Load more** for older history.
3. Review the **Selected changes** tray at the bottom — each commit shows its `GIT` / `FILE` source badge. Remove items or **Clear all** as needed.
4. Click **View** to see the combined diff. Toggle **Unified / Side-by-side**, expand/collapse commits.
5. Click **Generate package.xml**. Use **Choose files** to exclude any, optionally tick **Emit destructiveChanges.xml**, then **Copy** or **Download** the manifest. Files that can't be mapped to a metadata type are listed as a warning.

## API (for reference / scripting)

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/fs?path=<rel>` | List a directory (defaults to `changes/`) |
| GET | `/api/file/hashes?path=<rel>` | Extract + validate commit hashes in a file |
| GET | `/api/git/log?skip=&limit=&q=` | Recent commits (search + paginate) |
| GET | `/api/git/commit/:hash/files` | Files changed by a commit |
| POST | `/api/diff` | Combined per-commit diffs for `{selections:[{hash,files?}]}` |
| POST | `/api/packagexml` | Build manifests from `{files:[{path,status}],emitDestructive}` |

## Test

A self-contained API smoke test (mounts the app on an ephemeral port, exercises every endpoint, exits):

```bash
node smoke.mjs
```

## Notes

- `package.xml` is generated from added/modified files; deletions are excluded unless **Emit destructiveChanges.xml** is on. Output uses API version `66.0`.
- The metadata path → type mapping lives in `server/packagexml.js` and follows the repo's `.cursor/rules/retrieve-before-edit.mdc` table.
- Filesystem browsing is sandboxed to the repository root.
- `node_modules/`, `dist/`, and `.npm-cache/` are git-ignored.
