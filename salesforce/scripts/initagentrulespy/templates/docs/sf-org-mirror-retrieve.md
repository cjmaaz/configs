# Sequential Org-Wide Metadata Retrieve — Runbook

A repeatable, hybrid-shard strategy for pulling a **verified metadata footprint** of a Salesforce org into local source while staying under Metadata API limits and surviving slow orgs.

> **Why this doc exists:** A naive `sf project retrieve start --metadata '*'` (or even one all-types manifest) blows past the **10,000-component limit** — a hard Metadata API cap per retrieve — on any non-trivial org, and locks up for hours when the org is slow. So we split the retrieve into a sequence of bounded calls plus a Phase 3 audit and two commits, each call sized to fit under the limit and finish in a predictable time.

**Nothing in this runbook hardcodes how big your org is.** The shipped manifests and the small/heavy type split are a **seed**, not truth. Phase 0 measures your org's actual footprint and that measurement drives the shard plan. Never copy another org's counts, another org's phase numbering, or another run's timings into your plan — discover them.

---

## When to use

- **Initial mirror** of a new org into a fresh repo.
- **Periodic full re-sync** when you suspect significant local drift (different developers / admins deploying directly to the org bypassing your repo).
- **After major package installs** that add hundreds of fields/objects.
- **NOT for routine per-feature work** — for that, retrieve only the touched components (see `.cursor/rules/sf-cli-commands.mdc`).

---

## Prerequisites

1. **`sf` CLI installed and authed.**
   ```bash
   sf org list --all
   ```
   Confirm your target org appears with `Status: Connected`. If expired, re-auth:
   ```bash
   sf org login web -a <YourOrgAlias>
   ```

2. **An SFDX project rooted at the repo.** `sfdx-project.json` should point at `force-app` (or your equivalent package dir) and use the same API version your org supports (this repo uses `{{API_VERSION}}`).

3. **Seed manifests at `manifest/fullpackage.xml` and `manifest/fullpackage/`.** These are a starting point — a list of type names, with no org-specific members. Phase 0 tells you which of them your org actually supports and how they need re-sharding. Never treat the seed as proof of coverage.

4. **A clean spot to capture logs.** The runbook writes the active run's per-phase logs to `.retrieve-logs/current/` and rotates previous runs to `.retrieve-logs/archive/<TS>/`. Both subdirs are covered by the single `.retrieve-logs/` gitignore entry.

5. **`jq`** for parsing `--json` output in the Phase 0 discovery loop.

---

## Setup — set your org alias once

Every `sf` command in this runbook uses `$ORG_ALIAS`. Set it once at the top of your shell session and **leave the terminal open for the whole run**:

```bash
# Replace with YOUR org alias (whatever you used in `sf org login web -a <alias>`)
export ORG_ALIAS={{ORG_ALIAS}}          # {{ORG_NAME}} sandbox
# export ORG_ALIAS={{ORG_ALIAS}}_UAT        # {{ORG_NAME}} UAT
# export ORG_ALIAS=MyProjectDev   # any other org

# Confirm:
echo "Targeting: $ORG_ALIAS"
sf org display -o "$ORG_ALIAS" | grep -E "(Username|Status)"
```

> **If `$ORG_ALIAS` is empty when you run a command, `sf` will fall back to your default org** (the one with 🍁 in `sf org list --all`). That can silently target the wrong org. Always confirm `echo "$ORG_ALIAS"` prints what you expect before starting Phase 1.

**Alternative (no env var):** Set the org as your global default once and drop the `-o "$ORG_ALIAS"` flag from every command:

```bash
sf config set target-org=YourAlias --global
```

The runbook below uses the env-var form because it's safer when you work across multiple orgs in the same shell session.

---

## The strategy in one paragraph

Phase 0 measures your org, then that measurement splits the supported types into two passes:

- **Phase 1 — small bundled shards.** Each call pulls a logical group of low-volume admin / config types (NamedCredential, RemoteSiteSetting, PermissionSet, Workflow, modern-auth types, and so on), either via an existing `manifest/fullpackage/*.xml` shard or a single `--metadata <Type1> --metadata <Type2> …` invocation. Each shard is sized so its total component count stays comfortably under 10k.

- **Phase 2 — heavy types, one per call.** Every type whose live count is large enough to approach the limit on its own, or slow enough to dominate wall-clock, gets its own call.

**Which types land in which pass is an output of Phase 0, not a constant.** A type that is trivial in one org is the heaviest in another.

We run **strictly sequentially** — one retrieve in flight at a time. Slow orgs penalise concurrency badly; parallel retrieves finish later than serial ones because the org throttles. Order Phase 2 **lightest-first** so fatal errors surface in the first few minutes rather than at the end.

Skip noisy / non-code types (Translations, Reports, Dashboards, EmailTemplates, Documents, StaticResources, Letterhead, ContentAsset, Prompt) by default — they're large, change rarely in a code workflow, and rarely matter for development.

---

## Sizing rules (why some types must run alone)

Three rules decide the split. All three are properties of the Metadata API, not of any particular org:

1. **The cap is 10,000 *files* per retrieve call, not 10,000 components** — plus 39 MB compressed / 600 MB uncompressed for the zip. Bundle types multiply: an LWC averages roughly six files per component, Aura around five, Apex two (`.cls` + `.cls-meta.xml`), most single-file types one. Multiply the unmanaged component count by the type's file ratio before comparing to 10,000. Getting this wrong inverts the ranking — a type reporting 1,500 LWC bundles is near the cap while one reporting 8,000 managed-heavy Apex classes may retrieve barely 2,000 files. The size caps bind first for binary-heavy types (`StaticResource`, `ContentAsset`, `Document`).
2. **Some types are slow per record regardless of count.** `Profile` is the classic case: a handful of records, but each carries the org's entire FLS matrix. Sort by *observed wall-clock*, not by count alone.
3. **`CustomObject` must run before `CustomField`.** The `force-app/main/default/objects/<Object>/` folder has to exist before the field-meta files arrive.

Fill this table from your own Phase 0 output and put it in the audit doc:

| Type | Live count (Phase 0) | Pass | Why |
|---|---:|---|---|
| `<Type>` | `<n>` | solo / bundled | near the cap / slow per record / trivial |

> **Sizing trap (caught the hard way):** when sizing OmniStudio types by globbing local files, **DataRaptors use `.rpt-meta.xml`, not `.odt-meta.xml`**. Glob the wrong extension and you get 0, bundle them into a small-types call, and they silently fail to retrieve. This is exactly why Phase 0 sizes from `sf org list metadata` (what the org reports) rather than from local file globs (what you think is there).

---

## Hard lessons (mandatory ops)

Apply these **before Phase 1**, every run:

1. **Single runner only.** Never launch two `sf project retrieve start` (or dual agent runners) against the same working tree. Concurrent retrieves corrupt `.git/index` (`isomorphic-git` checksum errors) and cascade false failures. Use one shell + a PID/flock single-flight check.
2. **Always pass `--ignore-conflicts`.** This repo does not use source tracking as truth; without `-c` / `--ignore-conflicts`, retrieves stall or fail on local/org drift noise.
3. **Prefer source tracking OFF for huge mirrors.** If isomorphic-git / SourceMember races appear, run `sf org disable tracking -o "$ORG_ALIAS"` for the retrieve window and leave it disabled afterward unless you explicitly need tracking. Re-enabling on 50k+ file trees is optional and not required for retrieve-before-edit workflows.
4. **OmniStudio: find out which flavour your org runs before planning Omni at all.** See the branch below — on a Vlocity CMT org the MDAPI Omni types are dead calls, and Omni is **not** part of the recurring mirror.

Example retrieve flag shape (every phase):

```bash
sf project retrieve start --manifest "./manifest/fullpackage/<shard>.xml" \
  -o "$ORG_ALIAS" --ignore-conflicts --wait 120
```

---

## OmniStudio: standard vs Vlocity CMT (decide this in Phase 0)

Two different products wear the same name, and they behave completely differently here. Detect which one you have before writing the phase plan:

```bash
# Does MDAPI see any Omni components? Probe all six — the three light ones decide
# whether Phase 1's OmniStudio shard is worth running at all.
for T in OmniScript OmniIntegrationProcedure OmniDataTransform \
         OmniUiCard OmniInteractionConfig OmniInteractionAccessConfig; do
  printf "%-28s %s\n" "$T" \
    "$(sf org list metadata -m "$T" -o "$ORG_ALIAS" --json 2>/dev/null | jq '.result | length // 0')"
done

# Is the Vlocity CMT managed package installed?
sf package installed list -o "$ORG_ALIAS" --json | jq -r '.result[].SubscriberPackageNamespace' | grep -i vlocity
```

**Standard OmniStudio** — MDAPI returns non-zero counts. Omni types are ordinary metadata: size them in Phase 0 and retrieve them like any other heavy type.

**Vlocity CMT** — MDAPI returns **0** while the components plainly exist. **Detect on the namespace, not on the standard sObjects.** On a real CMT org `OmniProcess` is empty *by design* — the content lives in `vlocity_cmt__OmniScript__c`, `vlocity_cmt__Element__c`, and `vlocity_cmt__DRBundle__c` — so testing `OmniProcess` for rows would tell you the org has no OmniStudio at all, which is exactly the false-completeness claim this section exists to prevent. Confirm with the managed-package objects:

```bash
sf data query -o "$ORG_ALIAS" -q "SELECT COUNT() FROM vlocity_cmt__OmniScript__c"
sf data query -o "$ORG_ALIAS" -q "SELECT COUNT() FROM vlocity_cmt__DRBundle__c"
```

(`OmniDataTransform` can be partially populated on a CMT org, so it is not a reliable signal in either direction.) These components live as **datapacks in the managed package**, not as source-backed metadata. In that case:

- **Omni is out of scope for the recurring mirror — all six types, not just the heavy three.** Do not add the MDAPI Omni types to your phase plan, and skip the Phase 1 OmniStudio shard entirely; they will "succeed" with 0 files and quietly create a false completeness claim.
- **Export once, at project initialization.** Run `vlocity packExport` for the active baseline a single time when the repo is first set up, and commit that as the reference snapshot.
- **After that, export per ticket only.** When a ticket touches a specific OmniScript / IP / DataRaptor, export that pack, work on it, commit it. Nothing else.
- **Never bulk-export inactive versions.** Pull a specific inactive pack only when a ticket genuinely needs it.
- **Clean up after large exports.** `packExport` creates org-side `vlocity_cmt__VlocityDataPack__c` staging rows that consume Data storage (and File storage for any attachment payloads parented to them). `vlocity_cmt__Status__c` is a free-text field, not a picklist, so enumerate what is actually there rather than filtering on a guessed value list: `sf data query -o "$ORG_ALIAS" -q "SELECT vlocity_cmt__Status__c s, COUNT(Id) c FROM vlocity_cmt__VlocityDataPack__c GROUP BY vlocity_cmt__Status__c"`. Deleting these staging rows does not touch the OmniScript/IP/DR definitions themselves.

Record the outcome in the audit doc rather than leaving it implicit. On a Vlocity CMT org, §4 should read something like:

> Omni: Vlocity CMT — out of recurring scope (baseline exported `<date>`, ref `<commit>`). MDAPI list-metadata = 0 by design; `force-app/` Omni is **not** a completeness claim.

Why this matters: a run that lists `OmniScript … Succeeded` with 0 files looks identical in the logs to a run that genuinely had no OmniScripts. Six months later nobody can tell whether the org has no Omni or the mirror silently skipped it.

---

## Phase 0 — pre-flight, discovery, and Gate A

Phase 0 is not read-only: it rotates logs, may stash WIP, and produces the footprint that every later phase depends on. Run all of it before the first retrieve.

### 0.0 Spawn the explicit plan FIRST (mandatory)

**Before running any `sf` command, before any retrieve writes to disk, the agent MUST spawn an explicit `TodoWrite` plan covering the entire end-to-end sequence.** A full retrieve is a long-running multi-stage operation — many MDAPI calls plus an audit doc and two git commits — and any single phase can stall, hit a transient org error, or get interrupted. A plan up front makes the run **resumable**: if a heavy phase fails, the agent re-reads its todo list and knows exactly which phases still need to run, which already succeeded, and where in the audit/commit workflow it left off.

Minimum required todo entries. The Phase 1 and Phase 2 entries are **filled in from Phase 0.3's footprint** — one todo per actual shard and per actual solo type, not a fixed count copied from this doc:

```
[ ] Phase 0.1 — org auth check
[ ] Phase 0.2 — rotate .retrieve-logs/ + seed fresh current/
[ ] Phase 0.3 — footprint discovery (supported types + live counts + OmniStudio flavour)
[ ] Phase 0.4 — WIP check (interactive) + capture PRE_HEAD
[ ] Phase 0.5 — build the shard plan from the footprint
[ ] Phase 0.A — adversarial Gate A on the retrieve plan (three parallel critics)
[ ] Phase 1.<n>  — one todo per bundled small-type shard, sequential
[ ] Phase 2.<n>  — one todo per solo heavy type, sequential lightest→heaviest
[ ] Phase 3.4.1 — per-type analysis todos (one per type that changed; spawned after Phase 2)
[ ] Phase 3.4.2 — cross-type synthesis todo
[ ] Phase 3.4.3 — fill remaining audit-doc sections
[ ] Phase 3.4.B — adversarial Gate B on the finished audit doc (three parallel critics)
[ ] Phase 3.5 — Commit 1: mirror snapshot (force-app/ + manifest/ + config/, doc held back)
[ ] Phase 3.5 — Embed mirror hash in audit doc §9
[ ] Phase 3.5 — Commit 2: audit doc only
[ ] Phase 3.6 — pop WIP (only if stashed in 0.4) + verify clean tree
```

Mark each `in_progress` before starting and `completed` only after it actually finishes successfully (per `Status: Succeeded` in the log for retrieves, per the `git log -1` hash for commits). Do NOT batch-complete todos retroactively — losing the running-todo signal makes a mid-sequence failure ambiguous about what was actually finished.

If the run was interrupted (org timeout, user `Ctrl-C`, agent crash, transient `sf` hang, sandbox restart), the FIRST thing the resuming agent does is read the todo list and identify the most recent `in_progress` entry — that's where work resumes. Don't restart from Phase 1 unless the resume point is unrecoverably ambiguous.

### 0.1 Org authentication check

```bash
sf org list --all
```

Confirm the target org is `Connected`. Abort and re-auth if expired.

### 0.2 Rotate previous run + seed fresh `current/` log dir

```bash
# Rotate any leftover .retrieve-logs/current/ from a previous run into
# .retrieve-logs/archive/<UTC-ts>/ so this run starts with a clean current/.
# (Skip the rotation cleanly if no prior current/ exists — first-ever run.)
if [ -d .retrieve-logs/current ] && [ -n "$(ls -A .retrieve-logs/current 2>/dev/null)" ]; then
  ARCHIVE_TS=$(date -u +"%Y-%m-%dT%H%M%SZ")
  mkdir -p .retrieve-logs/archive
  mv .retrieve-logs/current ".retrieve-logs/archive/${ARCHIVE_TS}"
  echo "  rotated previous run -> .retrieve-logs/archive/${ARCHIVE_TS}/"
fi
mkdir -p .retrieve-logs/current
date "+Started: %Y-%m-%d %H:%M:%S" > .retrieve-logs/current/_session.txt
```

> **Tip:** Add `.retrieve-logs/` to `.gitignore` if it isn't already. The single umbrella entry covers both the active subdir (`.retrieve-logs/current/`) and every archived prior run (`.retrieve-logs/archive/<TS>/`).

### 0.3 Footprint discovery (MANDATORY — this drives everything downstream)

Measure the org. Do not skip this and do not substitute counts from a previous run or another org — a stale footprint is how a type silently exceeds the 10k cap or gets bundled into a call it should never have shared.

```bash
# a) Which types does THIS org actually support and expose to your user?
#    childXmlNames is NOT optional: CustomField, RecordType, ValidationRule,
#    ListView, WebLink, CompactLayout, FieldSet, BusinessProcess and the
#    Workflow* types are children of CustomObject/Workflow and never appear in
#    xmlName. Omit them and the single heaviest type in most orgs — CustomField —
#    is silently reported "unsupported" and never gets sized.
sf org list metadata-types -o "$ORG_ALIAS" --json \
  | jq -r '.result.metadataObjects[] | .xmlName, ((.childXmlNames // [])[])' \
  | sort -u > .retrieve-logs/current/_types-supported.txt

# Sanity gate: the two types with a hard ordering constraint must both be here.
for T in CustomObject CustomField; do
  grep -qx "$T" .retrieve-logs/current/_types-supported.txt \
    || echo "  !! $T missing from supported set — discovery is wrong, STOP"
done

# b) Which types does the seed manifest set ask for?
grep -ho '<name>[^<]*</name>' manifest/fullpackage.xml manifest/fullpackage/*.xml \
  | sed 's/<[^>]*>//g' | sort -u > .retrieve-logs/current/_types-requested.txt

# c) The gap in both directions — requested-but-unsupported, and supported-but-unrequested.
comm -13 .retrieve-logs/current/_types-supported.txt .retrieve-logs/current/_types-requested.txt \
  > .retrieve-logs/current/_types-unsupported.txt
comm -23 .retrieve-logs/current/_types-supported.txt .retrieve-logs/current/_types-requested.txt \
  > .retrieve-logs/current/_types-uncovered.txt

# d) Live component count per requested+supported type. This is the sizing input.
#    Three traps, all of which silently produce a wrong number rather than an error:
#      - A `<members>*</members>` retrieve returns ONLY manageableState=unmanaged.
#        listMetadata counts managed-package components too, so the raw total can be
#        an order of magnitude high on a package-heavy org. Size on `unmanaged`.
#      - Folder-based types need --folder; without it they report 0 however many exist.
#      - On any sf error there is no .result key, and `null | length` is 0 — so a failed
#        call is indistinguishable from an empty type. Record it, never count it as 0.
FOLDER_TYPES='Report|Dashboard|Document|EmailTemplate'
: > .retrieve-logs/current/_footprint.tsv
: > .retrieve-logs/current/_footprint-errors.tsv
while read -r T; do
  if printf '%s' "$T" | grep -qxE "$FOLDER_TYPES"; then
    n=0
    for F in $(sf org list metadata -m "${T}Folder" -o "$ORG_ALIAS" --json 2>/dev/null \
                 | jq -r '.result[]?.fullName'); do
      n=$(( n + $(sf org list metadata -m "$T" --folder "$F" -o "$ORG_ALIAS" --json 2>/dev/null \
                    | jq '[.result[]? | select(.manageableState == "unmanaged")] | length') ))
    done
    printf "%s\t%s\n" "$n" "$T" >> .retrieve-logs/current/_footprint.tsv
    continue
  fi
  raw=$(sf org list metadata -m "$T" -o "$ORG_ALIAS" --json 2>&1)
  if ! printf '%s' "$raw" | jq -e 'has("result")' >/dev/null 2>&1; then
    printf "%s\t%s\n" "$T" "$(printf '%s' "$raw" | jq -r '.message // "unknown error"')" \
      >> .retrieve-logs/current/_footprint-errors.tsv
    continue
  fi
  printf "%s\t%s\n" \
    "$(printf '%s' "$raw" | jq '[.result[] | select(.manageableState == "unmanaged")] | length')" \
    "$T" >> .retrieve-logs/current/_footprint.tsv
done < <(comm -12 .retrieve-logs/current/_types-supported.txt .retrieve-logs/current/_types-requested.txt)
sort -rn -o .retrieve-logs/current/_footprint.tsv .retrieve-logs/current/_footprint.tsv
column -t .retrieve-logs/current/_footprint.tsv

# The footprint is only usable if nothing failed. An error here is not a zero.
[ -s .retrieve-logs/current/_footprint-errors.tsv ] \
  && { echo "!! footprint incomplete — resolve these before Phase 0.5:"; \
       cat .retrieve-logs/current/_footprint-errors.tsv; }
```

Then run the **OmniStudio flavour detection** from the section above, and record which branch applies.

Step (d) is the slow part — it makes one list-metadata call per type. Let it finish; every later decision reads from `_footprint.tsv`.

Two known quirks of `_types-unsupported.txt`. Folder pseudo-types (`ReportFolder`, `DashboardFolder`, `DocumentFolder`, `EmailFolder`) are addressed through their parent type and legitimately never appear in the supported list. And if a type you *know* the org uses shows up there, suspect the discovery query before believing it — that is the symptom of the `childXmlNames` mistake above.

**Container types under-report.** `CustomLabels`, `SharingRules`, `Workflow`, `MatchingRules`, and `AssignmentRules` each count as **1** while carrying many children (`CustomLabel` alone can be five figures). They retrieve as a single file, so they are cheap in file terms — but do not read their `1` as "trivial component count" when reasoning about anything else.

Review `_types-uncovered.txt` deliberately rather than ignoring it. Most entries will be licensed-but-unused platform features, but this is exactly where an important type goes missing. For each uncovered type decide *cover it* or *exclude it with a reason*, and record both in the audit doc's **Type coverage & sizing** section. "We didn't notice it" is not a reason.

### 0.4 WIP check (interactive) + capture `PRE_HEAD`

This runs before Gate A so the critics can review your actual WIP strategy, and before any retrieve writes to disk.

```bash
wip_count=$(git status --short | wc -l | tr -d ' ')
if [ "$wip_count" -gt 0 ]; then
  echo "WIP detected: $wip_count modified or untracked files."
  git status --short | head -20
  # Ask the user: stash+pop / continue / abort  (table in Phase 3.1-3.3)
fi

PRE_HEAD=$(git rev-parse HEAD)
echo "$PRE_HEAD" > .retrieve-logs/current/_pre-head.txt
echo "Pre-retrieve HEAD: $(git rev-parse --short HEAD)"
```

`PRE_HEAD` is persisted to a file, not just an env var — the shell may not survive a long run.

### 0.5 Build the shard plan from the footprint

Using `_footprint.tsv` and the three sizing rules above, decide for this run:

- Which types run **solo** (Phase 2) and in what order (lightest first).
- Which types are **bundled** (Phase 1) and into which shards, with each shard's summed count well under 10,000.
- Which types are **excluded**, each with a reason.

Then write the Phase 2 order to disk — the Phase 2 driver loop reads this exact file, and it does not exist until you create it:

```bash
# Solo types only: exclude everything you bundled into a Phase 1 shard.
# Ascending count (lightest first) so failures surface early.
cat > .retrieve-logs/current/_phase2-solo.txt <<'EOF'
<Type>
<Type>
EOF

# Apply the two hard ordering constraints:
#   CustomObject immediately before CustomField (field files need the folders);
#   Profile last (few records, slowest each, cheapest to retry).
awk 'NR==FNR{c[$2]=$1; next} {print (c[$1]+0)"\t"$1}' \
    .retrieve-logs/current/_footprint.tsv .retrieve-logs/current/_phase2-solo.txt \
  | sort -n | cut -f2 \
  | grep -vxE 'CustomObject|CustomField|Profile' \
  > .retrieve-logs/current/_phase2-order.txt
for T in CustomObject CustomField Profile; do
  grep -qx "$T" .retrieve-logs/current/_phase2-solo.txt \
    && echo "$T" >> .retrieve-logs/current/_phase2-order.txt
done
cat -n .retrieve-logs/current/_phase2-order.txt
```

Confirm the printed order reads lightest → heaviest, with `CustomObject` before `CustomField` and `Profile` last. That file plus your shard/exclusion decisions is the artifact Gate A reviews. Turn each shard and each solo type into its own todo now.

### 0.A Mandatory adversarial Gate A

Before the first `sf` retrieve, launch three independent critics in one parallel fan-out per [`.cursor/rules/adversarial-review.mdc`](../.cursor/rules/adversarial-review.mdc), against this run's shard plan, footprint, target alias, WIP decision, and resume assumptions.

Use these retrieve-specific lenses:

1. **Coverage** — attack the plan for missing types that are **important and change frequently**: Apex classes and triggers, LWC and Aura, Flow, CustomObject and CustomField, Layout, FlexiPage, Profile, PermissionSet, and the Omni types when they are MDAPI-backed. Cross-check `_types-uncovered.txt` and challenge every recorded exclusion reason. **Do not block on rarely-changing bulk types** — Translations, Reports, Dashboards, EmailTemplates, Documents, StaticResources, Letterhead, ContentAsset, Prompt — unless this run's plan explicitly claims them. A finding on those is out of scope by default.
2. **Limits and ordering** — attack the sizing: any shard whose summed count approaches 10,000, any solo type sized from a stale or missing footprint entry, `CustomObject` not preceding `CustomField`, missing `--ignore-conflicts`, concurrent runners against one working tree, and `--wait` values too short for the observed counts.
3. **Safety and truthfulness** — attack the blast radius: wrong `$ORG_ALIAS` (empty variable silently falling back to the default org), WIP that could be wiped or folded into the mirror commit, resume/rollback holes, and any claim of completeness the evidence does not support — especially Omni on a Vlocity CMT org.

Verify each finding before acting on it, rebut rather than silently dropping, and escalate to the user after three unresolved rounds. Record critic IDs, the plan revision reviewed, verdicts, and dispositions in the audit doc's Gate A section. A prior run's approval is stale the moment the alias, footprint, shard plan, or WIP decision changes.

---

## Phase 1 — small / medium bundled shards

Run **strictly in order**, lightest first. Each call writes its full output to a numbered log so you can audit afterwards.

> **All commands use `$ORG_ALIAS`** — make sure you exported it in the [Setup](#setup--set-your-org-alias-once) section above. Run `echo "$ORG_ALIAS"` to confirm before starting.

### 1.1 Integration shard — 17 admin types

Pulls NamedCredential, RemoteSiteSetting, ConnectedApp, Certificate, AuthProvider, etc.

```bash
sf project retrieve start \
  --manifest manifest/fullpackage/fullpackage-integration.xml \
  -o "$ORG_ALIAS" --wait 60 \
  2>&1 | tee .retrieve-logs/current/01-integration.log | grep -E "Status: (Succeeded|Failed)"
```

### 1.2 Community shard — 15 community/site types

```bash
sf project retrieve start \
  --manifest manifest/fullpackage/fullpackage-community.xml \
  -o "$ORG_ALIAS" --wait 60 \
  2>&1 | tee .retrieve-logs/current/02-community.log | grep -E "Status: (Succeeded|Failed)"
```

### 1.3 Content (filtered) — only 3 useful types

We deliberately skip `Document`, `DocumentFolder`, `EmailTemplate`, `EmailFolder`, `Letterhead`. They're large and rarely interesting for code development.

```bash
sf project retrieve start \
  --metadata PostTemplate \
  --metadata ManagedContentType \
  --metadata ActionLinkGroupTemplate \
  -o "$ORG_ALIAS" --wait 60 \
  2>&1 | tee .retrieve-logs/current/03-content-filtered.log | grep -E "Status: (Succeeded|Failed)"
```

### 1.4 Translations (filtered) — `CustomObjectTranslation` only

We deliberately skip `Translations` (the user-facing language pack). `CustomObjectTranslation` is what carries field-level translation overrides we sometimes want.

```bash
sf project retrieve start \
  --metadata CustomObjectTranslation \
  -o "$ORG_ALIAS" --wait 120 \
  2>&1 | tee .retrieve-logs/current/04-translations-filtered.log | grep -E "Status: (Succeeded|Failed)"
```

### 1.5 OmniStudio small types — only the lightweight ones

> **Skip this entire shard on a Vlocity CMT org.** Phase 0.3's flavour detection tells you which branch you are on; on CMT all six Omni types return 0 and this call books three more "covered" types that retrieved nothing.

OmniUiCard, OmniInteractionConfig, OmniInteractionAccessConfig.

`OmniScript`, `OmniIntegrationProcedure`, and `OmniDataTransform` (DataRaptors) are **deliberately excluded** here — they're heavy and each gets its own Phase 2 call.

```bash
sf project retrieve start \
  --metadata OmniUiCard \
  --metadata OmniInteractionConfig \
  --metadata OmniInteractionAccessConfig \
  -o "$ORG_ALIAS" --wait 60 \
  2>&1 | tee .retrieve-logs/current/05-omnistudio-small.log | grep -E "Status: (Succeeded|Failed)"
```

### 1.6 Code small types

ApexComponent / ApexPage / ApexTestSuite / ApexTrigger / LightningMessageChannel.

```bash
sf project retrieve start \
  --metadata ApexComponent \
  --metadata ApexPage \
  --metadata ApexTestSuite \
  --metadata ApexTrigger \
  --metadata LightningMessageChannel \
  -o "$ORG_ALIAS" --wait 60 \
  2>&1 | tee .retrieve-logs/current/06-code-small.log | grep -E "Status: (Succeeded|Failed)"
```

### 1.7 Schema small types — everything in `fullpackage-schema.xml` except CustomObject and CustomField

```bash
sf project retrieve start \
  --metadata RecordType \
  --metadata BusinessProcess \
  --metadata CompactLayout \
  --metadata FieldSet \
  --metadata ListView \
  --metadata ValidationRule \
  --metadata WebLink \
  --metadata CustomMetadata \
  --metadata CustomLabels \
  --metadata GlobalValueSet \
  --metadata GlobalValueSetTranslation \
  --metadata StandardValueSet \
  --metadata StandardValueSetTranslation \
  --metadata TopicsForObjects \
  --metadata DuplicateRule \
  --metadata MatchingRules \
  --metadata CleanDataService \
  -o "$ORG_ALIAS" --wait 120 \
  2>&1 | tee .retrieve-logs/current/07-schema-small.log | grep -E "Status: (Succeeded|Failed)"
```

### 1.8 UI small types — everything in `fullpackage-ui.xml` except Layout, FlexiPage, Prompt

```bash
sf project retrieve start \
  --metadata QuickAction \
  --metadata PathAssistant \
  --metadata CustomApplication \
  --metadata CustomApplicationComponent \
  --metadata CustomTab \
  --metadata CustomPageWebLink \
  --metadata HomePageComponent \
  --metadata HomePageLayout \
  --metadata NavigationMenu \
  --metadata AppMenu \
  --metadata LightningBolt \
  --metadata LightningExperienceTheme \
  --metadata LightningOnboardingConfig \
  --metadata BrandingSet \
  --metadata RecordActionDeployment \
  -o "$ORG_ALIAS" --wait 60 \
  2>&1 | tee .retrieve-logs/current/08-ui-small.log | grep -E "Status: (Succeeded|Failed)"
```

### 1.9 Automation small types — everything in `fullpackage-automation.xml` except Flow

```bash
sf project retrieve start \
  --metadata FlowDefinition \
  --metadata FlowCategory \
  --metadata Workflow \
  --metadata WorkflowAlert \
  --metadata WorkflowFieldUpdate \
  --metadata WorkflowRule \
  --metadata WorkflowTask \
  --metadata ApprovalProcess \
  --metadata AssignmentRules \
  --metadata AutoResponseRules \
  --metadata EscalationRules \
  --metadata MilestoneType \
  --metadata NotificationTypeConfig \
  --metadata CustomNotificationType \
  -o "$ORG_ALIAS" --wait 60 \
  2>&1 | tee .retrieve-logs/current/09-automation-small.log | grep -E "Status: (Succeeded|Failed)"
```

### 1.10 Security small types — everything in `fullpackage-security.xml` except Profile

```bash
sf project retrieve start \
  --metadata PermissionSet \
  --metadata PermissionSetGroup \
  --metadata MutingPermissionSet \
  --metadata CustomPermission \
  --metadata Role \
  --metadata Group \
  --metadata Queue \
  --metadata SharingCriteriaRule \
  --metadata SharingOwnerRule \
  --metadata SharingRules \
  --metadata SharingSet \
  --metadata UserCriteria \
  --metadata DelegateGroup \
  --metadata Skill \
  -o "$ORG_ALIAS" --wait 60 \
  2>&1 | tee .retrieve-logs/current/10-security-small.log | grep -E "Status: (Succeeded|Failed)"
```

### 1.11 Gap shard — types the seed manifest misses

Types that Phase 0.3 flagged in `_types-uncovered.txt` and you decided to cover. The three below are a common example — they are silently absent from most seed manifests but matter:

- `ExternalCredential` — the modern auth attached to `NamedCredential`. Salesforce is migrating username/password and OAuth flows here, away from the older fields inside the NamedCredential itself.
- `ExternalClientApplication` — Salesforce's official replacement for `ConnectedApp`. New OAuth integrations should land here.
- `ApexEmailNotifications` — routes uncaught Apex exceptions to a list of recipients. Drift here means production errors silently stop alerting whoever should hear about them.

```bash
sf project retrieve start \
  --metadata ExternalCredential \
  --metadata ExternalClientApplication \
  --metadata ApexEmailNotifications \
  -o "$ORG_ALIAS" --wait 60 \
  2>&1 | tee .retrieve-logs/current/11-modern-auth-apex.log | grep -E "Status: (Succeeded|Failed)"
```

> **Why a gap shard exists at all.** Orgs typically report far more metadata types than any seed manifest lists, and most of that delta is licensed-but-unused platform features you genuinely do not want. But a few uncovered types are active, customised, and infrastructure-critical — that is what `_types-uncovered.txt` from Phase 0.3 is for. Work through it, decide *cover* or *exclude with a reason* for each entry, put the covered ones in a shard like this, and record the exclusions in the audit doc. This shard's membership is therefore **per-org**; the three types above are a common starting set, not a fixed answer.

---

## Phase 2 — heavy types, strictly one type per call

**Which types appear here, and in what order, comes from your Phase 0.5 shard plan.** Order **lightest → heaviest** by live count so failures surface early. The two ordering constraints that are not negotiable: `CustomObject` runs before `CustomField`, and `Profile` runs last (few records, but each carries the whole FLS matrix, so it is slow and its failure is the least disruptive to retry).

Every call has the same shape — substitute the type, the log name, and a `--wait` sized to the live count:

```bash
sf project retrieve start --metadata <Type> -o "$ORG_ALIAS" --ignore-conflicts --wait <n> \
  2>&1 | tee ".retrieve-logs/current/<NN>-<type>.log" | grep -E "Status: (Succeeded|Failed)"
```

Or drive the whole pass from your plan:

```bash
# One type per line, lightest first — written by Phase 0.5.
[ -s .retrieve-logs/current/_phase2-order.txt ] || { echo "run Phase 0.5 first"; exit 1; }
NN=0
while read -r T; do
  NN=$((NN + 1))
  printf '\n=== Phase 2.%02d — %s ===\n' "$NN" "$T"
  # Size the wait to the live count: a type in the thousands needs far more
  # than one near zero. Bump WAIT per type rather than leaving one flat value,
  # which Gate A lens 2 is explicitly told to attack.
  WAIT=$(awk -v t="$T" '$2==t{print ($1>1000)?300:(($1>200)?180:90)}' \
           .retrieve-logs/current/_footprint.tsv)
  /usr/bin/time -p sf project retrieve start --metadata "$T" \
    -o "$ORG_ALIAS" --ignore-conflicts --wait "${WAIT:-180}" \
    2>&1 | tee ".retrieve-logs/current/$(printf '%02d' "$NN")-$(echo "$T" | tr '[:upper:]' '[:lower:]').log" \
    | grep -E "Status: (Succeeded|Failed)"
done < .retrieve-logs/current/_phase2-order.txt
```

**Record your own per-call wall-clock as you go** — it goes into audit-doc §2 and becomes the baseline the *next* run compares against. Do not copy timings from another org or another doc; they vary several-fold with org load, and a borrowed number tells you nothing about whether today's run is healthy. If you want a prior baseline, read the most recent audit doc in `changes/git/`.

---

## Phase 3 — Audit + commit (mandatory)

Every retrieve run ends with a persistent audit doc under `changes/git/`, committed via the same two-commit pattern as [`documentation-workflow.mdc`](../.cursor/rules/documentation-workflow.mdc) (mirror commit first, doc commit second referencing the mirror commit hash).

**Why this matters:** in a Salesforce repo where teammates deploy directly to the org — often via a VDI pipeline that commits later, or sometimes never — the local repo is rarely the source of truth. Most of the diff in any retrieve is someone else's work. The audit doc lets a future investigator bisect by retrieve date and pinpoint when a given component shifted, even if no commit ever landed in the repo from the person who shipped it.

### 3.1–3.3 Already done in Phase 0 — do not re-run

| Step | Where it happened | Why it moved |
|---|---|---|
| WIP check (interactive) | **Phase 0.4** | Gate A must review the actual WIP decision, and nothing may write to disk before it. |
| Capture `PRE_HEAD` | **Phase 0.4** | Persisted to `.retrieve-logs/current/_pre-head.txt` so a long run surviving a shell restart still has its diff base. |
| Run the retrieve phases | **Phases 1 and 2** | Record per-phase wall-clock and any retries as you go; that data feeds §2 of the audit doc. |

WIP responses, for reference (captured in Phase 0.4, reported in §7):

| Response | What happens |
|---|---|
| **stash + pop** | `git stash push -u -m "pre-retrieve-$(date +%Y%m%d-%H%M)"` ran in Phase 0.4. After Phase 3.6, `git stash pop` runs and any conflicts are reported. |
| **continue** | Retrieve runs with WIP in the tree. The WIP files land in the same uncommitted set as the org diffs — do not fold them into the mirror commit; use selective `git add` paths in 3.5. |
| **abort** | Stop. Nothing has changed yet. |

### 3.4 Generate the audit doc

Once the last Phase 2 type finishes:

```bash
ALIAS="$ORG_ALIAS"
SLUG="retrieve-$(date '+%Y-%m-%d-%H%M')-$ALIAS"
DOC="changes/git/${SLUG}.md"
mkdir -p changes/git
cp changes/_templates/_TEMPLATE_retrieve.md "$DOC"
echo "Audit doc seeded at: $DOC"
```

The audit doc is THEN filled in three explicit phases — **do not collapse them into a single sweep**. On heavy days (>50 files changed), reading the whole diff at once silently misses cross-type connections (a new Apex method added for an LWC that calls it; a new field that a new DataRaptor reads; a permset grant that pairs with a FlexiPage update). The per-type-first → synthesize → fill-the-rest order below prevents those misses.

### 3.4.1 Per-type analysis (todo-driven, magnitude-ordered)

**Mandatory.** Spawn one `TodoWrite` entry per metadata type that ACTUALLY changed — skip the empty types rather than pre-populating one todo per planned phase. Each todo is worked end-to-end before moving to the next.

#### Compute magnitude

```bash
# Read the base from disk, not from $PRE_HEAD — the shell that set it may be
# long gone. An empty base makes every `git diff` below return nothing, which
# reads exactly like "the org didn't change".
DIFF_BASE=$(cat .retrieve-logs/current/_pre-head.txt)
[ -n "$DIFF_BASE" ] || { echo "no PRE_HEAD recorded — cannot compute the diff"; exit 1; }

# Total churn per type (modifications only, doesn't count untracked yet):
for dir in classes triggers lwc aura omniScripts omniIntegrationProcedures \
           omniDataTransforms layouts flexipages flows objects \
           profiles permissionsets customMetadata \
           externalCredentials namedCredentials apexEmailNotifications \
           cleanDataServices siteDotComSites; do
  churn=$(git diff --numstat "$DIFF_BASE" -- "force-app/main/default/$dir/" \
            2>/dev/null | awk '{s+=$1+$2} END{print s+0}')
  [ "$churn" -gt 0 ] && printf "  %6d  %s\n" "$churn" "$dir"
done | sort -rn

# Add new-file lines for each type that has untracked files:
git ls-files --others --exclude-standard force-app/main/default/ \
  | awk -F/ '{print $4}' | sort | uniq -c | sort -rn
```

#### Order the todos

Sort by descending magnitude (sum of churn + new-file lines). **Tie-break by blast-radius weight** when two types are within ~20% of each other:

| Weight | Types |
|---|---|
| Highest (analyze first) | ApexClass, ApexTrigger, CustomField/CustomObject (schema), permissionsets, sharingRules |
| Medium | LightningComponentBundle, AuraDefinitionBundle, OmniScript, OmniIntegrationProcedure, OmniDataTransform, flows |
| Lowest (analyze last) | profiles (usually mechanical), layouts, flexipages, customMetadata, cleanDataServices, siteDotComSites |

A high-weight type with 50 lines of churn beats a low-weight type with 100 lines of churn — the security/Apex/schema flags are the ones that bite hardest if missed.

#### Per-todo workflow

For each per-type todo, in order:

1. **List the changed files** under that type:

   ```bash
   git diff --name-only "$DIFF_BASE" -- "force-app/main/default/<dir>/"
   git ls-files --others --exclude-standard "force-app/main/default/<dir>/"
   ```

2. **Diff each file** with per-extension hints (read the actual content, don't just stat):

   | Extension | What to look for |
   |---|---|
   | `.cls` / `.trigger` | Class/method signatures, sharing keyword, `@IsTest` count, sObject DML targets, callouts to other classes (record their names) |
   | `.js` / `.html` / `.css` (LWC) | `@api` properties (exposed API), `import` paths (Apex imports → record method names), wire adapters |
   | `.os-meta.xml` / `.oip-meta.xml` | `<isActive>` flips, `<propertySetConfig>` payload changes, new/removed elements, DR/remote-action bundle swaps |
   | `.rpt-meta.xml` (DataRaptor) | `<isManagedUsingStdDesigner>` (legacy vs std designer flip — different cache layer!), `<inputType>` / `<outputType>`, field mappings |
   | `.field-meta.xml` | `<type>` (changing this on an existing field is destructive), `<trackHistory>`, `<required>`, `<unique>` |
   | `.recordType-meta.xml` | `<picklistValues>` blocks (new field added to picklist set), `<active>` |
   | `.profile-meta.xml` / `.permissionset-meta.xml` | `<allowDelete>`, `<allowEdit>`, `<allowRead>` flips on `<objectPermissions>`; new `<fieldPermissions>` with `<editable>true</editable>`; new `<classAccesses>` with `<enabled>true</enabled>` (the `<enabled>false</enabled>` ones are mechanical awareness-list noise) |
   | `.flow-meta.xml` | `<status>Active\|Draft\|Obsolete</status>` |
   | `.flexipage-meta.xml` | Component additions/removals on record pages |
   | Anything else | Plain diff; ask yourself "what behaviour does this change?" |

3. **Write a one-line "what stood out" note** for each notable file into the matching §4.X subsection of the audit doc.

4. **Record cross-type leads** as you go — a side-list of names/refs that might tie to other types. The synthesis step (§3.4.2 below) will pick these up:
   - New Apex method names, new Apex class names
   - New CustomField API names, new RecordType picklist additions
   - New IP UniqueNames, new DataRaptor names, new OmniScript subType+version
   - New LWC bundle names and the Apex imports they make (`@salesforce/apex/<ClassName>.<methodName>`)
   - New PermissionSet object/field grants (and which object/field)
   - New FlexiPage record-page changes (and which sObject's record page)

   Keep this side-list in working memory or in a scratch `.retrieve-logs/current/_crosslinks.txt` — you'll re-read it in §3.4.2.

#### Special: OmniStudio version-pair diff

When the type is `OmniScript` / `OmniIntegrationProcedure` / `OmniDataTransform` AND the diff includes a NEW `<Name>_<vN+1>.os-meta.xml` (or `.oip-meta.xml` / `.rpt-meta.xml`) alongside a deactivation flip of the existing `<Name>_<vN>.*`, RUN a version-pair diff and summarize the substantive delta. Without this, the new version reads as "+N lines from nothing" and the actual change is invisible.

```bash
# Example for an IP version pair (works the same for OS / DR):
git diff --no-index \
  force-app/main/default/omniIntegrationProcedures/MyType_MySubType_Procedure_27.oip-meta.xml \
  force-app/main/default/omniIntegrationProcedures/MyType_MySubType_Procedure_28.oip-meta.xml \
  | head -200
```

Summarize in §4.X with: which elements were added/removed, which conditional formulas changed, which DR / remote-action bundles were swapped. Note "v_N → v_N+1 (paired)" inline.

#### Special: class / file rename detection

For modified `.cls` and `.trigger` files, scan the class-declaration line on both sides of the diff. A name change inside the same file (or a filename change vs class declaration mismatch) means a rename — easy to overlook because the file path looks unchanged:

```bash
git diff "$DIFF_BASE" -- 'force-app/main/default/classes/*.cls' \
  | grep -E '^[+-]\s*(public|private|global)( (with|without|inherited) sharing)? class\s+\w+' \
  | sort
```

If you see paired `-` / `+` lines with different class names, OR if the `+` class name differs from the filename basename, flag a rename in §6.1 of the audit doc with both names. This pattern catches:

- **Casing flips** (e.g. `XMLValidationService → XmlValidationService`) where the file basename stays uppercase but the class declaration changes case. Apex compiles fine because class lookup is case-insensitive, but downstream callers may have explicitly-cased references that break.
- **Wholesale renames** where someone refactored the class name in the org's Setup UI; the file basename keeps the old name (the `ApexClass.Id` didn't change), the declaration line moved.
- **Sharing-keyword flips** that often accompany renames (`public class` → `public with sharing class` or vice versa). The sharing change is the security-relevant half — flag separately in §6.1 even when the rename itself is cosmetic.

### 3.4.2 Cross-type synthesis (after all per-type todos complete)

**Mandatory.** Spawn ONE final synthesis todo after every per-type todo has been marked `completed`. This is where the "holistic story" emerges — a new Apex method is just a new Apex method until you notice the new LWC bundle that imports it.

#### Workflow

1. **Re-read every §4.X section** you just wrote. Re-load the cross-type leads side-list from §3.4.1.
2. **Search for connections** across types. Patterns to check:

| Connection signal | What to look for | Example finding (illustrative — substitute your project's domain words) |
|---|---|---|
| New Apex method + new LWC import | LWC `.js` `import X from '@salesforce/apex/SomeClass.method'` where `SomeClass.method` is a newly-added Apex method | "The new `OrderActivationService.activate()` method + the new `orderActivationButton` LWC bundle that calls it ship the OrderActivation feature." |
| New CustomField + new picklist values + new DataRaptor | A new `<CustomField>` appearing in a new `<picklistValues>` block on RecordTypes AND being read by a new/modified DR | "New field `Priority__c` + N RecordType updates + the DR `OrderPriorityExtract_1` together extend the order-intake form." |
| New IP + new DR on same domain | New `<Name>_Procedure_N.oip-meta.xml` and a new `<NameAdjacent>_1.rpt-meta.xml` whose names share a domain word (Order / Address / Account / Case / etc. — substitute your project's domain prefixes) | "New IP `FetchOrderAddresses_Procedure_2` + new DR `OrderAddressExtract_1` together back the order-address-screen rewrite." |
| PermissionSet grant + FlexiPage update | A new `<allowDelete>true</allowDelete>` or `<fieldPermissions>` grant + a FlexiPage edit on a record page for the SAME sObject | "Coherent ship: `OrderManagementAdmin` permset gained DELETE on `Order__c` paired with the `OrderRecordPage` FlexiPage updates." |
| New Test class + relaxed visibility | A new `*Test.cls` + corresponding source class methods flipped from `private` to `public` (or `@TestVisible` added) | "Service split: `AccountValidationService` shipped with paired `*Test` after relaxing `buildInput` / `parseOutput` from `private` to `public`." |
| Cross-class coordination flag | A new `static Boolean` field on class A + an assignment to it inside class B's batch/trigger logic | "`OrderTriggerHelper.RunningFromBatch` flag wires up so the trigger suppresses rollup recalc while `OrderBatchHandler` runs." |

3. **Write findings into a NEW `### 4.11 Cross-type synthesis`** section in the audit doc. Use the table shape: *Connection* / *Types involved* / *Holistic finding*. One row per coherent feature ship the per-type sections fragmented across.
4. **Update `## 1. TL;DR`** to lead with the holistic stories rather than just headline numbers. A reader should be able to glance at the TL;DR and know "ah, today's mirror was the OoO Log feature ship + an NPDB scheduler addition" rather than just "120 files changed".

> **Note on the worked examples below.** Component names (`AuditLogService`, `Activity_Log__c`, etc.) are deliberately generic — substitute your project's actual prefixes / sObjects when applying the pattern. The structural pattern is what matters: how an Apex change + an LWC change + a permset change + a FlexiPage change cohere into "one feature ship" rather than reading as four unrelated diffs.

#### Worked example 1 — `AuditLog*` service + LWC

§4.1 noted four new ApexClasses: `AuditLogSerializer + Test`, `AuditLogService + Test`. §4.3 noted modifications to `lwc/auditLogTable/auditLogTable.js`. The LWC's `.js` imports `@salesforce/apex/AuditLogService.fetchEntries`. **Synthesis:** the four classes + the LWC together back a new audit-log surface on the admin UI; ship-rank: feature complete (paired tests + functional UI).

#### Worked example 2 — `Activity_Log__c` DELETE grant + FlexiPage

§4.8 noted `flexipages/ActivityLogRecordPage` was modified. §4.9 noted `OrderManagementAdmin.permissionset-meta.xml` gained `allowDelete: false → true` on `Activity_Log__c` (the ONLY object-permission diff in the perm set — 4 diff lines total). **Synthesis:** coherent activity-log feature ship — admins carrying the perm set can now delete activity-log records, and the record page reflects the new UI affordances.

#### Worked example 3 — Per-sObject validation service split (with class rename)

§4.1 noted yesterday's new `AccountValidationService` and today's new `ContactValidationService` — paired with the renamed `XMLValidationService → XmlValidationService` (also flagged in §6.1 as a casing rename). **Synthesis:** the team is splitting the validation surface into per-sObject variants (Account-side, Contact-side); today's `Contact` completes a symmetry that started 2 days ago with `Account`. Worth a future-state check: are there callers still routing through the renamed `Xml` service that should be migrated to the new per-sObject services?

### 3.4.3 Fill remaining sections

After §3.4.2 finishes, fill the remaining sections (header / §1 TL;DR (now informed by the synthesis) / §2 Per-phase status / §3 Source-count deltas / §5 Diff context / §6 Suspicion analysis / §7 WIP impact / §8 Warnings / §10 Follow-ups). Use the live data per the table below:

| Section | Data source |
|---|---|
| Header block | `sf org display -o "$ORG_ALIAS"` for Org ID, wall-clock totals from the per-phase tee logs |
| §1 TL;DR | Agent writes 3-6 sentences, **leading with the holistic stories from §4.11 cross-type synthesis** (filled in §3.4.2), supported by what stands out in §3 and §6 |
| §2 Per-phase status | Read each `.retrieve-logs/current/NN-*.log` for status + elapsed time |
| §3 Source-count deltas | Compare current counts (per the "Validating the run" snippet below) against the §3 table of the *previous* file in `changes/git/` |
| §4 Changes by metadata type (§4.1–§4.10) | **Already filled in §3.4.1** (one per-type todo per non-empty type). Do not redo here. |
| §4.11 Cross-type synthesis | **Already filled in §3.4.2** (the synthesis todo). Do not redo here. |
| §5 Diff context | `DIFF_BASE=$(cat .retrieve-logs/current/_pre-head.txt)` then `git diff --stat "$DIFF_BASE"..HEAD \| tail -5` |
| §6 Suspicion analysis | Run the four heuristic sets below |
| §7 WIP impact | Carry over the choice from 0.4 and the outcome from 3.6 |
| §8 Retrieve warnings | `grep -hE "Warning\|Problem" .retrieve-logs/current/*.log` cross-checked against the "Known non-fatal warnings" table |
| §9 Mirror commit reference | Filled in *after* 3.5 — leave `<short-hash>` placeholder until then |
| §10 Open follow-ups | Anything from §6 that needs human review, plus anything the agent noticed |

#### Suspicion-analysis heuristics

Run all four in sequence. Each is a read-only diff inspection — none of them blocks the commit.

```bash
DIFF_BASE=$(cat .retrieve-logs/current/_pre-head.txt)   # pre-commit working-tree comparison
[ -n "$DIFF_BASE" ] || { echo "no PRE_HEAD recorded — cannot compute the diff"; exit 1; }

# 6.1 Possibly-breaking
git diff "$DIFF_BASE" -- 'force-app/main/default/classes/*Test.cls' \
  | grep -E '^-\s+(@isTest|static testMethod void)' || true
git diff "$DIFF_BASE" -- 'force-app/main/default/classes/*.cls' \
  | grep -E '^-(public|private|global) (with|without|inherited) sharing class' || true
git diff "$DIFF_BASE" -- 'force-app/main/default/objects/*/fields/*.field-meta.xml' \
  | grep -E '^[-+]\s*<type>' || true

# 6.2 Security / access drift
git diff --stat "$DIFF_BASE" -- 'force-app/main/default/permissionsets/' \
  'force-app/main/default/profiles/' \
  'force-app/main/default/sharingRules/' \
  'force-app/main/default/roles/' \
  'force-app/main/default/groups/' || true

# 6.3 Active / status flips
git diff "$DIFF_BASE" -- 'force-app/main/default/flows/*.flow-meta.xml' \
  | grep -E '^[-+]\s*<status>' || true
git diff "$DIFF_BASE" -- 'force-app/main/default/omniScripts/*.os-meta.xml' \
  'force-app/main/default/omniIntegrationProcedures/*.oip-meta.xml' \
  | grep -E '^[-+]\s*<IsActive>' || true
git diff "$DIFF_BASE" -- 'force-app/main/default/objects/*/validationRules/*.validationRule-meta.xml' \
  | grep -E '^[-+]\s*<active>' || true

# 6.4 Structural overhauls
git diff --diff-filter=D --name-only "$DIFF_BASE" -- 'force-app/main/default/classes/*.cls' || true
git status --short -- 'force-app/main/default/objects/' \
  | grep -E '^\?\?\s.*objects/[^/]+/$' || true
git diff --stat "$DIFF_BASE" -- 'force-app/main/default/lwc/*/*.js-meta.xml' || true
# >50% line churn for IPs / OmniScripts — compare diff lines to wc -l:
for f in $(git diff --name-only "$DIFF_BASE" -- \
    'force-app/main/default/omniIntegrationProcedures/*.oip-meta.xml' \
    'force-app/main/default/omniScripts/*.os-meta.xml'); do
  churn=$(git diff --numstat "$DIFF_BASE" -- "$f" | awk '{print $1+$2}')
  size=$(wc -l < "$f" 2>/dev/null || echo 0)
  if [ -n "$churn" ] && [ "$size" -gt 0 ]; then
    pct=$((churn * 100 / size))
    [ "$pct" -gt 50 ] && echo "STRUCTURAL: $f ($pct% churn, $churn/$size lines)"
  fi
done
```

Pipe each into a scratch file and reference the relevant entries inside §6.x of the doc.

### 3.4.B Mandatory adversarial Gate B — review the finished audit

Run after §3.4.3 fills the remaining sections, and before the commits in §3.5. Unlike a normal Gate B this is not approval to deploy anything — nothing gets deployed by a retrieve. **What it reviews is the quality and honesty of the analysis**, because a mirror audit that misses a connection is worse than no audit: it looks like diligence while hiding the thing that later breaks.

Build the evidence pack — `PRE_HEAD` from `.retrieve-logs/current/_pre-head.txt` as the base, the per-type churn table, `_footprint.tsv`, and the `.retrieve-logs/current/` log set — then launch three independent critics in one parallel fan-out with these lenses:

1. **Per-type analysis depth** — attack shallow "file X changed" notes that never say what *behavior* changed. Every notable file should name the concrete risk: a sharing-keyword flip, a field `<type>` change, an `<isActive>` flip, a new `<fieldPermissions>` grant. Notes that restate the filename are findings.
2. **Cross-type synthesis completeness** — attack missed connections the synthesis should have caught: an Apex method added alongside the LWC that imports it, a new field read by a new DataRaptor, an IP and DR sharing a domain word, a permset grant paired with a FlexiPage edit on the same sObject. Findings here name the specific pair that was left unlinked.
3. **Mirror and commit honesty** — attack overstated coverage and staging errors: a type reported `Succeeded` with 0 files being counted as covered, Omni completeness claimed on a Vlocity CMT org, WIP about to be folded into the mirror commit, changed paths omitted from the staging list, or an exclusion in §3 with no recorded reason.

Verify each finding against the actual diff before acting on it, rebut rather than silently dropping, and escalate to the user after three unresolved rounds. Record critic IDs, the revision reviewed, verdicts, dispositions, and round counts in audit-doc §6.5. Critical/High findings block the commits until fixed or rejected with evidence; a failed or timed-out critic does not count toward the three.

### 3.5 Two-commit pattern

#### Commit 1 — the mirror snapshot

```bash
# Stage everything the retrieve touched, excluding the brand-new audit doc.
# Don't stage .retrieve-logs/ — it stays gitignored (raw output is noisy;
# the audit doc §8 carries the warning content inline).
git add force-app/ manifest/ config/  # adjust to what the retrieve touched
git reset -- changes/git/  # ensure the audit doc itself is NOT in this commit
git status -s

git commit -m "$(cat <<'EOF'
mirror(<sandbox-alias>): sync from <sandbox-alias> @ YYYY-MM-DD HH:MM

Org-wide metadata retrieve via the phase plan in docs/sf-org-mirror-retrieve.md.
Triggered by: <user>. Wall-clock: ~XX min. All phases Succeeded / Partial (see audit doc).

Source counts after retrieve:
  ApexClass: NNN  ApexTrigger: NN  LWC: NNN  OmniScript: NNN
  OmniIntegrationProcedure: N,NNN  OmniDataTransform: N,NNN
  CustomObject: NNN folders  CustomField: N,NNN

See accompanying audit doc (next commit) for full breakdown.
EOF
)"

MIRROR_SHORT=$(git log -1 --format='%h')
MIRROR_FULL=$(git log -1 --format='%H')
echo "Mirror commit: $MIRROR_SHORT"
```

If the user chose **continue** in 3.1 (WIP not stashed), use selective `git add` paths instead of `git add force-app/` — for example `git add $(git diff --name-only HEAD -- force-app/ | grep -v <wip-files>)`.

#### Embed the hash, then commit the doc

Open the audit doc and replace `<short-hash>` placeholders in the header block and §9 with `$MIRROR_SHORT`. The §9 table also needs `$MIRROR_FULL`, the commit subject, and the file-changed counts — pull those with:

```bash
git log -1 --format='%H%n%h%n%s%n%an%n%ad' --date=iso-local "$MIRROR_FULL"
git show --stat "$MIRROR_FULL" | tail -1
```

#### Commit 2 — the audit doc

```bash
git add "$DOC"
git status -s   # should show only this one file

git commit -m "$(cat <<EOF
docs(retrieve): audit <sandbox-alias> mirror @ YYYY-MM-DD HH:MM (refs ${MIRROR_SHORT})

Snapshot record of the org-wide retrieve described in
docs/sf-org-mirror-retrieve.md. References mirror commit ${MIRROR_SHORT}.

Saved at: ${DOC}
Wall-clock: ~XX min.  Phases: <M> of <N planned> (see doc §2).
Notable: <one-line carried over from doc TL;DR>
EOF
)"

DOC_SHORT=$(git log -1 --format='%h')
echo "Audit-doc commit: $DOC_SHORT"
echo "Mirror commit:    $MIRROR_SHORT"
```

#### Verify clean tree

```bash
git log -2 --format='%H%n  %h  %s%n'
git status -s
```

Report both hashes back to the user.

### 3.6 Pop WIP (if stashed in 0.4)

```bash
if git stash list | grep -q "pre-retrieve-"; then
  git stash pop
  # If conflicts surface, list them:
  git status --short | grep '^UU' || echo "Pop clean."
fi
```

Update §7 of the audit doc with the pop result (clean / conflict list). If conflicts appeared, this is a `git commit --amend` to the doc commit only — not a new commit.

---

## CustomField fallback — only if a single type hits the 10k limit

If a single `--metadata CustomField` retrieve fails with `LIMIT_EXCEEDED` or returns truncated results, shard by object family. Top folders by `.field-meta.xml` count are typically the standard high-volume objects (Account, Contact, Case) plus your custom `*__c` ones.

```bash
sf project retrieve start \
  --metadata 'CustomField:Account.*' \
  --metadata 'CustomField:Contact.*' \
  --metadata 'CustomField:Case.*' \
  -o "$ORG_ALIAS" --wait 120
```

Then repeat in batches of ~6 objects until you've covered them all. To list candidates:

```bash
find force-app/main/default/objects -name '*.field-meta.xml' \
  | awk -F/ '{print $5}' | sort | uniq -c | sort -rn | head -30
```

The generated `CustomField:<Object>.*` shard manifests enumerate your org's real object API names, so they are **project-only** — keep them in your repo, and never ship them in a shared bootstrap kit.

---

## Validating the run

After every planned call finishes, check for failures:

```bash
echo "=== Failures (none expected) ==="
grep -l "Status: Failed" .retrieve-logs/current/*.log 2>/dev/null || echo "None"

echo "=== Real errors ==="
grep -hE "(LIMIT_EXCEEDED|MalformedQueryException|FATAL|too large)" \
  .retrieve-logs/current/*.log 2>/dev/null || echo "(none)"
```

Then snapshot final source counts (compare against the previous run to spot what changed in the org):

```bash
echo "=== Final source counts ==="
echo "ApexClass:"                $(ls force-app/main/default/classes/*.cls 2>/dev/null | wc -l)
echo "ApexTrigger:"              $(ls force-app/main/default/triggers/*.trigger 2>/dev/null | wc -l)
echo "LWC bundles:"              $(ls -d force-app/main/default/lwc/*/ 2>/dev/null | wc -l)
echo "Aura bundles:"             $(ls -d force-app/main/default/aura/*/ 2>/dev/null | wc -l)
echo "OmniScript:"               $(ls force-app/main/default/omniScripts/*.os-meta.xml 2>/dev/null | wc -l)
echo "OmniIntegrationProcedure:" $(ls force-app/main/default/omniIntegrationProcedures/*.oip-meta.xml 2>/dev/null | wc -l)
echo "OmniDataTransform (DRs):"  $(ls force-app/main/default/omniDataTransforms/*.rpt-meta.xml 2>/dev/null | wc -l)
echo "Layout:"                   $(ls force-app/main/default/layouts/*.layout-meta.xml 2>/dev/null | wc -l)
echo "FlexiPage:"                $(ls force-app/main/default/flexipages/*.flexipage-meta.xml 2>/dev/null | wc -l)
echo "Flow:"                     $(ls force-app/main/default/flows/*.flow-meta.xml 2>/dev/null | wc -l)
echo "Profile:"                  $(ls force-app/main/default/profiles/*.profile-meta.xml 2>/dev/null | wc -l)
echo "PermissionSet:"            $(ls force-app/main/default/permissionsets/*.permissionset-meta.xml 2>/dev/null | wc -l)
echo "CustomObject folders:"     $(ls -d force-app/main/default/objects/*/ 2>/dev/null | wc -l)
echo "CustomField:"              $(find force-app/main/default/objects -name '*.field-meta.xml' 2>/dev/null | wc -l)
echo "ExternalCredential:"        $(ls force-app/main/default/externalCredentials/*.externalCredential-meta.xml 2>/dev/null | wc -l)
echo "ExternalClientApplication:" $(ls force-app/main/default/externalClientApps/*.eca-meta.xml 2>/dev/null | wc -l)
echo "ApexEmailNotifications:"    $(ls force-app/main/default/apexEmailNotifications/*.notifications-meta.xml 2>/dev/null | wc -l)
```

---

## Known non-fatal warnings (do **not** re-run for these)

These appear as `Warnings` rows in the retrieve output. They're metadata API edge cases, not bugs in your retrieve, and don't affect the files that did come down.

| Warning fragment | Cause | Action |
|---|---|---|
| `Retrieve not allowed on channel ActivityEngagementVirtualChannel` | Salesforce internal channel that can't be retrieved unpackaged | Ignore |
| `Metadata API received improper input. … Load of metadata from db failed for … ConnectedApp … CPQIntegrationUserApp / Salesforce_CLI` | System ConnectedApps marked as packaged-only | Ignore |
| `Entity type 'LiveChatAgentConfig' / 'LiveChatButton' / 'LiveChatDeployment' is not available in this organization` | Live Agent not licensed in this org | Ignore |
| `A SiteDotCom site using template [Build Your Own (LWR)] does not support MD API Retrieval` | LWR sites are managed via Experience Cloud Build tools, not MD API | Ignore |
| `Entity of type 'CustomMetadata' named '<YourCMDT>.…' cannot be found` | Stale references in the master `fullpackage.xml` to CMDT entries that were deleted in the org | Ignore (or clean the manifest) |
| `Entity of type 'ListView' named '…' cannot be found` (~100 of these) | Installed-package objects whose stock list views aren't actually customized in the org | Ignore |
| `Can't retrieve non-customizable CustomObject named: DecisionTblFileImportData` | System object — by design not retrievable | Ignore |
| `Unable to retrieve file for id 0qhOv… of type OmniScript. Retrieving OmniProcessElement found more than 1000` | Vlocity OmniScript with >1000 child elements; known platform limit | Ignore — open the affected OmniScripts in OmniStudio Designer if you need them |
| `Metadata API received improper input. … Load of metadata from db failed for metadata of type:OmniScript and file name:<YourType>_<YourSubType>_English_<N>` | OmniScript with a name that breaks the metadata file naming rules (often happens to OmniScripts whose subType contains characters the MD API can't round-trip) | Ignore |
| `You do not have the proper permissions to access Layout.` (×2) | Managed-package layouts the running user can't see | Ignore (or run as a higher-privilege user) |
| `Entity of type 'QuickAction' named '<sObject>.<QuickActionApiName>' cannot be found` | Stale manifest reference (the QuickAction was deleted from the org but still listed in your `manifest/fullpackage.xml`) | Ignore (or clean the manifest) |

> **Exceeding `--wait` is not a failure, and re-running is harmful.** `--wait` bounds how long the CLI polls, nothing more — when it lapses the CLI hands back your terminal while **the retrieve keeps running server-side**. Starting the same type again puts two retrieves in flight against one working tree, which is the `.git/index` corruption that Hard lesson 1 warns about. Resume instead:
>
> ```bash
> sf project retrieve resume --use-most-recent -o "$ORG_ALIAS"
> ```

Only `LIMIT_EXCEEDED`, `MalformedQueryException`, `FATAL`, `too large`, or an explicit `Status: Failed` are real failures. For those, re-run that single type:

```bash
sf project retrieve start --metadata <Type> -o "$ORG_ALIAS" --ignore-conflicts --wait 240 \
  2>&1 | tee .retrieve-logs/current/<NN>-<type>-retry.log | grep -E "Status: (Succeeded|Failed)"
```

If it still fails on size, fall back to the per-object sharding pattern from the **CustomField fallback** section above.

---

## Skipped types (intentional, per this runbook)

These are **not** retrieved by the runbook because they're large, change rarely, and rarely matter for code work:

- `Translations` (the user-facing language pack — distinct from `CustomObjectTranslation`)
- `Report`, `ReportFolder`, `ReportType`, `Dashboard`, `DashboardFolder`, `AnalyticSnapshot`
- `EmailTemplate`, `EmailFolder`, `Letterhead`
- `Document`, `DocumentFolder`
- `StaticResource`, `ContentAsset`
- `Prompt`

If you specifically need any of these (e.g. you're auditing report folders or rolling out a new `EmailTemplate`), add it as a one-off retrieve:

```bash
sf project retrieve start --metadata <SkippedType> -o "$ORG_ALIAS" --wait 120
```

---

## How long it takes

There is no useful universal estimate. Total wall-clock is a product of your org's component count, its current load, and how many calls your shard plan needs — and it swings several-fold on the same org between a quiet morning and a business-hours window with batch jobs running.

Get your number the only way that works: read §2 of the most recent audit doc in `changes/git/`. That is your org's real baseline, measured on your org. The first mirror into an empty repo runs substantially longer than reruns because every component is `Created` rather than `Changed`.

The runbook is **background-friendly** — start it and keep working. It writes Status to the terminal in real time and full output to `.retrieve-logs/current/` (with the previous run rotated to `.retrieve-logs/archive/<TS>/` during pre-flight).

---

## Pre-flight WIP handling

The default flow lives in [Phase 0.4](#04-wip-check-interactive--capture-pre_head) (stash + pop / continue / abort). Two additional patterns for cases the default doesn't cover:

**Commit WIP to a temporary branch first** — best when you want to diff your edits against org state afterwards:

```bash
git checkout -b pre-retrieve-$(date +%F)
git add -A && git commit -m "WIP before full retrieve"
git checkout -    # back to your working branch
# ... run retrieve ...
# use: git diff pre-retrieve-<date> -- <path>  to see what got overwritten
```

**Accept overwrite** — fine if your WIP is committed locally on a feature branch you can recover from `git reflog`. Pick the **continue** option in Phase 0.4, then use selective `git add` paths during Phase 3.5 so your WIP files don't end up in the mirror commit.

To audit afterwards (works for any of the three approaches):

```bash
git status --short | wc -l                          # total churn
git diff HEAD --stat | tail -20                     # breakdown
git log --oneline HEAD@{1}..HEAD 2>/dev/null        # any commits during retrieve
```

---

## Adapting this runbook to a different org

1. **Set your `ORG_ALIAS` env var** in the new shell (see [Setup](#setup--set-your-org-alias-once)). All commands in this runbook will then work as-is — no editing needed.
   ```bash
   export ORG_ALIAS=YourAliasHere
   echo "$ORG_ALIAS"     # confirm it printed what you expected
   ```
2. **Confirm the manifest shards exist** at `manifest/fullpackage/`. If not, copy them from a repo that has them, or build your own. The shard files are pure metadata-type-name lists with `<members>*</members>` — no org-specific content.
3. **Run Phase 0.3 discovery — always.** This is the step that adapts the runbook to the new org. Its output decides which types are supported, which are solo, which bundle, and which are excluded. Skipping it and reusing another org's split is the single most common way this workflow fails.
4. **Re-shard heavy types if the footprint demands it.** A type near the 10k cap needs the per-object pattern in the [CustomField fallback](#customfield-fallback--only-if-a-single-type-hits-the-10k-limit).
5. **Expect the first run to be slower** than reruns — every component is `Created` rather than `Changed`.
6. **Add `.retrieve-logs/` to `.gitignore`** in the new repo.
7. **Don't run two retrieves to the same org concurrently** — they serialize on the org side and frequently fail with timeouts.
8. **Open a fresh shell per org** (or re-export `ORG_ALIAS`) — the env var doesn't follow you across terminals.

Org-measured artifacts stay with the project, never with the kit. Sharded manifests that enumerate real object API names (the `CustomField:<Object>.*` variety) are generated per-org by the fallback pattern below — they are not part of the shared bootstrap kit, because they would carry one org's entire object inventory into every other project.

---

## Related references

- `.cursor/rules/sf-cli-commands.mdc` — canonical `sf` CLI reference (every flag, every command).
- `.cursor/rules/apex-development.mdc` — Apex deploy + test workflow (the inverse direction).
- `.cursor/rules/adversarial-review.mdc` — the Gate A / Gate B protocol this runbook invokes.
- `manifest/fullpackage.xml` — seed master manifest listing the metadata types to consider.
- `manifest/fullpackage/` — pre-sharded versions of the seed master manifest.
- `changes/git/` — previous audit docs; the most recent one is your org's real baseline for counts and timings.

---

## Quick checklist (TL;DR)

```text
[ ]  Phase 0.0 — Spawn the explicit TodoWrite plan FIRST (mandatory; see §0.0). Long-running, resumable on failure.
[ ]  export ORG_ALIAS=<your-alias>         → set once at top of shell
[ ]  echo "$ORG_ALIAS"                     → confirm it printed (empty = silently hits your DEFAULT org)
[ ]  Phase 0.1 — sf org list --all         → confirm Connected
[ ]  Phase 0.2 — rotate .retrieve-logs/current/ → archive/<TS>/; mkdir -p .retrieve-logs/current changes/git
[ ]  Phase 0.3 — FOOTPRINT DISCOVERY       → supported types, live counts, gap lists, OmniStudio flavour
[ ]  Phase 0.4 — WIP check (interactive)   → stash+pop / continue / abort;  capture PRE_HEAD to a file
[ ]  Phase 0.5 — build the shard plan FROM the footprint (solo vs bundled vs excluded + reasons)
[ ]  Phase 0.A — adversarial Gate A        → 3 parallel critics: coverage / limits+ordering / safety+truthfulness
[ ]  Phase 1 — bundled small-type shards, sequential          (one todo per shard, from your plan)
[ ]  Phase 2 — solo heavy types, lightest → heaviest          (one todo per type, from your plan)
                 CustomObject MUST precede CustomField;  Profile LAST
                 Omni types: only if MDAPI-backed — skip entirely on Vlocity CMT
[ ]  grep -l "Status: Failed" .retrieve-logs/current/*.log    → expect "None"
[ ]  Phase 3.4   — generate audit doc      → cp template → changes/git/retrieve-<date>-<time>-<alias>.md
[ ]  Phase 3.4.1 — per-type analysis       → one todo per type that ACTUALLY changed
[ ]  Phase 3.4.2 — cross-type synthesis    → §4.11
[ ]  Phase 3.4.3 — fill §1-§10             → record YOUR counts and timings; no borrowed numbers
[ ]  Phase 3.4.B — adversarial Gate B      → 3 parallel critics: analysis depth / synthesis / mirror honesty
[ ]  Phase 3.5 — commit 1 (mirror)         → explicit git add paths; commit; capture $MIRROR_SHORT
[ ]  Phase 3.5 — embed hash in doc         → replace <short-hash> in header + §9
[ ]  Phase 3.5 — commit 2 (audit doc)      → git add changes/git/<file>; commit referencing $MIRROR_SHORT
[ ]  Phase 3.6 — pop WIP if stashed        → git stash pop; report conflicts (if any) in doc §7
[ ]  Report both commit hashes back to the user
```
