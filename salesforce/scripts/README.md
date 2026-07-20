# Salesforce Scripts

Three self-contained kits live under this directory. Each ships its own
detailed README — start there once you know which one you want.

| Kit | Purpose | README |
|---|---|---|
| [`schemapy/`](schemapy/) | **(Python)** 12-step pipeline that retrieves Salesforce metadata, generates a TOON-encoded ER schema (`config/salesforce-er-schema.toon`), splits it into per-object folders under `config/schema/`, enriches every field with picklist values / formulas / lookups, then layers in live record-count usage stats, junction detection, and an `ER.md` diagram. | [`schemapy/README.md`](schemapy/README.md) |
| [`initagentrulespy/`](initagentrulespy/) | **(Python)** Bootstrap kit that materializes a curated AI-agent rule, skill, doc, script, manifest, and config set (~63 files) into any new Salesforce repo. Auto-detects `target-org`, Java home, and PMD binary path and substitutes those into the generated files so the rules work out of the box on macOS, Linux, and Windows. | [`initagentrulespy/README.md`](initagentrulespy/README.md) |
| [`git-change-viewer/`](git-change-viewer/) | **(Node + Vite)** Local-only web app that combines git changes from two sources — ticked `changes/*.md` docs (auto-extracting their referenced commit hashes) and hand-picked commits from history — into one GitHub-style diff view, then exports the changed files to a Salesforce `package.xml` (with optional `destructiveChanges.xml`). | [`git-change-viewer/README.md`](git-change-viewer/README.md) |

## Quick Start

### Generate a TOON schema for the current org

```bash
# From the project root (auto-detects org from .sf/config.json)
pip install -r salesforce/scripts/schemapy/requirements.txt
python3 salesforce/scripts/schemapy/auto_generate_schema.py
```

Outputs land under `config/schema/` (per-object folders), plus
`config/salesforce-er-schema.toon` and an `ER.md` at the project root.

### Bootstrap AI-agent rules into a new Salesforce repo

```bash
cd /path/to/new-sf-repo
python3 /path/to/initagentrulespy/init.py
```

Drops `.cursor/rules/`, `.cursor/permissions.json`, `.cursor/sandbox.json`,
`.claude/skills/`, `docs/`, `changes/_templates/`, `scripts/` (the `schemapy`
schema pipeline + `adversarial_review_snapshot.py`), `.vscode/settings.json`,
`.mcp.json`, `.cursor/mcp.json`, `manifest/` (master + sharded), and
`config/` (`pmd-ruleset.xml` + `schema/README.md`) into the current directory.

### Combine git changes and export a package.xml

```bash
# Run from inside the git repo you want to inspect
cd salesforce/scripts/git-change-viewer
npm install
npm run dev          # Vite UI on :5173, API on :3001 — open http://localhost:5173
```

## Requirements

- Salesforce CLI (`sf`) installed and authenticated
- Python 3.9+ (for `schemapy` and `initagentrulespy`)
- Node.js 20.11+ (for `git-change-viewer`)
- Per-kit deps:
  - `schemapy`: `pip install -r salesforce/scripts/schemapy/requirements.txt`
  - `initagentrulespy`: stdlib only — no external dependencies
  - `git-change-viewer`: `npm install` (inside the kit folder)

## See Also

- [PMD Rulesets](../pmd/README.md) — static code analysis rulesets for Apex
- [`docs/SALESFORCE_TOOLS.md`](../../docs/SALESFORCE_TOOLS.md) — repo-wide overview of all Salesforce tooling in this repo
