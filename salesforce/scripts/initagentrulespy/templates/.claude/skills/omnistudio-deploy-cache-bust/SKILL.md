---
name: omnistudio-deploy-cache-bust
description: OmniStudio runs from compiled artifacts cached in OmniProcessCompilation rows, NOT the metadata you just deployed — a plain `sf project deploy start` often does not invalidate that cache. INVOKE BEFORE deploying any active OmniScript / Integration Procedure / FlexCard, when the user edited a file under omniScripts/ omniIntegrationProcedures/ or a FlexCard, or when a deploy "didn't take effect" (probes don't fire, conditionals don't gate, swapped DR not invoked). Encodes the 5-step deactivate→swap→nuke-compilation→reactivate dance, a 3-step fast path, the caller-chain trap, and a self-check. Skip for DataRaptors (interpreted, not compiled). Mirrors `.cursor/rules/omnistudio-deploy-cache-bust.mdc`.
---

# OmniStudio deploys = mandatory cache-bust dance

**OmniStudio runs from compiled artifacts cached in `OmniProcessCompilation` rows, not the metadata you just deployed.** A vanilla deploy doesn't reliably invalidate that cache. **Either delete the compilation row OR run the full 5-step dance** before assuming the deploy took effect. Apply for **every deploy of an active OmniProcess version** — not "when symptoms appear".

> Retrieve before editing (`retrieve-before-edit` skill) — OmniStudio drifts especially fast (admins edit IPs/DRs in the UI). Companion rule: `.cursor/rules/omnistudio-deploy-cache-bust.mdc` — keep both in sync.

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

## Path A — minimal (3 steps, low-risk)

```bash
sf data query -o {{ORG_ALIAS}} --query "SELECT Id FROM OmniProcessCompilation WHERE OmniProcessId = '<Vcurrent.Id>'"
sf data delete record --sobject OmniProcessCompilation --record-id '<compilation.Id>' -o {{ORG_ALIAS}}
# tweak the top-level <description> by one '.'/',' in the IDE, then:
sf project deploy start --manifest manifest/<feature>.xml -o {{ORG_ALIAS}} --ignore-conflicts --wait 5
```

Run the self-check; if it fails, escalate to Path B.

## Path B — full 5-step dance

`Vcurrent` = version to make active; `Vold` = highest older version of the same `UniqueName`.

> **Two package constraints (both `FIELD_INTEGRITY_EXCEPTION`):** (1) can't update/delete an ACTIVE OmniProcess — deactivate first; (2) only ONE version per Type/SubType/Language active at a time. These dictate the step order.

```bash
# 1. Survey (capture both Ids)
sf data query -o {{ORG_ALIAS}} --query "SELECT Id, UniqueName, IsActive, VersionNumber, LastModifiedDate FROM OmniProcess WHERE UniqueName LIKE '<Type>_<SubType>_%' ORDER BY VersionNumber DESC"

# 2. Deactivate Vcurrent, then activate Vold — sequential updates in ONE apex run (--file avoids heredoc quoting bugs)
cat > /tmp/swap.apex <<'EOF'
update new OmniProcess(Id = '<Vcurrent.Id>', IsActive = false);
update new OmniProcess(Id = '<Vold.Id>',     IsActive = true);
EOF
sf apex run -o {{ORG_ALIAS}} --file /tmp/swap.apex

# 3a. Delete Vcurrent's compilation (the actual cached artifact — MANDATORY)
sf data delete record --sobject OmniProcessCompilation --record-id '<compilation.Id>' -o {{ORG_ALIAS}}
# 3b/3c. Try deleting the OmniIntegrationProcConfig row, then the OmniProcess row.
#   DEPENDENCY_EXISTS when an upstream caller references the IP → fine, skip. Step 3a is what matters.
#   🚨 NEVER rm / git rm the local file — you redeploy from local in Step 5.

# 4. Deactivate Vold (no version active → clean re-registration)
cat > /tmp/deact.apex <<'EOF'
update new OmniProcess(Id = '<Vold.Id>', IsActive = false);
EOF
sf apex run -o {{ORG_ALIAS}} --file /tmp/deact.apex

# 5. Tweak the top-level <description> by one char, confirm <isActive>true</isActive>, redeploy
sf project deploy start --manifest manifest/<feature>.xml -o {{ORG_ALIAS}} --ignore-conflicts --wait 5
# Summary must read State: Changed (or Created). If Unchanged, the tweak didn't hit disk — redo.
```

Don't batch Step 2 into one `update new List<>{...}` (per-record active-check fails in arbitrary order). Don't modify upstream callers just to enable 3b/3c.

## Caller chain — #1 reason "the dance worked but probes still don't fire"

Editing a callee does NOT invalidate caller compilations (no auto-cascade). Bust every OmniProcess from the entry point down (Path A on each):

```bash
sf data query -o {{ORG_ALIAS}} --query "SELECT OmniProcess.UniqueName, Name FROM OmniProcessElement WHERE PropertySetConfig LIKE '%<callee_short_name>%' AND Type = 'Integration Procedure Action' AND OmniProcess.IsActive = true"
cat > /tmp/nuke-chain.apex <<'EOF'
delete [SELECT Id FROM OmniProcessCompilation WHERE OmniProcessId IN ('<entry>','<mid>','<edited>')];
EOF
sf apex run -o {{ORG_ALIAS}} --file /tmp/nuke-chain.apex
```

Diagnostic: a parent IP's `OmniProcessCompilation.LastModifiedDate` predating your edit's activation = the culprit. In doubt, nuke active compilations older than ~2h (`delete [SELECT Id FROM OmniProcessCompilation WHERE OmniProcess.IsActive = true AND LastModifiedDate < :Datetime.now().addHours(-2)]`) — sparingly. Multi-component feature: bust leaves first, or one bulk delete + one bulk redeploy.

## Edge cases

- **Deploy still `Unchanged`:** editor format-on-save reverted the description tweak — `grep "<description>" <file>` and disable format-on-save for `*.oip/.os-meta.xml`.
- **No Vold locally:** snapshot the file, copy to an unused version number as `<isActive>false</isActive>`, deploy that synthetic Vold, restore original, run Path B.
- **OmniScripts also browser-cache:** after the server bust, hard-refresh (Cmd/Ctrl+Shift+R) the host page or sign out/in.

## Self-check

- [ ] `OmniProcess`: Vcurrent `IsActive=true`, `LastModifiedDate` within the last minute.
- [ ] `OmniProcessElement`: changed elements have NEW `Id`s.
- [ ] `OmniProcessCompilation`: **0 rows** for Vcurrent.
- [ ] Probe-to-sink writes appear when you trigger the flow.
- [ ] `git diff` shows only your change + the description byte-flip.

## Common errors (literal strings)

| Error | Cause | Fix |
|---|---|---|
| `You can't update or delete an active Omniscript record...` | Touched Vcurrent while active | Deactivate first (Step 2) |
| `Another active Omniscript with the same Type, Subtype, and Language exists.` | Activated Vold while Vcurrent active | Deactivate + activate in ONE apex run |
| `DEPENDENCY_EXISTS: ... Omni Integration Procedure Configuration` | Upstream caller references the IP | Skip 3b/3c; rely on 3a |
| `Status: Succeeded` + `State: Unchanged` | File matches org byte-for-byte | Description tweak didn't persist |
| `No source-backed components present...` | Slash-syntax manifest member | Use `<Type>_<SubType>_Procedure_<N>` |
| `sObject type 'OmniProcess' is not supported.` | `--use-tooling-api` | Drop it |

## Why it works

The runtime caches the deserialized `OmniProcessCompilation` payload keyed on Type/SubType. Deleting the compilation row (3a) is the highest-reliability invalidation; the `IsActive false→true` flip (Step 5 redeploy) is high; a plain redeploy with neither is very low. The dance does both. The description byte-flip forces MDAPI to emit `Changed` (firing post-deploy hooks) rather than short-circuiting on `Unchanged`.
