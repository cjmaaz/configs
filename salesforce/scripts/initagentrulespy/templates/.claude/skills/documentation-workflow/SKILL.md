---
name: documentation-workflow
description: The mandatory documentation workflow at THREE chronological touchpoints — INTAKE (confirm the ticket + transcribe AC screenshots to text before any code), PRE-CODING ANALYSIS (map cascading impact + author the Low-Level Design BEFORE code, then spawn the preliminary changes/<slug>.md), and WRAP-UP (finalize the doc + two-commit). Also covers LLD design docs and UT/UAT screenshot-evidence docs. INVOKE PROACTIVELY at all three points; do not wait to be asked. Mirrors `.cursor/rules/documentation-workflow.mdc`.
---

# Documentation workflow — intake + pre-coding/LLD + wrap-up + UT evidence

Three chronological touchpoints in every piece of work. **Be proactive at all three.** Retrieve before any edit (`retrieve-before-edit` skill); analysis on stale copies is wrong.

1. **Intake** (work starts) — confirm the ticket, transcribe any AC screenshot to text.
2. **Pre-coding analysis** (before the first code edit) — map cascading impact, author the **LLD** FIRST, then spawn the preliminary `changes/<slug>.md`.
3. **Wrap-up** (work ends) — finalize the `changes/` doc and commit code first, doc second.

---

## Touchpoint 1 — Intake (run at work START)

Trigger the first time the user attaches a requirements screenshot, says "start/build/fix <ticket>", or names a new ticket. When unsure, treat it as intake. Run all five — don't collapse into one message:

1. **Get the ticket number — extract it, or PROACTIVELY ASK.** Pull the bug/story/case number from the message AND any attached screenshot/panel. If it's not there and the user didn't state it, proactively ASK before starting anything. Then read it back: _"Confirming this is for **<TRACKER-NNN>** — <summary>. Right?"_ Accept Jira / ADO / Salesforce Case Id / ad-hoc reference. Don't proceed without confirmation; if contradicted, re-ask — never guess.
2. **Name the chat after the ticket.** Once confirmed, rename the conversation to `<Bug/Story number> - <short description from what was shared>` (e.g. `Bug 567890 - PDA activation skips vendor effective date`). In Cursor, use the `cursor-app-control` `rename_chat` tool; in other tools set the conversation title equivalently. No ticket (rare ad-hoc)? Name it `<short description>`.
3. **Transcribe any visual requirement to TEXT** — read every AC off the image, write as numbered `AC1`, `AC2`, …, post back for confirmation, hold through the work. Mandatory even if "obvious"; screenshots rot and don't survive PR tooling.
4. **Capture explicit out-of-scope items**; if none stated, ASK.
5. **Stash the bundle** (ticket + ACs + out-of-scope) — it feeds the doc header, §3, and §7 at wrap-up.

The §3 ACs in the final doc MUST be the transcribed text — never "see attached screenshot".

---

## Touchpoint 2 — Pre-coding analysis + LLD (after intake, BEFORE code)

Salesforce cascades hard: one insert → process builder → flow → trigger → another trigger touching a third sObject. Map it before coding. Run as a `TodoWrite` plan (one entry each):

- **E1 — Identify the touched surface:** sObjects (confirm shapes via `schema-lookup`), triggers (`grep -l "<sObject>" force-app/main/default/triggers/*.trigger`), flows, validation rules, OmniStudio (grep the IP/DR/OS dirs), Apex callers, custom metadata.
- **E2 — Map cascading impact:** for each create/update/delete, walk downstream (which triggers + flows fire, what DML, which other sObjects) recursively. Sketch a mermaid `flowchart`.
- **E3 — Classify intended vs accidental:** tag each downstream effect. **Each ACCIDENTAL effect → a question to the user BEFORE coding.**
- **E4 — Author the LLD FIRST** (below). This is the "design first" gate — don't open a source file until the LLD's current-behavior + gap + proposed-design sections exist.
- **E5 — Spawn the preliminary `changes/<slug>.md`**, filling only architecture/design sections as a SHORT summary linking to the LLD. **Don't commit either yet.**

Tiny work collapses E1-E5 to a one-sentence note — but run the step so the record exists.

### The LLD

Copy `docs/_templates/_TEMPLATE_lld.md` → `docs/lld/<work-id>-<short-kebab-slug>.md`. It proves you understand the system before touching it. Sections: header + summary; Purpose & scope; Intake (transcribed ACs); Domain mapping; Current behavior (+ diagram); Gap analysis; Before-state evidence (read-only queries + numbers); Proposed design (mechanism, where it plugs in, alternatives w/ pros-cons); Affected components; Cascading impact (intended vs accidental); Draft test scenarios; Open questions & reverse-KT; Pre-implementation checklist; References.

Rules: read the LATEST source and cite paths/methods (don't guess); back the gap with read-only queries + headline numbers; design minimally (smallest additive change reusing existing mechanisms, list rejected alternatives); park unconfirmed assumptions in Open-questions — never bake them in as settled.

Two **conditional** companions (don't produce by reflex): `docs/lld/<work-id>-questions-and-kt.md` (only when assumptions need a stakeholder) and `docs/lld/<work-id>-walkthrough.md` (only when a live session is warranted). The change doc summarizes + links to the LLD — never duplicate the full design into both.

---

## Touchpoint 3 — Wrap-up (`changes/` doc + two-commit)

Run the moment work appears done (deploy Succeeded + tests pass, an OmniStudio run produced records, a commit closed the work, or "looks good / done / ship it"). If unsure, ask — don't skip.

### Template + name

Copy from `changes/_templates/` → `changes/<short-kebab-slug>.md`: `_TEMPLATE_bugfix.md`, `_TEMPLATE_story.md`, `_TEMPLATE_refactor.md`, or `_TEMPLATE_retrieve.md` (org-wide mirror retrieve → saves to `changes/git/retrieve-<date>-<alias>.md`; follow `docs/sf-org-mirror-retrieve.md`, plan-first). Slug = kebab description, NOT the ticket number.

### Header block

```markdown
**Date:** YYYY-MM-DD
**Sandbox:** `{{ORG_ALIAS}}`
**Lead:** <Name> (<role>)
**Story / ticket:** [<TRACKER-NNN>](<url>) — <one-line summary>
**Code commit(s):** [`<short-hash>`](#deploy-ids-and-commit-references)
**Manifest:** [`manifest/<feature>.xml`](../manifest/<feature>.xml) (XML inlined in the Deploy-IDs section)
**Status:** Resolved / Delivered / In progress
```

`**Manifest:**` is REQUIRED for any `--manifest` deploy; inline its full XML so reviewers don't open another file.

### Two-commit strategy: code first, doc second

1. **Stage ONLY files you intentionally modified** — name each path. NEVER `git add force-app/` (blanket) — another agent/job may have in-flight changes. Sanity-check `git status -s`; recover with `git diff --name-only [--cached|HEAD]`. A dirty file that isn't yours: leave it. (Exception: the org-wide retrieve commits the whole mirror as one snapshot by design.)
2. Commit the code (multi-line HEREDOC: subject ≤72 chars imperative; what/why; bullet sub-changes).
3. Capture the hash: `git log -1 --format='%H%n%h%n%s'`.
4. Author the doc, then commit it SEPARATELY: `docs: <title> (refs <short-hash>)`. Never inline the doc into the code commit.
5. Verify: `git log -2` + `git status -s`; report both hashes.

### Filling the doc

- Header: paste the confirmed ticket from intake; fill `**Manifest:**` if used.
- §3 Requirements: paste the transcribed AC text verbatim (one row per AC, Source column = origin); out-of-scope as a bullet list. Never "see attached screenshot".
- Revision log (top): first row = date, hash, what, why.
- **Key changes — diff highlights:** for OmniScripts / IPs / DataRaptors / FlexiPages / layouts / validation rules / formula fields / new Apex, paste a trimmed ```diff``` (small/medium) OR cite line ranges + key method names (large/new). Skip only for 1-2 line obvious changes.
- Replace every `<...>`; delete every `<!-- -->` comment; write `n/a` (+ reason) for inapplicable sections. Mermaid encouraged (camelCase ids, no colors).

### Same thread, same doc

Iterating on the SAME flow/class/OmniScript → ONE doc. Append the new hash to the header, add a Revision-log row + a Diff-highlights sub-section, restate §1 (TL;DR) to the CUMULATIVE state. If iteration N+1 invalidates N, restate §1/§7 and mark the old Revision row `(superseded by <hash>)` — never delete. New doc only for a clearly different feature, or once the prior doc merged to `main`.

---

## UT / UAT evidence docs (when asked)

When asked for a "UT doc", "UAT doc", "test evidence", "QA walkthrough", or "screenshot proof": produce a minimal, screenshot-heavy before→after walkthrough proving each AC by running the REAL process. Evidence beats prose.

**Shape:** `docs/ut/<work-id>/<slug>.md` + sibling `assets/` (+ optional PDF). One `#` title + ONE intro line; one `##` per scenario (`AC1`…), each = ONE sentence (condition → expected) + before + after screenshots, captions naming concrete IDs. NO Purpose/Components/Reproduce/Summary sections. Names: `ac1-before-<what>.png`, `ac1-after-<what>.png`.

**Protocol:** (1) FIND a real record the process picks up (prefer real over synthetic); if none, MODIFY one, or FORCE the gap for a negative case. (2) **Snapshot everything you modify** so it restores. (3) Verify eligibility + blast radius with a query BEFORE running. (4) Capture all before → run the ACTUAL shipped process ONCE (not the underlying function) → verify with queries → capture all after. (5) **Roll back** staged changes; LEAVE the process-created records (the evidence). For virtualized/iframed lists, scroll the container programmatically until the target row renders, then screenshot — never fake it.

**Commit (only when asked, two-commit, explicit staging):** Commit 1 = staging/rollback scripts + UT doc + assets + PDF. Commit 2 = backfill the living doc with links, referencing commit 1's hash.

---

## Anti-patterns

- Starting code without a confirmed ticket (extract or ASK — never guess), or without renaming the chat `<ticket> - <description>`; treating a screenshot as the source of truth; "see attached screenshot" in §3.
- Writing the LLD AFTER coding; producing questions-and-kt / walkthrough by reflex; duplicating the full design into both LLD and change doc.
- Inlining the doc into the code commit; `git add force-app/` (blanket) when another agent may be active; including a file you didn't touch.
- Missing the `**Manifest:**` line; skipping Diff-highlights for OmniScripts/IPs/DRs/layouts; pasting a 500-line file into a diff fence.
- UT: synthetic data when a real record exists; modifying real records without snapshot+rollback; calling the underlying function instead of the shipped process; a report screenshot that doesn't show the target row.

## Adapting to other projects

Stack-agnostic. Map terms: process under test → batch/job/endpoint; record → entity/row; downstream automation → triggers/jobs/events; read-only query → DB/API read. Keep `changes/`, `docs/lld/`, `docs/ut/` at the repo root (or adjust consistently). Sandbox alias is `{{ORG_ALIAS}}`; set per-project from `sf config get target-org`.
