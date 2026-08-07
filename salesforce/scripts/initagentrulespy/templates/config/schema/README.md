# Salesforce Schema Reference

This directory contains the org's schema split into small, focused TOON
files for AI agent consumption. The strict reading sequence (which file
to open for what task) is enforced by the always-applied rule
[`.cursor/rules/salesforce-schema-validation.mdc`](../../.cursor/rules/salesforce-schema-validation.mdc) —
read that rule once and follow it every time.

> **Format:** TOON (Token-Oriented Object Notation, v3.0). All files in
> this directory are TOON-encoded — see
> [`https://github.com/toon-format/spec`](https://github.com/toon-format/spec)
> for the grammar. TOON encodes the JSON data model with explicit array
> lengths and a single tabular block per uniform array, achieving
> 30-60% token reduction vs JSON / YAML while staying human-readable.
> TOON has no comment syntax, so each document embeds a `metadata:`
> block at the bottom instead of a header banner.

## Layout (per object: 7 files max)

```
config/schema/
├── _index.toon                  # Master index of every object + companion files
├── _search_index.toon           # Lightweight cross-object field search
├── _junctions.toon              # Detected junctions + parent FKs + record counts (Step 11)
├── objects/<ObjectName>/
│   ├── schema.toon              # ALWAYS — slim index: object meta, counts, file pointers
│   ├── fields.toon              # ALWAYS — every field as one tabular row; lookups link to parent schema.toon
│   ├── record_types.toon        # only if record_types is non-empty
│   ├── validation_rules.toon    # only if validation_rules is non-empty
│   ├── related_relationships.toon  # only if there's at least one incoming reference
│   ├── picklists.toon           # only if any field has picklist values
│   └── formulas.toon            # only if any field is a calculated formula
└── categories/                  # Objects grouped by category
    ├── core.toon                # Account, Contact, Lead, User, Group, Profile
    ├── sales.toon               # Opportunity, Quote, Order, Product2, ...
    ├── service.toon             # Case, Entitlement, WorkOrder, ...
    ├── ns_<namespace>.toon      # One file per managed-package namespace (auto-detected)
    ├── custom.toon              # Plain custom (__c) objects with no namespace
    └── other.toon               # Everything else

ER.md (project root)             # Mermaid ER diagram of every detected junction (Step 12)
```

## Reading rules (the strict sequence)

The full enforceable version lives in
[`.cursor/rules/salesforce-schema-validation.mdc`](../../.cursor/rules/salesforce-schema-validation.mdc)
(`alwaysApply: true`). Summary:

1. ALWAYS open `schema.toon` first — it is the slim index. It tells you
   what other files exist for this object and how many entries each
   contains.
2. Open `fields.toon` whenever you reference a field by name, type, or
   constraint. It is one tabular block: one row per field, columns are
   the union of every key any field uses on this object. Empty cells
   mean "not applicable" (encoded as the empty string).
3. For every Lookup / MasterDetail row in `fields.toon`, the
   `reference_path` cell contains the relative path to the parent
   object's `schema.toon`. Open that file to traverse — never guess
   what the parent looks like.
4. Open `picklists.toon` whenever you reference a Picklist or
   MultiselectPicklist field — read or write. See "Field-driven
   mandatory reads" and "Count interpretation" below.
5. Open `record_types.toon` whenever you reference RecordTypeId or set
   RecordType behavior on an object. Use `api_name` (DeveloperName) at
   runtime; never hardcode the Id.
6. Open `validation_rules.toon` only after a deploy fails on a
   validation error.
7. Open `related_relationships.toon` to traverse parent → child (i.e. to
   answer "what objects point AT this one").
8. Open `formulas.toon` only when a calculated field's behavior is
   surprising.
9. For cross-object relationships at a glance, read
   [`_junctions.toon`](_junctions.toon) (programmatic) or
   [`../../ER.md`](../../ER.md) (mermaid).

## Field-driven mandatory reads

Whenever you SEE one of these on a row in `fields.toon`, you MUST open
the named file BEFORE writing or referencing that field in any way
(read or write):

| Field shape | MUST open |
|---|---|
| `type: Picklist` | `picklists.toon` — find the field name in the `picklists:` block. NEVER use a value not listed there. |
| `type: MultiselectPicklist` | `picklists.toon` — find the field name in the `multipicklists:` block. NEVER use a value not listed there. |
| `api_name: RecordTypeId` | `record_types.toon` — use `api_name` (DeveloperName) at runtime. Never hardcode the Id. |
| `type: Lookup` or `MasterDetail` | follow the `reference_path` cell to the parent's `schema.toon` and re-enter from the top. |

The full enforceable version of this trigger table lives in the
always-applied rule [`.cursor/rules/salesforce-schema-validation.mdc`](../../.cursor/rules/salesforce-schema-validation.mdc).

## File shapes

### `schema.toon` (slim index, always present)

```
object:
  api_name: <ObjectApiName>
  type: Standard|Custom|CustomMetadata|PlatformEvent
  label: <Object Label>
  description: <Object description or empty>
counts:
  fields: <N>
  record_types: <N>
  validation_rules: <N>
  related_relationships: <N>
  picklists: <N>          # number of fields that have picklist values
  formulas: <N>           # number of calculated fields
files:
  fields: fields.toon     # always present
  record_types: record_types.toon | null
  validation_rules: validation_rules.toon | null
  related_relationships: related_relationships.toon | null
  picklists: picklists.toon | null
  formulas: formulas.toon | null
metadata:
  generated_date: <ISO8601>
  layout_version: 2
```

### `fields.toon` (one tabular block, lookups linked to parent)

```
fields[N]{api_name,type,label,help_text,required,unique,external_id,length,precision,scale,reference_to,reference_path,relationship_name,delete_constraint,default_value,description,controlling_field}:
  AccountId,Lookup,Account ID,Account associated with this record.,false,false,false,18,,,Account,objects/Account/schema.toon,,,,,
  Name,Text,Name,Display name.,true,false,false,80,,,,,,,,,
  OwnerId,Lookup,Owner ID,,false,false,false,,,,Group|User,objects/Group/schema.toon|objects/User/schema.toon,,,,,
metadata:
  object: <ObjectApiName>
  field_count: <N>
  null_encoding: empty_string
  polymorphic_separator: "|"
```

Encoding rules:
- Polymorphic `reference_to` (multi-target) is pipe-separated. The
  parallel `reference_path` cell is also pipe-separated, slot-aligned
  with `reference_to`.
- Missing values are empty strings (TOON tabular requires every row to
  carry every column).
- All cells are primitives (no nested arrays / objects in cells).

### `picklists.toon` — two blocks, value + label always paired

`picklists.toon` carries TWO top-level blocks:

- `picklists:` — single-select picklist fields. Countable via SOQL `GROUP BY`.
- `multipicklists:` — multi-select picklist fields. NOT countable (no per-value counts ever).

Every value-row in either block has BOTH `label` (display text users see) and `value` (the API/DB string). They commonly differ (`value: PCP`, `label: Primary Care Physician`); use `value` in code/SOQL/DML and `label` for display.

When usage counts are available for the `picklists:` block (Step 10 has run):

```
picklists:
  Status:
    values[2]{label,value,count}:
      Open,Open,3421
      Closed,Closed,1892
  OrderLineItem__c:
    values[3]{label,value,count}:
      Primary Care Physician,PCP,897
      Specialist,Specialist,514
      Dual,Dual,215
multipicklists:
  Tags:
    values[3]{label,value}:
      Tag A,tag_a
      Tag B,tag_b
      Tag C,tag_c
metadata:
  object: <ObjectApiName>
  picklist_count: 2
  multipicklist_count: 1
  picklists_usage_status: live_counts
  multipicklists_usage_status: not_applicable
  picklists_usage_collected_date: <ISO8601>
```

When usage counts are NOT available for the `picklists:` block (Step 10 hasn't run yet, or queries failed):

```
picklists:
  Status:
    values[2]{label,value}:
      Open,Open
      Closed,Closed
multipicklists:
  Tags:
    values[3]{label,value}:
      Tag A,tag_a
      Tag B,tag_b
      Tag C,tag_c
metadata:
  object: <ObjectApiName>
  picklist_count: 1
  multipicklist_count: 1
  picklists_usage_status: not_collected
  picklists_usage_not_collected_reason: pending  # or no_query_access / empty_object / query_error
  multipicklists_usage_status: not_applicable
```

The inline `[N]: a,b,c` form is RETIRED entirely — every picklist sub-block is tabular so `label` and `value` are always visible. The `multipicklists:` block is always inline-equivalent (`{label,value}` form, no count column ever) because SOQL cannot `GROUP BY` a multi-select picklist field.

### `record_types.toon` — every row already has api_name + label + count

`api_name` is the DeveloperName — the stable identifier you use in Apex (`Schema.SObjectType.X.getRecordTypeInfosByDeveloperName().get('<api_name>').getRecordTypeId()`). Treat `api_name` as the "value" half of the value+label pair.

When usage counts are available (Step 10 has run):

```
record_types[N]{api_name,label,description,active,record_count}:
  StandardRecordType,Standard Record Type,...,true,1248
  DeprecatedRT,Deprecated RT,...,true,0
  ...
metadata:
  object: <ObjectApiName>
  record_type_count: <N>
  usage_status: live_counts
  record_type_counts_collected_date: <ISO8601>
```

When usage counts are NOT available:

```
record_types[N]{api_name,label,description,active}:
  StandardRecordType,Standard Record Type,...,true
  ...
metadata:
  object: <ObjectApiName>
  record_type_count: <N>
  usage_status: not_collected
  usage_not_collected_reason: pending  # or no_query_access / empty_object / query_error
```

## Count interpretation (the only sanctioned reading)

`metadata.picklists_usage_status` (in picklists.toon) and `metadata.usage_status` (in record_types.toon) carry the same enum:

- `live_counts` — count column is present and reflects real org counts as of `*_collected_date`.
  - `count: 0` (or `record_count: 0`) means the value/RecordType is DECLARED but ZERO records use it. Treat as deprecated unless seeding a brand-new picklist/RecordType.
  - `count > 0` (or `record_count > 0`) means the value is in active use.
- `not_collected` — count column is absent. NEVER infer "deprecated" from absence of a count. `*_not_collected_reason` (optional) explains: `pending` (Step 10 hasn't run), `no_query_access` (the org user can't query), `empty_object` (object has 0 records), `query_error` (other SOQL failure).
- `not_applicable` — only on picklists.toon's `picklists_usage_status` when there are no single-select picklists, OR on `multipicklists_usage_status` always (multi-select picklists can't be counted via SOQL).

To refresh stale counts: `python3 scripts/schemapy/auto_generate_schema.py` (full pipeline ~50 min) or `python3 scripts/schemapy/collect_usage_stats.py --org <alias> --objects <ObjA>,<ObjB>` (targeted, fast).

### `validation_rules.toon`

```
validation_rules[N]{name,active,description,error_condition_formula,error_message}:
  ...
metadata:
  object: <ObjectApiName>
  validation_rule_count: <N>
```

### `related_relationships.toon`

```
related_relationships[N]{from_object,from_field,to_object,relationship_type,relationship_name,delete_constraint}:
  ChildObject,ParentLookupField,<ObjectApiName>,Lookup,ChildRelName,SetNull
  ...
metadata:
  object: <ObjectApiName>
  related_relationship_count: <N>
```

### `formulas.toon`

```
formulas:
  FieldApiName: <formula expression as TOON-quoted string>
metadata:
  object: <ObjectApiName>
  formula_count: <N>
```

## Companion files (cross-object artifacts)

- [`_index.toon`](_index.toon): every object with `files: { ... }` block
  pointing at all 7 files (with `null` for missing optional ones).
- [`_search_index.toon`](_search_index.toon): lightweight cross-object
  field index for fuzzy lookups.
- [`_junctions.toon`](_junctions.toon): every detected junction object,
  its parent FKs, record counts, confidence tier, and an auto-derived
  one-line note. See Step 11 (`scripts/schemapy/detect_junctions.py`).
- [`../../ER.md`](../../ER.md): mermaid ER of every junction grouped by
  confidence. Read this first when modelling new relationships.

## File-size profile

- `schema.toon`: ~10-25 lines (always small)
- `fields.toon`: ~1 + N + 5 lines, dominated by N (one row per field)
- `record_types.toon`: ~1 + N + 4 lines (rare, usually small)
- `validation_rules.toon`: ~1 + N + 4 lines
- `related_relationships.toon`: ~1 + N + 4 lines
- `picklists.toon`: variable; smaller when usage counts merge same-line
- `formulas.toon`: ~1 + N + 4 lines

This 7-file split typically yields 70-90% fewer lines per object than
the prior single-`schema.toon` layout, because field metadata is no
longer repeated key-by-key on every row.

## Regeneration

This schema is auto-generated. To regenerate:

```bash
# Full regeneration (retrieves from org + generates schema + splits)
python3 scripts/schemapy/auto_generate_schema.py

# Just re-split existing schema
python3 scripts/schemapy/split_schema_by_object.py
```

Install Python dependencies first if needed:

```bash
pip install -r scripts/schemapy/requirements.txt
```

## Metadata

- **Generated:** 2026-08-07T12:50:58.320151
- **Total Objects:** 1016
- **Source:** {{WORKSPACE_PATH}}/config/salesforce-er-schema.toon
- **Format:** TOON (Token-Oriented Object Notation, v3.0)
- **Layout version:** 2 (7-file split with tabular `fields.toon`)
