# Salesforce Schema Scripts

This directory contains automation scripts for Salesforce schema management and enrichment.

## Available Scripts

### 1. `auto_generate_schema.py` ⭐ **Main Orchestrator**

**Fully automated** Salesforce schema generation with 9 integrated steps:

1. Detects your default org from `.sf/config.json`
2. Detects objects directory
3. Queries org for all sObjects
4. Filters objects (excludes History, Share, Feed, etc.)
5. Checks existing local metadata
6. Retrieves missing objects from Salesforce
7. Generates complete ER schema YAML
8. Splits schema into individual object files
9. **Enriches schemas with picklist values & metadata** ⭐

**Usage:**
```bash
# Just run it - no inputs required!
python3 scripts/auto_generate_schema.py
```

That's it! The script automatically:
- Uses your configured default org
- Retrieves all objects
- Generates and splits schema
- **Enriches with active picklist values**

### 2. `enrich_schema_with_picklists.py` (Automatically Called by Step 9 Above)

Enriches existing Salesforce schema YAML files with complete metadata from the org.

**IMPORTANT:** This script is automatically called by `auto_generate_schema.py` as **Step 9**.
You typically don't need to run it manually unless updating specific objects.

**What it adds:**
- Picklist values (**ACTIVE ONLY** - inactive values excluded)
- Formula definitions
- Default values
- Field constraints (required, unique, externalId)
- Field length, precision, scale
- Lookup relationships
- Field dependencies (controlling/dependent picklists)

**Manual Usage (when needed):**
```bash
# Enrich all objects (auto-detects org from .sf/config.json)
python3 scripts/enrich_schema_with_picklists.py

# Enrich all objects with explicit org
python3 scripts/enrich_schema_with_picklists.py --org IBXDev_Maaz

# Enrich specific objects only
python3 scripts/enrich_schema_with_picklists.py --objects HealthcareProviderNpi,Account,Contact

# Dry run (preview changes without modifying files)
python3 scripts/enrich_schema_with_picklists.py --dry-run

# Use custom schema directory
python3 scripts/enrich_schema_with_picklists.py --schema-dir custom/schema/path
```

**Note:** The `--org` parameter is now **optional**. The script auto-detects your org from:
- `.sf/config.json` (SF CLI v2), or
- `.sfdx/sfdx-config.json` (legacy)

If no org is found, you'll be prompted to either:
1. Set a default org: `sf config set target-org YourOrg`, or
2. Provide `--org` parameter explicitly

**Requirements:**
- Salesforce CLI (`sf`) installed and authenticated
- Python 3.7+
- PyYAML: `pip install pyyaml`

**SF CLI Command Used:**
```bash
sf sobject describe --sobject <ObjectName> --target-org <org> --json
```

### 3. `split_schema_by_object.py` (Automatically Called by Step 8 Above)

Splits monolithic schema file into individual object files for AI agent consumption.

**Typically called automatically by `auto_generate_schema.py`.**

## Common Workflows

### Workflow 1: Generate Complete Schema (RECOMMENDED) ⭐

**Scenario:** You want to generate or update your entire schema with all metadata.

```bash
# Just run the main orchestrator - it does everything!
python3 scripts/auto_generate_schema.py
```

This single command:
1. Detects your org
2. Retrieves all objects
3. Generates complete schema
4. Splits into individual files
5. **Enriches with active picklist values automatically**

**Result:** Complete, enriched schema in `config/schema/` directory.

### Workflow 2: Update Specific Objects Only

**Scenario:** You've added new picklist values or fields for specific objects in the org.

```bash
# Preview what will be added (dry run) - org auto-detected
python3 scripts/enrich_schema_with_picklists.py --objects HealthcareProviderNpi --dry-run

# Enrich specific objects - org auto-detected
python3 scripts/enrich_schema_with_picklists.py --objects HealthcareProviderNpi,Account

# Review changes
git diff config/schema/objects/HealthcareProviderNpi.yaml

# Commit if satisfied
git add config/schema/objects/HealthcareProviderNpi.yaml
git commit -m "Updated picklist values for HealthcareProviderNpi.NpiType"
```

**Note:** No need to specify `--org` - it's auto-detected from `.sf/config.json`!

### Workflow 3: Add Missing Picklist Values to Existing Schema

**Scenario:** Your schema files exist but are missing picklist values (e.g., schema was generated before enrichment feature).

```bash
# Step 1: Preview what will be added (dry run) - org auto-detected
python3 scripts/enrich_schema_with_picklists.py --dry-run

# Step 2: Enrich all objects - org auto-detected
python3 scripts/enrich_schema_with_picklists.py

# Step 3: Review summary statistics
# Script will print:
# ✓ Auto-detected org: IBXDev_Maaz (from .sf/config.json)
# - Objects processed
# - Fields enriched
# - Picklists added (ACTIVE values only)
# - Errors encountered

# Step 4: Review and commit changes
git diff config/schema/objects/
git add config/schema/objects/
git commit -m "Enriched schemas with active picklist values"
```

**Note:** The script automatically detects your org, making it easier to run!

## SF CLI Commands Reference

Comprehensive reference for Salesforce metadata extraction using SF CLI.

### 1. Field Metadata (Picklists, Formulas, Types)

**Get all fields for an object:**
```bash
# Method 1: Describe command (fastest, most complete)
sf sobject describe --sobject Account --target-org YourOrg --json

# Method 2: Query FieldDefinition
sf data query --query "SELECT QualifiedApiName, DataType, Label FROM FieldDefinition WHERE EntityDefinition.QualifiedApiName = 'Account'" --target-org YourOrg --json
```

**Output includes:**
- Field names, types, labels
- **Picklist values (active and inactive)**
- Formula definitions
- Default values
- Length, precision, scale
- Required, unique, externalId flags
- Lookup relationships (referenceTo)

**Python example to get picklist values:**
```python
import subprocess, json

def get_picklist_values(object_name, field_name, org_alias):
    cmd = ['sf', 'sobject', 'describe', '--sobject', object_name, 
           '--target-org', org_alias, '--json']
    result = subprocess.run(cmd, capture_output=True, text=True)
    metadata = json.loads(result.stdout)
    
    for field in metadata['result']['fields']:
        if field['name'] == field_name:
            return [pv['value'] for pv in field.get('picklistValues', []) 
                    if pv.get('active')]
    return []

# Usage
values = get_picklist_values('HealthcareProviderNpi', 'NpiType', 'YourOrg')
print(values)  # ['Individual', 'Organization', 'Group']
```

### 2. Validation Rules

**Get validation rules for an object:**
```bash
# Query ValidationRule metadata
sf data query --query "SELECT ValidationName, Active, ErrorConditionFormula, ErrorMessage FROM ValidationRule WHERE EntityDefinition.QualifiedApiName = 'Account'" --target-org YourOrg --json

# Retrieve validation rule files
sf project retrieve start --metadata ValidationRule:Account --target-org YourOrg
```

After retrieval, validation rules are in:
```
force-app/main/default/objects/Account/validationRules/*.validationRule-meta.xml
```

### 3. Record Types

**Get record types for an object:**
```bash
# Query RecordType
sf data query --query "SELECT DeveloperName, Name, IsActive, Description FROM RecordType WHERE SobjectType = 'Account'" --target-org YourOrg --json

# Retrieve RecordType metadata
sf project retrieve start --metadata RecordType:Account --target-org YourOrg
```

### 4. Apex Triggers

**Get triggers for an object:**
```bash
# List all triggers
sf data query --query "SELECT Name, TableEnumOrId, Status FROM ApexTrigger" --target-org YourOrg --json

# Get triggers for specific object
sf data query --query "SELECT Name, Status FROM ApexTrigger WHERE TableEnumOrId = 'Account'" --target-org YourOrg --json

# Retrieve trigger code
sf project retrieve start --metadata ApexTrigger:AccountTrigger --target-org YourOrg
```

### 5. Flows & Process Builders

**Get flow metadata:**
```bash
# List all flows
sf data query --query "SELECT DeveloperName, Label, ProcessType, Status FROM FlowDefinitionView" --target-org YourOrg --json

# Retrieve specific flow
sf project retrieve start --metadata Flow:My_Flow_Name --target-org YourOrg

# Get active autolaunched flows
sf data query --query "SELECT DeveloperName FROM FlowDefinitionView WHERE ProcessType = 'AutoLaunchedFlow' AND ActiveVersionId != null" --target-org YourOrg --json
```

### 6. Complete Object Metadata

**Get full object definition:**
```bash
# Method 1: Describe (fields only, best for enrichment)
sf sobject describe --sobject Account --target-org YourOrg --json

# Method 2: Retrieve complete object metadata (includes all components)
sf project retrieve start --metadata CustomObject:Account --target-org YourOrg

# Method 3: Query EntityDefinition (object-level info only)
sf data query --query "SELECT QualifiedApiName, Label, IsCustomizable, IsQueryable FROM EntityDefinition WHERE QualifiedApiName = 'Account'" --target-org YourOrg --json
```

**For custom objects, retrieval includes:**
- Field definitions
- Validation rules
- Record types
- Field sets
- Compact layouts
- List views
- Weblinks

**Location after retrieval:**
```
force-app/main/default/objects/Account/
├── fields/
│   ├── CustomField1__c.field-meta.xml
│   └── CustomField2__c.field-meta.xml
├── validationRules/
│   └── Rule_Name.validationRule-meta.xml
├── recordTypes/
│   └── RecordTypeName.recordType-meta.xml
└── Account.object-meta.xml
```

### 7. Useful Query Examples

**Find all objects with a specific field:**
```bash
sf data query --query "SELECT EntityDefinition.QualifiedApiName FROM FieldDefinition WHERE QualifiedApiName = 'IsActive'" --target-org YourOrg --json
```

**Get picklist values using jq (command-line JSON processor):**
```bash
sf sobject describe --sobject HealthcareProviderNpi --target-org YourOrg --json | \
  jq '.result.fields[] | select(.name=="NpiType") | .picklistValues[].value'
```

**List all custom metadata types:**
```bash
sf data query --query "SELECT QualifiedApiName, Label FROM EntityDefinition WHERE IsCustomizable = true AND QualifiedApiName LIKE '%mdt'" --target-org YourOrg --json
```

### 8. SF CLI Best Practices

1. **Always use --json flag** - Easier to parse programmatically
2. **Cache metadata locally** - Don't query org repeatedly for same data
3. **Batch operations** - Process multiple objects in single script run
4. **Error handling** - Some objects don't support all metadata types
5. **Version control** - Commit generated schema files to track changes
6. **Incremental updates** - Only refresh changed objects, not entire schema

## Output Format

Enriched schema files follow this structure:

```yaml
object:
  api_name: HealthcareProviderNpi
  type: Standard
  fields:
  - api_name: NpiType
    type: Picklist
    label: NPI Type
    help_text: Identifies whether the NPI is for an individual or an organization.
    picklist_values:      # ✅ Added by enrichment script
    - Individual
    - Organization
    - Group
    required: false       # ✅ Added by enrichment script
  - api_name: AccountId
    type: Lookup
    reference_to: Account # ✅ Added by enrichment script
  validation_rules: []
  record_types: []
```

## Troubleshooting

### Error: "sf command not found"

**Solution:** Install Salesforce CLI
```bash
# macOS
brew install sf

# Windows
# Download from: https://developer.salesforce.com/tools/sfdxcli

# Verify installation
sf --version
```

### Error: "This org hasn't been authenticated"

**Solution:** Authenticate to your org
```bash
sf org login web --alias YourOrg
```

### Error: "ModuleNotFoundError: No module named 'yaml'"

**Solution:** Install PyYAML
```bash
pip install pyyaml
```

### Error: "Permission denied: ./scripts/enrich_schema_with_picklists.py"

**Solution:** Make script executable
```bash
chmod +x scripts/enrich_schema_with_picklists.py
```

### Script runs but no changes

**Reason:** Script doesn't overwrite existing data by default.

**To force update:** Manually delete specific fields from YAML files first, then re-run script.

## Best Practices

1. **Use the main orchestrator** - Run `auto_generate_schema.py` for complete automated workflow
2. **Always run dry-run first** (for manual enrichment) to preview changes
3. **Active picklist values only** - Script intentionally excludes inactive values to prevent invalid data
4. **Enrich incrementally** - Start with a few objects, verify, then expand (for manual enrichment)
5. **Version control** - Commit enriched schemas to track changes over time
6. **Periodic updates** - Re-run `auto_generate_schema.py` when org metadata changes
7. **Backup** - Keep original schema files before mass enrichment

## Contributing

To add new enrichment capabilities:

1. Add extraction logic to `SchemaEnricher` class
2. Update `extract_field_metadata()` method
3. Add SF CLI command reference to `docs/sf-cli-schema-extraction.md`
4. Update this README with new capabilities

## See Also

- [Schema README](../config/schema/README.md) - Schema file structure and usage
- [Schema Validation Ruleset](../.cursor/rules/salesforce-schema-validation.mdc) - How to properly validate and search schema files
- [Salesforce CLI Reference](https://developer.salesforce.com/docs/atlas.en-us.sfdx_cli_reference.meta/sfdx_cli_reference/) - Official SF CLI documentation
