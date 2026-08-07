---
name: adversarial-review
description: Runs mandatory, blocking, context-aware adversarial review for Salesforce delivery work — requirements, plans, diagnoses, implementations, bug fixes, refactors, metadata changes, org data mutations, and pre-deploy handoff. Invoke after a draft design (Gate A) and again after implementation/tests but before any deploy (Gate B): declare a scope contract, launch three independent parallel critics from the matching profile, then verify and challenge every finding rather than auto-applying it. Mirrors `.cursor/rules/adversarial-review.mdc`.
---

# Mandatory adversarial review

**Protocol version: 2.0.** The full policy lives in `.cursor/rules/adversarial-review.mdc`; this skill is its operational mirror. Critics attack the artifact and explain why it fails. They do not praise, summarize, edit, or rubber-stamp it.

## Where it applies

**Required** for Salesforce delivery: metadata under `force-app/`, org data mutations, deploys, org-wide retrieve/mirror runs and their audit docs, OmniStudio cache-bust and version swaps, and the LLD / `changes/` docs accompanying those.

**Not required unless the user asks:** personal tooling under `scripts/`, the agent-guidance kit itself (rules, skills, templates, bootstrap), and notes not tied to a delivery ticket.

Anything not on the exempt list is in scope — these are not two halves of a closed set. Config that governs what deploys, retrieves, or gets statically analysed (`sfdx-project.json`, `.forceignore`, `manifest/`, `config/pmd-ruleset.xml`, `config/schema/` regeneration) is delivery work. The carve-out is by artifact class, never by authorship: anything that deploys metadata, mutates org data, or runs DML is in scope regardless of folder. The exemption list is **not self-amendable** — editing this rule or the lists themselves requires an agent-guidance Gate A. When the user does request a kit review, use the agent-guidance profile.

Planning-only work runs Gate A; implemented work runs both. Tiny in-scope work may be concise and may record evidence-backed `N/A`, but is not exempt.

## Gates

- **Gate A — plan/design:** after current-state evidence, surface/cascade mapping, and a draft LLD; before the first source edit or a final planning-only answer.
- **Gate B — implementation:** after implementation and tests; before any real deploy, org DML, cache-bust, version swap, commit, or handoff.

Nothing in the loop touches the live org: Gate B runs against local artifacts plus validation-only output (`--dry-run`, `sf project deploy validate`, PMD, synchronous tests). Only Gate-A-reviewed, time-bounded observability setup (a TraceFlag with cleanup) may write before Gate B — never business data or deployable metadata.

Inherited dirty implementation: freeze and fingerprint it, reconstruct design and current behavior, label pre-existing changes, then run Gate A before editing further.

Only the orchestrating agent launches critics; critics are read-only and never spawn critics.

## Scope contract — declare before launching

Over-broad critique is this gate's most common failure. Open every fan-out with:

- **Owned surface** — the exact edited path list. No globs.
- **Blast radius** — everything already consuming what you edited: Apex callers/callees, shared helpers, sibling RecordTypes, trigger/flow cascades, OmniScripts and IPs that invoke a changed IP or DataRaptor (and the IPs invoking those), LWC/Aura importing a changed Apex method, FlexiPages/layouts surfacing a changed field, permission sets granting it, and legacy paths still on the old route. Enumerate by searching for consumers, not by recalling them.
- **Not owned** — components that merely coexist; other teams' code this change does not sit on.
- **Out of scope** — with a one-line reason each.
- **Profile** — follows the artifact, not preference: `force-app/`, any deploy, any org mutation → Salesforce delivery; the kit → agent-guidance; purpose-matched only when neither applies. **Change kind** — `existing_modified` | `greenfield` | `retrieve_mirror`.

A finding must land on the owned surface or its blast radius; otherwise disposition it `Out of scope — outside declared ownership`. But a shared path the edited component sits on is **always** in scope, and pre-existing-ness is no defence once this change makes the defect reachable. The contract focuses critics; it does not shrink accountability.

## Evidence pack

Same snapshot to every critic, recorded in the LLD (Gate A) or `changes/<slug>.md` (Gate B):

```bash
BASE=$(git merge-base HEAD <target-branch>)   # or the pre-work HEAD
git rev-parse HEAD
git diff --stat "$BASE" -- <explicit-path-1> <explicit-path-2>
git diff --name-only "$BASE"; git status -s
```

- **Gate A** adds: requirements/ACs, current behavior, affected surface, cascade map, assumptions, design, rejected alternatives, draft tests.
- **Gate B** adds: confirmed ACs, approved design + Gate A outcome, complete diff, callers/callees, validation-job output, tests/coverage, static analysis, every operation-bound Apex log ID, and a `LastModifiedDate` freshness recheck per touched component immediately before deploy.

Inapplicable evidence is `N/A` with a one-line reason.

## Launch three independent critics in one parallel fan-out

Never serialize them; never show one critic's findings to another before all have returned.

**Salesforce delivery profile**
1. Runtime/limits: cascades, recursion, 1/200/max bulk, DML-SOQL-callouts in loops, governor limits, nulls/exceptions/rollback.
2. Concurrency/integrity: stale reads, async ordering, locks/deadlocks, overlapping jobs, duplicates, retry/idempotency, transaction boundaries.
3. Requirements/regression/dependencies: AC counterexamples, state boundaries, shared callers and metadata, permissions/FLS, RecordTypes, sibling and legacy paths, new-path-succeeds-while-old-path-regresses.

**Agent-guidance profile (rules/skills/templates/bootstrap)**
1. Rule/skill consistency: contradictions, ordering, activation triggers, ownership/duplication, stale links, rule↔skill drift.
2. Template/workflow usability: required fields, placeholders, numbering/anchors, cleanup instructions, evidence expectations, naming/slugs.
3. Portability/generation: org-specific leakage into shared templates, token coverage, template↔generated parity, seed-once files that must never be overwritten, file placement/counts, fresh-target reproducibility.

For guidance work the bootstrapper is a delivery mechanism, not the subject — do not redesign its locking, durability, security, or performance unless asked or a concrete defect breaks output. For other artifact types derive three purpose-matched lenses, keeping correctness and regression/dependency coverage. A fourth critic never replaces one of the three.

## Prompt contract

Carry the scope contract verbatim plus:

> Attack and nitpick this artifact. Find concrete reasons it will fail or regress existing behavior. Do not praise it. Do not edit files. Return `BLOCK` for Critical/High, `PASS_WITH_FINDINGS` for Medium/Low only, otherwise `PASS`.
>
> Stay inside the supplied scope contract and profile. A concern outside the declared surface is not a finding.
>
> One exception: **contract completeness is always in scope.** A path in `git diff --name-only` missing from the owned surface, or a consumer of an edited component missing from the blast radius, IS a finding.

Require: critic identity and lens; exact revision reviewed (base SHA + path list) and assumptions; overall verdict; per finding an ID and severity (`Critical`/`High`/`Medium`/`Low`); concrete evidence (path/line, method, transaction, dependency, query, metadata element); triggering data shape/volume/timing/interleaving; consequence and affected existing behavior; recommended fix plus the regression/bulk/concurrency test proving it.

A concern with no falsifiable failure scenario is not a finding. A failed, timed-out, or incomplete critic does not count toward the three.

## Disposition

Deduplicate, then **verify each finding against the actual source and evidence** before recording exactly one of: `Fixed` (cite change + test), `Rejected with evidence` (cite proof), `Accepted risk` (Medium/Low only, explicit user approval), `Deferred` (Medium/Low only, owner/ticket + containment), `N/A with evidence`, or `Out of scope — outside declared ownership` (cite the contract).

- Critical/High may only be Fixed or Rejected with evidence — never accepted, deferred, or dispositioned out of scope. A scope objection to a Critical/High goes to the user, not to the contract.
- Medium requires resolution or explicit user risk acceptance.
- Low remains recorded.
- Critic disagreement is unresolved risk, not a majority vote.
- Three critics are not three approvals; category coverage and evidence matter.

Aggregate `PASS` only when all critics pass with no findings; `PASS_WITH_FINDINGS` when none blocks and only resolved/accepted Medium or recorded Low remain; otherwise `BLOCK`.

## Challenge loop — verify, rebut, then escalate

Findings are hypotheses, not work orders. Applying a wrong finding and dismissing a right one are equally serious failures.

1. **Never auto-apply.** Read the cited code/query/log and confirm the failure is real first.
2. **Never silently drop.** To reject, write the counter-evidence and send it back to that same lens as a rebuttal round. A finding that vanishes without a recorded rebuttal is a bypass.
3. **Unverifiable means unresolved** — it goes to rebuttal, not to `Rejected`.
4. **Three rounds, then a human — always.** After three unresolved rounds on one finding, stop and ask the user. Do not deploy, mutate, commit, or hand off; do not downgrade a surviving Critical/High to `Accepted risk` or `Deferred` to escape. Present both positions and record the user's decision, attributed to them.
5. **Convenience is never a reason** to reject a valid finding.

## Re-review triggers

- **Rebuttal round** (artifact unchanged, counter-evidence added) → re-prompt only the disagreeing lens; the other two verdicts stand.
- **Revision** (artifact or evidence changed) → new revision, rerun all three critics in parallel. **Cap: two full revisions per gate** — critics are told to attack and forbidden to praise, so without a ceiling the loop never terminates. Findings remaining after the second revision go to the user.

Never mix verdicts across revisions or accept late results from a superseded one.

## Capability failure

If parallel subagents are unavailable, report the gate as unfulfilled and blocked. Never substitute an unlabeled self-review or a single generic critic and claim compliance.
