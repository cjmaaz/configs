# Salesforce Development Tools

> Automated Salesforce schema generation, enrichment scripts, and MCP wrapper for AI coding assistants.

[← Back to Main README](../README.md)

## Table of Contents

- [Overview](#overview)
- [Python Schema Scripts](#python-schema-scripts)
- [MCP Wrapper for Salesforce](#mcp-wrapper-for-salesforce)
- [IDE Integration](#ide-integration)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Detailed Documentation](#detailed-documentation)

---

## Overview

This repository contains powerful automation tools for Salesforce development:

### 1. Python Schema Scripts
Automated tools for generating and enriching Salesforce object schemas with metadata, picklist values, and field definitions.

### 2. MCP Wrapper
Node.js wrapper for integrating Salesforce CLI with AI coding assistants (Cursor, Continue, etc.) via Model Context Protocol.

### 3. IDE Integration
Settings and configurations optimized for Salesforce development in Code OSS-based editors.

---

## Python Schema Scripts

### Location
[`salesforce/scripts/`](../salesforce/scripts/)

### Available Scripts

#### 1. `auto_generate_schema.py` ⭐ **Main Orchestrator**

**Purpose**: Fully automated Salesforce schema generation with 9 integrated steps.

**What It Does**:
1. Detects your default org from `.sf/config.json`
2. Detects objects directory
3. Queries org for all sObjects
4. Filters objects (excludes History, Share, Feed, etc.)
5. Checks existing local metadata
6. Retrieves missing objects from Salesforce
7. Generates complete ER schema YAML
8. Splits schema into individual object files
9. **Enriches schemas with picklist values & metadata**

**Usage**:
```bash
# Just run it - no inputs required!
python3 salesforce/scripts/auto_generate_schema.py
```

**Output**: Complete, enriched schema in `config/schema/` directory.

---

#### 2. `enrich_schema_with_picklists.py`

**Purpose**: Enriches existing Salesforce schema YAML files with complete metadata from the org.

**What It Adds**:
- Picklist values (**ACTIVE ONLY** - inactive values excluded)
- Formula definitions
- Default values
- Field constraints (required, unique, externalId)
- Field length, precision, scale
- Lookup relationships
- Field dependencies (controlling/dependent picklists)

**Usage**:
```bash
# Enrich all objects (auto-detects org)
python3 salesforce/scripts/enrich_schema_with_picklists.py

# Enrich specific objects
python3 salesforce/scripts/enrich_schema_with_picklists.py --objects Account,Contact

# Dry run (preview changes)
python3 salesforce/scripts/enrich_schema_with_picklists.py --dry-run

# Specify org explicitly
python3 salesforce/scripts/enrich_schema_with_picklists.py --org MyOrgAlias
```

---

#### 3. `generate_sf_er_schema.py`

**Purpose**: Generates Entity-Relationship schema in YAML format.

**Usage**: Typically called automatically by `auto_generate_schema.py`.

---

#### 4. `split_schema_by_object.py`

**Purpose**: Splits monolithic schema file into individual object files for AI agent consumption.

**Usage**: Automatically called by `auto_generate_schema.py`.

---

### Common Workflows

#### Workflow 1: Generate Complete Schema (RECOMMENDED) ⭐

**Scenario**: You want to generate or update your entire schema with all metadata.

```bash
python3 salesforce/scripts/auto_generate_schema.py
```

This single command:
1. Detects your org
2. Retrieves all objects
3. Generates complete schema
4. Splits into individual files
5. **Enriches with active picklist values automatically**

**Result**: Complete, enriched schema in `config/schema/` directory.

---

#### Workflow 2: Update Specific Objects Only

**Scenario**: You've added new picklist values or fields for specific objects in the org.

```bash
# Preview changes
python3 salesforce/scripts/enrich_schema_with_picklists.py --objects HealthcareProviderNpi --dry-run

# Enrich specific objects
python3 salesforce/scripts/enrich_schema_with_picklists.py --objects HealthcareProviderNpi,Account

# Review changes
git diff config/schema/objects/HealthcareProviderNpi.yaml

# Commit if satisfied
git add config/schema/objects/HealthcareProviderNpi.yaml
git commit -m "Updated picklist values for HealthcareProviderNpi"
```

---

### Output Format

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
    picklist_values:      # ✅ Added by enrichment
    - Individual
    - Organization
    - Group
    required: false       # ✅ Added by enrichment
  - api_name: AccountId
    type: Lookup
    reference_to: Account # ✅ Added by enrichment
  validation_rules: []
  record_types: []
```

---

### Requirements

- **Salesforce CLI**: `sf` command installed and authenticated
- **Python**: 3.7+
- **PyYAML**: `pip install pyyaml`

**Installation**:
```bash
# Install Salesforce CLI
brew install sf  # macOS
# OR download from: https://developer.salesforce.com/tools/sfdxcli

# Install Python dependencies
pip install pyyaml

# Authenticate to org
sf org login web --alias MyOrg
```

---

### SF CLI Commands Reference

Comprehensive reference for Salesforce metadata extraction using SF CLI.

#### Get Field Metadata (Picklists, Formulas, Types)

```bash
# Method 1: Describe command (fastest, most complete)
sf sobject describe --sobject Account --target-org MyOrg --json

# Method 2: Query FieldDefinition
sf data query --query "SELECT QualifiedApiName, DataType, Label FROM FieldDefinition WHERE EntityDefinition.QualifiedApiName = 'Account'" --target-org MyOrg --json
```

**Output includes**:
- Field names, types, labels
- **Picklist values (active and inactive)**
- Formula definitions
- Default values
- Length, precision, scale
- Required, unique, externalId flags
- Lookup relationships (referenceTo)

#### Get Validation Rules

```bash
sf data query --query "SELECT ValidationName, Active, ErrorConditionFormula, ErrorMessage FROM ValidationRule WHERE EntityDefinition.QualifiedApiName = 'Account'" --target-org MyOrg --json
```

#### Get Record Types

```bash
sf data query --query "SELECT DeveloperName, Name, IsActive, Description FROM RecordType WHERE SobjectType = 'Account'" --target-org MyOrg --json
```

For complete SF CLI command reference, see [`salesforce/scripts/README.md`](../salesforce/scripts/README.md).

---

## MCP Wrapper for Salesforce

### Location
[`salesforce/mcp/`](../salesforce/mcp/)

### What is MCP?

**Model Context Protocol (MCP)** is an open protocol that enables AI coding assistants to interact with external tools and services. The MCP wrapper in this repository provides a bridge between AI assistants (like Cursor) and Salesforce CLI.

### Files

#### 1. `a4dwrapper.js`
**Purpose**: NPM package wrapper for executing Salesforce MCP server.

**Features**:
- Automatic npm package installation with retry logic
- Isolated cache directories to avoid conflicts
- Detailed debug logging
- Salesforce Node.js path detection
- Production-optimized execution

**Auto-generated**: This file is automatically generated and maintained by the A4D extension.

---

#### 2. `a4dwithSequencialThinkingConfig.json`
**Purpose**: MCP server configuration for AI coding assistants.

**Configured Servers**:

##### Salesforce MCP Server
```json
{
  "command": "node",
  "args": [
    "/path/to/a4d-mcp-wrapper.js",
    "@salesforce/mcp@latest",
    "--orgs", "ALLOW_ALL_ORGS",
    "--toolsets", "metadata",
    "--tools", "retrieve_metadata,deploy_metadata,run_apex_test,..."
  ]
}
```

**Enabled Tools**:
- `retrieve_metadata` - Retrieve metadata from orgs
- `deploy_metadata` - Deploy metadata to orgs
- `get_username` - Resolve org usernames
- `run_apex_test` - Execute Apex tests
- `run_soql_query` - Run SOQL queries
- `guide_lwc_development` - LWC development guidance
- `assign_permission_set` - Assign permission sets
- `list_all_orgs` - List configured orgs
- And more...

##### Sequential Thinking Server
```json
{
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
}
```

**Purpose**: Enhances AI reasoning with step-by-step thinking.

##### Filesystem Server
```json
{
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-filesystem", "<WORKING_DIRECTORY>"]
}
```

**Purpose**: Grants AI access to project files.

---

### How to Use MCP

#### 1. With Cursor

1. **Configure MCP**:
   - Copy `salesforce/mcp/a4dwithSequencialThinkingConfig.json`
   - Update `<WRAPPER_DIRECTORY>` to your actual path
   - Place in Cursor's MCP config directory

2. **Restart Cursor**: MCP servers auto-start

3. **Use AI Tools**:
   ```
   "Deploy my Apex class to the dev org"
   "Run tests for AccountTrigger"
   "Query all active Accounts"
   ```

#### 2. With Continue.dev

1. Configure MCP in Continue settings
2. Point to the wrapper and config files
3. Use AI commands for Salesforce operations

#### 3. With Other AI Assistants

Any MCP-compatible AI assistant can use this configuration:
- Claude Desktop
- Windsurf
- Custom MCP clients

---

### Prerequisites for MCP

- **Node.js**: 16+ installed
- **Salesforce CLI**: Authenticated orgs
- **AI Assistant**: Cursor, Continue, or MCP-compatible client

---

## IDE Integration

### Salesforce Extensions

When using Salesforce profiles, the following extensions are pre-configured:

- **Salesforce Extension Pack**: Complete Salesforce development toolkit
- **Apex Language Support**: IntelliSense for Apex
- **Lightning Web Components**: LWC tooling
- **Apex Replay Debugger**: Debug Apex with logs
- **Salesforce CLI Integration**: Run SF commands from IDE

### Optimal Settings

See [Settings Guide - Salesforce Development](SETTINGS_GUIDE.md#salesforce-development) for complete Salesforce settings.

**Key Settings**:
- Java 21 configured for Apex Language Server
- Test coverage retrieval enabled
- Conflict detection at sync
- Code Analyzer v5 enabled
- Telemetry disabled

---

## Prerequisites

### Python Scripts

```bash
# Install Salesforce CLI
brew install sf  # macOS
# OR: https://developer.salesforce.com/tools/sfdxcli

# Install Python
python3 --version  # Should be 3.7+

# Install dependencies
pip install pyyaml

# Authenticate to Salesforce
sf org login web --alias DevOrg
sf config set target-org DevOrg
```

### MCP Wrapper

```bash
# Install Node.js
node --version  # Should be 16+

# Verify Salesforce CLI
sf --version

# Authenticate orgs (if not done)
sf org login web --alias MyOrg
```

---

## Quick Start

### For Schema Generation

```bash
# 1. Clone/navigate to repo
cd /path/to/configs

# 2. Ensure Salesforce CLI is authenticated
sf org list

# 3. Run auto-generation
python3 salesforce/scripts/auto_generate_schema.py

# 4. Check output
ls config/schema/objects/
```

### For MCP Integration

```bash
# 1. Configure MCP in your AI assistant
# - Copy salesforce/mcp/a4dwithSequencialThinkingConfig.json
# - Update paths to match your system

# 2. Restart AI assistant

# 3. Test MCP connection
# In Cursor/Continue: "List all my Salesforce orgs"
```

---

## Detailed Documentation

For comprehensive documentation on each component:

- **Python Scripts**: See [`salesforce/scripts/README.md`](../salesforce/scripts/README.md)
  - Complete SF CLI command reference
  - Troubleshooting guide
  - Advanced workflows

- **MCP Configuration**: See MCP server documentation
  - [@salesforce/mcp](https://www.npmjs.com/package/@salesforce/mcp)
  - [Model Context Protocol](https://modelcontextprotocol.io/)

---

## Troubleshooting

### Python Scripts

#### Error: "sf command not found"
```bash
# Install Salesforce CLI
brew install sf  # macOS
# OR download from https://developer.salesforce.com/tools/sfdxcli

# Verify installation
sf --version
```

#### Error: "This org hasn't been authenticated"
```bash
sf org login web --alias MyOrg
sf config set target-org MyOrg
```

#### Error: "ModuleNotFoundError: No module named 'yaml'"
```bash
pip install pyyaml
```

### MCP Wrapper

#### MCP Server Won't Start
1. Check Node.js version: `node --version` (needs 16+)
2. Verify paths in config file are correct
3. Check Salesforce CLI authentication: `sf org list`
4. Review MCP logs in AI assistant

#### Tools Not Available
1. Ensure `--tools` list in config matches available tools
2. Restart AI assistant
3. Check MCP server status

---

## Best Practices

### Schema Management

1. **Run auto-generation regularly** when org metadata changes
2. **Use dry-run** before mass enrichment
3. **Version control** schema files to track changes
4. **Active values only** - script excludes inactive picklist values
5. **Backup** original schemas before bulk operations

### MCP Usage

1. **Authenticate all orgs** before starting MCP
2. **Test connections** after configuration changes
3. **Review permissions** - MCP has full SF CLI access
4. **Monitor logs** - check for authentication issues

---

## Contributing

Improvements welcome! Areas for contribution:

1. **New Scripts**: Add schema validation, backup utilities
2. **MCP Tools**: Request additional Salesforce CLI integrations
3. **Documentation**: Clarify setup steps, add examples
4. **Bug Fixes**: Report issues with scripts or MCP

---

## Resources

- **Salesforce CLI**: [Official Docs](https://developer.salesforce.com/docs/atlas.en-us.sfdx_cli_reference.meta/sfdx_cli_reference/)
- **MCP Protocol**: [Model Context Protocol](https://modelcontextprotocol.io/)
- **Salesforce MCP**: [@salesforce/mcp](https://www.npmjs.com/package/@salesforce/mcp)
- **PyYAML**: [PyYAML Docs](https://pyyaml.org/wiki/PyYAMLDocumentation)

---

[← Back to Main README](../README.md) | [← Previous: Customization Guide](CUSTOMIZATION_GUIDE.md)
