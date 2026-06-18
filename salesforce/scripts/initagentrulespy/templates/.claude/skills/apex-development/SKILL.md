---
name: apex-development
description: The full Apex lifecycle on `{{ORG_ALIAS}}` — deploy/validate, manifest hygiene, targeted tests, MANDATORY Apex-log verification, test-class authoring (factory + schema + coverage), PMD static analysis, and Apex/SOQL formatting. INVOKE when the user asks to deploy, validate, write/run tests, lint, or finalize ANY Apex change (classes, triggers, test classes, anonymous Apex, batch jobs). Mirrors `.cursor/rules/apex-development.mdc` — every step is mandatory; silent trigger/flow/validation failures only show up in the Apex log, not the deploy summary.
---

# Apex development: deploy, test, lint, verify, format

Default target org is `{{ORG_ALIAS}}` (sandbox), source API version `66.0`. Every step below is mandatory.

## Step 1 — Retrieve before editing

Pull the current state of every component you'll touch (class + its test + factory). See the `retrieve-before-edit` skill. Editing a stale file then deploying overwrites newer org state.

## Step 2 — Validate syntax (single-class deploy)

```bash
sf project deploy start --metadata ApexClass:<ClassName> -o {{ORG_ALIAS}} --ignore-conflicts
```

`--ignore-conflicts` is intentional — this repo has no source tracking, so the manifest is the contract. If it fails, fix syntax before continuing.

## Step 3 — Create a NEW manifest

Never overwrite shared manifests (`apex.xml`, `mainpackage.xml`, …). Create `manifest/<feature-or-fix-name>.xml` with only the modified components (`<version>66.0</version>`).

## Step 4 — Author the test class (if writing tests)

- **Find a factory first:** `find force-app -name "*TestDataFactory*" -o -name "*TestFactory*" -o -name "*DataFactory*"`. Use it; never duplicate creation logic.
- **Schema-validate every field** via the `schema-lookup` skill. Never set formula fields, guess API names, or hardcode RecordType Ids.
- **Visibility:** test private methods through public callers; static via `ClassName.method()`.
- **Structure:** `<ClassName>Test`, `@isTest` class-level (never `SeeAllData=true`), `@testSetup` for shared data, 3-6 comprehensive methods (Setup→Execute→Assert) wrapped in `Test.startTest()/stopTest()`. Test classes are exempt from PMD method-length limits.
- **Match production filters:** read every SOQL `WHERE` and set all filter fields + lookups; create positive AND negative data. Zero coverage despite passing = test data misses a filter.
- **Assertions:** `Assert.areEqual(expected, actual, 'msg')` / `Assert.isNotNull` / `Assert.isTrue` with messages — never `System.assert()`, never assertion-free.

## Step 5 — Deploy with targeted tests

```bash
sf project deploy start --manifest './manifest/<feature>.xml' -o {{ORG_ALIAS}} \
  --test-level RunSpecifiedTests --tests <TestClassName> --ignore-conflicts --wait 10
```

Every class ships with a `<ClassName>Test`. Production deploys need ≥75% coverage; target **90%+** for new classes. The deploy summary's coverage lies — verify with a **synchronous** run:

```bash
sf apex run test --class-names <TestClassName> -o {{ORG_ALIAS}} \
  --synchronous --code-coverage --result-format human --wait 10
```

## Step 6 — MANDATORY: retrieve and grep the Apex log

Deploy "Succeeded" ≠ org success. Triggers, flows, and validation rules fail silently — only the log shows it. Check after ANY test run, anonymous Apex, or batch.

```bash
sf apex get log --log-id recent -o {{ORG_ALIAS}} > /tmp/apex_log.txt
grep -E "(EXCEPTION|ERROR|FATAL|DUPLICATE_VALUE|VALIDATION_RULE)" /tmp/apex_log.txt
grep "CODE_UNIT_STARTED.*trigger" /tmp/apex_log.txt   # what fired
grep "FLOW_START" /tmp/apex_log.txt
grep -B 30 "EXCEPTION_THROWN" /tmp/apex_log.txt        # root cause
```

## Step 7 — PMD static analysis (must be clean)

```bash
{{PMD_PATH}} check --dir force-app/main/default/classes/<Class>.cls -R config/pmd-ruleset.xml
```

Fix all violations: extract long methods → helper classes; replace nested ifs with guard clauses; replace long if/else chains with `Map` dispatch; delete unused variables. Targets: method <50 (max 100), complexity <10 (max 15), class <500 (max 1000), public methods <10 (max 20).

## Step 8 — Formatting

- **Method params/args on ONE line** — never split, even if long.
- **SOQL on one line if ≤200 chars**; multi-line (split at SELECT/FROM/WHERE/AND/ORDER BY) only when it exceeds 200.

## Final checklist

- [ ] Retrieved all touched components from `{{ORG_ALIAS}}`.
- [ ] Syntax validated (single-class deploy).
- [ ] NEW manifest (descriptive name, only modified files).
- [ ] Test data uses a factory where one exists; fields schema-validated.
- [ ] Tests pass; coverage verified by synchronous run (≥75%, target 90%+).
- [ ] Apex log grepped — no `EXCEPTION|ERROR|FATAL`; expected triggers/flows fired; limits OK.
- [ ] PMD clean; params single-line; SOQL formatted per the 200-char rule.

## Common mistakes

| Mistake | Why wrong | Correct |
|---|---|---|
| Skip syntax validation | Tests fail later for trivial reasons | Validate single-class first |
| Overwrite shared manifest | Loses other features' scope | New manifest per feature |
| Skip the log check | Hidden trigger/flow/validation failures | Always grep the log |
| Trust deploy "success" coverage | Caught exceptions / stale coverage | Synchronous run |
| Assign a formula field in a test | `Field is not writeable` | Set the fields it derives from |
| Call a private method directly | `Method is not visible` | Exercise it via a public caller |
| Use `--no-verify` / skip hooks | Hides real failures | Fix the root cause |

## When NOT to use

- Pure docs / schema TOON / manifest edits — no deploy.
- Read-only investigations.
- LWC/Aura UI changes without Apex — still deploy, but Apex tests aren't required (Jest runs separately if present).
