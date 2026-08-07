---
name: omnistudio-deploy-cache-bust
description: OmniStudio runs from compiled artifacts cached in OmniProcessCompilation rows, NOT the metadata you just deployed — a plain `sf project deploy start` often does not invalidate that cache. INVOKE BEFORE deploying any active OmniScript / Integration Procedure / FlexCard, when the user edited a file under omniScripts/ omniIntegrationProcedures/ or a FlexCard, or when a deploy "didn't take effect" (probes don't fire, conditionals don't gate, swapped DR not invoked). Encodes the 5-step deactivate→swap→nuke-compilation→reactivate dance, a 3-step fast path, the caller-chain trap, and a self-check. Skip for DataRaptors (interpreted, not compiled). Mirrors `.cursor/rules/omnistudio-deploy-cache-bust.mdc`.
---

# OmniStudio deploys = mandatory cache-bust dance

**OmniStudio runs from compiled artifacts cached in `OmniProcessCompilation` rows, not the metadata you just deployed.** A vanilla deploy doesn't reliably invalidate that cache. **Either delete the compilation row OR run the full 5-step dance** before assuming the deploy took effect. Apply for **every deploy of an active OmniProcess version** — not "when symptoms appear".

> Retrieve before editing (`retrieve-before-edit` skill) — OmniStudio drifts especially fast (admins edit IPs/DRs in the UI). Pass implementation Gate B through the `adversarial-review` skill before deleting compilations, swapping versions, or deploying. Companion rule: `.cursor/rules/omnistudio-deploy-cache-bust.mdc` — keep both in sync.
> Bind every anonymous-Apex log using the TraceFlag/time-window/user/job correlation and async polling from `apex-development`; listing logs alone is insufficient.

## ⛔ Flavour gate — run FIRST

`sf data query -o {{ORG_ALIAS}} -q "SELECT COUNT() FROM OmniProcess" --json | jq '.result.totalSize'`

**0 means STOP** — this is a Vlocity CMT org (confirm the `vlocity_cmt` namespace via `sf package installed list`). The `OmniProcess` family is empty by design there, so every command below succeeds while deleting nothing and the self-check passes vacuously. CMT content lives in `vlocity_cmt__OmniScript__c` / `vlocity_cmt__Element__c` / `vlocity_cmt__DRBundle__c`; invalidate via `vlocity packDeploy` plus re-activation in OmniStudio Designer.

## The cache model

- Each OmniScript / IP / FlexCard = one **`OmniProcess`** row (`UniqueName = <Type>_<SubType>_<Lang>_<Version>`, or `<Type>_<SubType>_Procedure_<Version>` for IPs); steps are **`OmniProcessElement`** rows.
- On activation the package compiles the element tree into one **`OmniProcessCompilation`** row (`OmniProcessId = <Id>`). The runtime reads THAT, not the metadata.
- IPs also have an **`OmniIntegrationProcConfig`** row (`DeveloperName = <UniqueName>`) callers reference → deleting an actively-called IP throws `DEPENDENCY_EXISTS`.
- **DataRaptors (`OmniDataTransform`) are interpreted — NO compilation cache. Skip this skill for `*.rpt-meta.xml`** (unless its caller is stale-cached — then bust the caller).

> 🚨 **Caller-side cache trap.** When OmniProcess A calls B, A's compilation embeds B's compiled snapshot. Busting B alone is NOT enough — A keeps serving the old B. Bust the whole caller chain (below).

## When to apply / skip

**Apply:** deploying a manifest with `OmniScript`/`OmniIntegrationProcedure`/any `Omni*`; edited a file under `omniScripts/` / `omniIntegrationProcedures/` / a FlexCard; adding probes; changing a conditional formula, input mapping, response JSON path, or remote-action class on an active version; renaming/reordering elements; swapping a DR/Apex/IP bundle; cross-org migration where the component exists in the target.

**Skip:** brand-new version that never existed; a file marked `<isActive>false</isActive>`; pure DataRaptor changes; pure CustomField/ValidationRule/Layout/Apex changes; fresh scratch/sandbox.

**Stale-cache symptoms** (run the dance, don't debug your code): added probe absent from the IP debug response; conditional fires/skips against your `executionConditionalFormula`; DR call uses the old `bundle`; renamed step shows the old name; identical inputs give different outputs; description tweak deploys `Unchanged`.

## Preparation before Gate B

Finish functional edits and the one-character top-level `<description>` byte-flip first. Dry-run final bytes; survey exact family/caller IDs; create gitignored operation scripts plus compensating rollback under `.sf-ops/<timestamp>/` and paste them into the change doc's diff-highlights so Gate B reviews the exact bytes; re-check freshness immediately before deploying and run deploy plus invalidation as one uninterrupted sequence; abort and rerun Gate B if someone else deploys into the family mid-sequence. Never edit reviewed bytes/scripts afterward.

## Path A — deploy first, then invalidate

Deploy reviewed bytes, then atomically delete only exact reviewed Vcurrent/caller compilation rows in one anonymous-Apex DML operation. Inspect every operation-bound log. Deploy-first prevents a request from recompiling old metadata between invalidation and deployment.

## Path B — atomic same-version reactivation

Deploy reviewed bytes first. Then run one reviewed Apex transaction that deterministically locks Vcurrent plus every caller process `FOR UPDATE`, validates the complete ID set, deactivates current, deletes exact compilations, and reactivates current. Any failure rolls back. Post-deploy discrepancy executes the reviewed compensating deployment, then reruns Gate B against the new revision. Never delete process/config/local metadata rows.

## Caller chain — #1 reason "the dance worked but probes still don't fire"

Editing a callee does NOT invalidate caller compilations (no auto-cascade). Bust every OmniProcess from the entry point down (Path A on each):

```bash
sf data query -o {{ORG_ALIAS}} --query "SELECT OmniProcess.UniqueName, Name FROM OmniProcessElement WHERE PropertySetConfig LIKE '%<callee_short_name>%' AND Type = 'Integration Procedure Action' AND OmniProcess.IsActive = true"
cat > /tmp/nuke-chain.apex <<'EOF'
delete [SELECT Id FROM OmniProcessCompilation WHERE OmniProcessId IN ('<entry>','<mid>','<edited>')];
EOF
sf apex run -o {{ORG_ALIAS}} --file /tmp/nuke-chain.apex
sf apex list log -o {{ORG_ALIAS}} --json
# Fetch/inspect every log ID from this anonymous-Apex operation.
```

Diagnostic: a parent IP's `OmniProcessCompilation.LastModifiedDate` predating your edit's activation = the culprit. Never broadly delete compilations “when in doubt”: deletion outside the proven caller chain requires an explicit adversarial disposition, exact scoped IDs, user approval, and recovery plan. Multi-component feature: bust leaves first, or one reviewed ID-scoped delete + one bulk redeploy.

## Edge cases

- **Dry-run/deploy `Unchanged`:** pre-review byte-flip did not persist; stop, fix, snapshot again, and rerun all reviewers.
- **OmniScripts also browser-cache:** after the server bust, hard-refresh (Cmd/Ctrl+Shift+R) the host page or sign out/in.

## Self-check

- [ ] `OmniProcess`: Vcurrent `IsActive=true`, `LastModifiedDate` within the last minute.
- [ ] `OmniProcessElement`: changed elements have NEW `Id`s.
- [ ] Compilation is absent before first invocation, or is demonstrably fresh (post-deploy timestamp + reviewed runtime behavior) after an invocation.
- [ ] Probe-to-sink writes appear when you trigger the flow.
- [ ] `git diff` shows only your change + the description byte-flip.
- [ ] Gate B reviewer provenance, reviewed diff, caller-chain scope, findings/dispositions, and re-review are recorded.

## Common errors (literal strings)

| Error | Cause | Fix |
|---|---|---|
| `You can't update or delete an active Omniscript record...` | Unsupported process/config deletion or active mutation | Use reviewed Path A or atomic Path B; never delete process/config |
| `UNABLE_TO_LOCK_ROW` | Another operator owns Vcurrent/family | Abort, recheck org state, rerun Gate B on the new revision |
| `DEPENDENCY_EXISTS: ... Omni Integration Procedure Configuration` | Someone attempted unnecessary config/process deletion | Keep config/process rows; delete only compilation |
| `Status: Succeeded` + `State: Unchanged` | File matches org byte-for-byte | Description tweak didn't persist |
| `No source-backed components present...` | Slash-syntax manifest member | Use `<Type>_<SubType>_Procedure_<N>` |
| `sObject type 'OmniProcess' is not supported.` | `--use-tooling-api` | Drop it |

## Why it works

Both paths deploy reviewed bytes before invalidation. Path A removes exact stale artifacts after deploy. Path B adds rollback-safe same-version reactivation in one transaction. The pre-review description byte-flip forces MDAPI `Changed`.
