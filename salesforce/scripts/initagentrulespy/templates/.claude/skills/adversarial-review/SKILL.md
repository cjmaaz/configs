---
name: adversarial-review
description: Runs mandatory, blocking, context-aware adversarial review for every requirement, plan, diagnosis, implementation, bug fix, refactor, metadata change, and pre-ship handoff. Invoke after a draft design and after implementation/tests: launch three independent parallel critics selected from the artifact's declared profile (Salesforce implementation, agent-guidance rules/templates/bootstrap, or another purpose-matched profile). Mirrors `.cursor/rules/adversarial-review.mdc`.
---

# Mandatory adversarial review

**Protocol version: 1.0.** The full policy lives in `.cursor/rules/adversarial-review.mdc`; this skill is its operational mirror. Reviewers attack the artifact and identify why it fails. They do not praise, summarize, edit, or rubber-stamp it.

## Gates

- **Gate A — plan/design:** after current-state evidence, surface/cascade mapping, and draft LLD; before source edits or a final planning-only answer.
- **Gate B — implementation:** after implementation and tests; before any real deploy, org DML, cache-bust/version swap, commit, or handoff.

Planning-only work runs Gate A. Implemented work runs both. Tiny work may be concise but is not exempt.

Only Gate-A-reviewed, hash-bound, time-limited observability setup (such as a TraceFlag with cleanup) may write before Gate B; never business data or deployable metadata.

Inherited dirty implementation: freeze/fingerprint the inherited state, reconstruct design/current behavior, label pre-existing changes, and run Gate A before further edits.

Give all reviewers the same immutable snapshot and record its path/revision/hash:

- Gate A: requirements/ACs, current behavior, affected surface, cascade/dependencies, assumptions, design, alternatives, draft tests. Hash design content excluding only its append-only receipt block.
- Gate B: confirmed ACs, approved design, complete diff, callers/callees, validation tests/coverage, static analysis, and all operation-bound logs.

Gate B evidence must hash-bind requirements/ACs, approved LLD + Gate A receipt, prior findings/dispositions, tests/coverage/static analysis, operation-bound log index, freshness/lease evidence, and the one parallel-dispatch receipt.

Use `scripts/adversarial_review_snapshot.py snapshot --base <target-branch> --path <explicit-path> ... --evidence <label>=<file> --freshness <token> --normalize-receipt-path <instantiated-doc> --output .adversarial-review/<generation>/artifact` for Gate B; repo-local operation/rollback files live in the sibling `operations/` directory. Per-file normalization is forbidden for rules/skills/source templates. Give reviewers patch + manifest. Re-query tokens and run `verify` with expected generation + digest; any mismatch reruns all three. Hash-chain marked blocks via `receipt --manifest ...` / `verify-receipt --manifest ...`.

## Launch at least three independent reviewers in one parallel fan-out

Only the orchestrating agent launches reviewers; reviewers never spawn reviewers. Keep them read-only and independent—do not serialize them or show one reviewer's findings to another before completion.

Start every prompt with artifact purpose, in-scope surface, explicit out-of-scope concerns, and selected profile. Reviewers must not expand beyond it.

**Salesforce implementation profile**
1. Runtime/limits: cascades, recursion, 1/200/max bulk, loops/limits, nulls/exceptions/rollback.
2. Concurrency/integrity: async ordering, locks/deadlocks, overlaps, duplicates, retry/idempotency.
3. Requirements/regression/dependencies: AC counterexamples, shared callers/config/security, sibling/legacy behavior.

**Agent-guidance tooling profile (rules/skills/templates/slugs/bootstrap)**
1. Rule/skill consistency: contradictions, ordering, trigger descriptions, ownership/duplication, links, Cursor↔Claude parity.
2. Template/workflow usability: required fields, placeholders, numbering/anchors, cleanup instructions, evidence, naming/slugs.
3. Mirror/portability: canonical↔generated drift, `_sync.py` coverage, tokens/leaks, file placement/counts, and whether `init.py` prefills the intended artifacts.

For guidance tooling, do not redesign bootstrap locking, crash durability, security, or performance unless explicitly requested or a concrete defect prevents correct output. For other artifact types derive three purpose-matched lenses, retaining correctness and regression/dependency coverage.

Building these rules/skills/templates/bootstrap uses the guidance-tooling profile. Using the installed kit later for a real Salesforce feature/fix uses the Salesforce profile, including indirect automation, bulkification/loops/limits, races/locks, shared-logic consumers, backward compatibility, and old-path regression checks.

Add a fourth domain critic only when warranted; it does not replace the three mandatory lenses.

## Prompt contract

Each reviewer receives this explicit objective:

> Attack and nitpick this artifact. Find concrete reasons it will fail or regress existing behavior. Do not praise it. Do not edit files. Return `BLOCK` for Critical/High, `PASS_WITH_FINDINGS` for Medium/Low only, otherwise `PASS`.

Also state: `Stay inside the supplied context/profile; unrelated infrastructure concerns are out of scope.`

Require:

- Reviewer identity/lens, shared generation UUID + one parallel-dispatch receipt, artifact revision, assumptions, and overall `PASS`/`PASS_WITH_FINDINGS`/`BLOCK`.
- Finding ID + severity (`Critical`/`High`/`Medium`/`Low`).
- Evidence (path/line, method, transaction, dependency, query, or metadata element).
- Triggering data shape/volume/timing/interleaving.
- Consequence and affected existing behavior.
- Fix plus regression/bulk/concurrency test.

A failed, timed-out, or incomplete reviewer does not count.

## Parent disposition and gate result

Verify and deduplicate every finding. Record one disposition: `Fixed`, `Rejected with evidence`, `Accepted risk` (Medium/Low only, explicit user approval), `Deferred` (Medium/Low only, owner/ticket + containment), or `N/A with evidence`.

- Critical/High may only be Fixed or Rejected with evidence; they cannot be accepted/deferred.
- Medium requires resolution or explicit risk acceptance.
- Low remains recorded.
- Reviewer disagreement is unresolved risk—not a majority vote.
- Any plan/artifact/evidence digest change invalidates the generation and reruns all three mandatory reviewers in parallel; never mix revisions or late superseded results.

Aggregate `PASS` only when all reviewers pass with no findings; `PASS_WITH_FINDINGS` when no reviewer blocks and only resolved/accepted Medium or recorded Low remain; otherwise `BLOCK`.

If parallel subagents are unavailable, report the gate as unfulfilled/blocked. Never substitute an unlabeled self-review or single generic reviewer and claim compliance.
