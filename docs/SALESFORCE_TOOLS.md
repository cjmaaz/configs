# Salesforce Development Tools

> Automated Salesforce schema generation, enrichment scripts, and MCP wrapper for AI coding assistants.

[← Back to Main README](../README.md)

## Table of Contents

- [Overview](#overview)
- [Python Schema Scripts](#python-schema-scripts)
- [PMD Rulesets for Apex](#pmd-rulesets-for-apex)
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

### 2. PMD Rulesets

Pre-configured static code analysis rulesets for Apex code quality, security, and best practices enforcement.

### 3. MCP Wrapper

Node.js wrapper for integrating Salesforce CLI with AI coding assistants (Cursor, Continue, etc.) via Model Context Protocol.

### 4. IDE Integration

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
      picklist_values: # ✅ Added by enrichment
        - Individual
        - Organization
        - Group
      required: false # ✅ Added by enrichment
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

## PMD Rulesets for Apex

### Location

[`salesforce/pmd/`](../salesforce/pmd/)

### What is PMD?

**PMD** is a static source code analyzer that finds common programming flaws like unused variables, empty catch blocks, unnecessary object creation, and more. For Salesforce development, PMD helps enforce:

- **Code Quality**: Detect complexity, bad practices, and maintainability issues
- **Security**: Identify CRUD/FLS violations, SOQL injection risks, and weak cryptography
- **Performance**: Find inefficient loops, unnecessary debug statements, and governor limit risks
- **Best Practices**: Enforce proper test assertions, naming conventions, and documentation

### Available Rulesets

This repository includes two PMD rulesets optimized for different use cases:

#### 1. `main-ruleset.xml` - **Balanced Ruleset** (Recommended for Most Projects)

**Purpose**: Comprehensive ruleset focusing on critical issues without being overly strict.

**Best For**:

- Production codebases
- Teams prioritizing critical issues
- Projects with existing code that may not pass strict standards
- Continuous integration pipelines

**Categories Covered**:

- ✅ **Best Practices** (4 rules): Assertions, test coverage, finalizers, logging
- ✅ **Code Style** (3 rules): Braces for control structures
- ✅ **Design** (4 rules): Complexity metrics, nesting depth
- ✅ **Error Prone** (5 rules): Hardcoded IDs, empty blocks, CSRF, trigger maps
- ✅ **Performance** (3 rules): Debug statements, operations in loops
- ✅ **Security** (4 rules): Bad crypto, CRUD violations, sharing, SOQL injection

**Total**: 23 rules across 6 categories

---

#### 2. `standard-ruleset.xml` - **Strict Ruleset** (For High-Quality Standards)

**Purpose**: Comprehensive ruleset enforcing strict coding standards and documentation.

**Best For**:

- New greenfield projects
- Teams with strict quality requirements
- Code requiring extensive documentation
- Enterprise-grade applications

**Additional Rules** (compared to main-ruleset):

- ✅ **AvoidGlobalModifier**: Prevents global keyword misuse
- ✅ **ClassNamingConventions**: Enforces proper class naming
- ✅ **MethodNamingConventions**: Enforces proper method naming
- ✅ **AvoidBooleanMethodParameters**: Discourages boolean parameters for clarity
- ✅ **ApexDoc**: Requires ApexDoc comments for classes and methods

**Total**: 28 rules across 7 categories (includes Documentation)

---

### Rule Categories Breakdown

#### Best Practices

| Rule                                 | Description                                       | Both Rulesets |
| ------------------------------------ | ------------------------------------------------- | ------------- |
| `ApexAssertionsShouldIncludeMessage` | Test assertions must include descriptive messages | ✅            |
| `ApexUnitTestClassShouldHaveAsserts` | Test classes must contain assertions              | ✅            |
| `AvoidGlobalModifier`                | Restrict use of global keyword                    | Standard only |
| `QueueableWithoutFinalizer`          | Detect missing finalizers in Queueable            | ✅            |
| `DebugsShouldUseLoggingLevel`        | Debug statements must specify log level           | ✅            |

#### Code Style

| Rule                       | Description                       | Both Rulesets |
| -------------------------- | --------------------------------- | ------------- |
| `IfElseStmtsMustUseBraces` | Enforce braces for if/else blocks | ✅            |
| `ForLoopsMustUseBraces`    | Enforce braces for for loops      | ✅            |
| `WhileLoopsMustUseBraces`  | Enforce braces for while loops    | ✅            |
| `ClassNamingConventions`   | Enforce PascalCase for classes    | Standard only |
| `MethodNamingConventions`  | Enforce camelCase for methods     | Standard only |

#### Design

| Rule                           | Description                         | Both Rulesets |
| ------------------------------ | ----------------------------------- | ------------- |
| `AvoidBooleanMethodParameters` | Discourage boolean parameters       | Standard only |
| `AvoidDeeplyNestedIfStmts`     | Limit nesting depth of conditionals | ✅            |
| `CyclomaticComplexity`         | Measure method complexity           | ✅            |
| `NcssMethodCount`              | Limit lines of code per method      | ✅            |
| `CognitiveComplexity`          | Measure code readability complexity | ✅            |

#### Documentation

| Rule      | Description                             | Both Rulesets |
| --------- | --------------------------------------- | ------------- |
| `ApexDoc` | Require ApexDoc for classes and methods | Standard only |

#### Error Prone

| Rule                          | Description                           | Both Rulesets |
| ----------------------------- | ------------------------------------- | ------------- |
| `AvoidHardcodingId`           | Prevent hardcoded Salesforce IDs      | ✅            |
| `EmptyCatchBlock`             | Detect empty catch blocks             | ✅            |
| `ApexCSRF`                    | Detect CSRF vulnerabilities           | ✅            |
| `AvoidDirectAccessTriggerMap` | Prevent direct Trigger.new/old access | ✅            |
| `EmptyIfStmt`                 | Detect empty if statements            | ✅            |

#### Performance

| Rule                          | Description                                | Both Rulesets |
| ----------------------------- | ------------------------------------------ | ------------- |
| `AvoidDebugStatements`        | Detect debug statements in production code | ✅            |
| `OperationWithHighCostInLoop` | Prevent expensive operations in loops      | ✅            |
| `OperationWithLimitsInLoop`   | Prevent governor limit violations in loops | ✅            |

#### Security

| Rule                    | Description                           | Both Rulesets |
| ----------------------- | ------------------------------------- | ------------- |
| `ApexBadCrypto`         | Detect weak cryptographic algorithms  | ✅            |
| `ApexCRUDViolation`     | Detect missing CRUD/FLS checks        | ✅            |
| `ApexSharingViolations` | Detect sharing rule violations        | ✅            |
| `ApexSOQLInjection`     | Detect SOQL injection vulnerabilities | ✅            |

---

### How to Use PMD Rulesets

#### Option 1: With Salesforce Code Analyzer (Recommended)

The **Salesforce Code Analyzer** extension integrates PMD directly into your IDE.

**Setup**:

1. **Install Extension**:

   - Open VS Code/Cursor
   - Install "Salesforce Code Analyzer" extension

2. **Configure Custom Ruleset**:
   - Open settings (JSON): `Cmd/Ctrl + Shift + P` → "Preferences: Open Settings (JSON)"
   - Add custom ruleset path:

```json
{
  "salesforce-code-analyzer.pmd.rulesets": ["/absolute/path/to/salesforce/pmd/main-ruleset.xml"],
  "salesforce-code-analyzer.engines": ["pmd"]
}
```

3. **Run Analysis**:
   - Right-click on a file/folder
   - Select "SFDX: Run Code Analyzer on Selected File(s)"
   - Or use Command Palette: `Salesforce: Run Code Analyzer`

**IDE Settings** (Already configured in this repo):

```json
{
  "salesforce-code-analyzer.pmd.enabled": true,
  "salesforce-code-analyzer.pmd.rulesets": ["<path-to-ruleset>"],
  "salesforce-code-analyzer.scanner.engines": ["pmd"],
  "salesforce-code-analyzer.scanner.categories": ["Design", "Performance", "Security"]
}
```

---

#### Option 2: Command Line (CI/CD Integration)

**Prerequisites**:

```bash
# Install PMD (requires Java 11+)
brew install pmd  # macOS
# OR download from: https://github.com/pmd/pmd/releases

# Verify installation
pmd --version
```

**Run Analysis**:

```bash
# Analyze single file
pmd check --dir force-app/main/default/classes/MyClass.cls \
  --rulesets salesforce/pmd/main-ruleset.xml \
  --format text

# Analyze entire project
pmd check --dir force-app/main/default/classes \
  --rulesets salesforce/pmd/standard-ruleset.xml \
  --format text

# Generate HTML report
pmd check --dir force-app/main/default/classes \
  --rulesets salesforce/pmd/main-ruleset.xml \
  --format html \
  --report-file pmd-report.html

# JSON output (for CI/CD parsing)
pmd check --dir force-app/main/default/classes \
  --rulesets salesforce/pmd/main-ruleset.xml \
  --format json \
  --report-file pmd-report.json
```

**Exit Codes**:

- `0`: No violations
- `4`: Violations found
- `1`: Error occurred

---

#### Option 3: Salesforce CLI Scanner

The Salesforce CLI includes a code scanner that supports PMD.

**Installation**:

```bash
# Install Salesforce CLI (if not already installed)
brew install sf  # macOS

# Install Code Analyzer plugin
sf plugins install @salesforce/sfdx-scanner
```

**Usage**:

```bash
# Run with custom ruleset
sf scanner run --target "force-app/**/*.cls" \
  --pmdconfig salesforce/pmd/main-ruleset.xml \
  --format table

# Generate detailed report
sf scanner run --target "force-app/**/*.cls" \
  --pmdconfig salesforce/pmd/standard-ruleset.xml \
  --format csv \
  --outfile violations.csv

# Set severity threshold (fail on priority 1-3 violations)
sf scanner run --target "force-app/**/*.cls" \
  --pmdconfig salesforce/pmd/main-ruleset.xml \
  --severity-threshold 3
```

---

### CI/CD Integration

#### GitHub Actions Example

```yaml
name: PMD Code Analysis

on: [push, pull_request]

jobs:
  pmd-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Java
        uses: actions/setup-java@v3
        with:
          distribution: 'temurin'
          java-version: '11'

      - name: Install PMD
        run: |
          wget https://github.com/pmd/pmd/releases/download/pmd_releases%2F7.0.0/pmd-dist-7.0.0-bin.zip
          unzip pmd-dist-7.0.0-bin.zip

      - name: Run PMD Analysis
        run: |
          pmd-bin-7.0.0/bin/pmd check \
            --dir force-app/main/default/classes \
            --rulesets salesforce/pmd/main-ruleset.xml \
            --format text \
            --fail-on-violation true
```

#### GitLab CI Example

```yaml
pmd-scan:
  stage: test
  image: openjdk:11-jre-slim
  before_script:
    - wget https://github.com/pmd/pmd/releases/download/pmd_releases%2F7.0.0/pmd-dist-7.0.0-bin.zip
    - unzip pmd-dist-7.0.0-bin.zip
  script:
    - pmd-bin-7.0.0/bin/pmd check --dir force-app/main/default/classes --rulesets salesforce/pmd/main-ruleset.xml --format text --fail-on-violation true
```

---

### Customizing Rulesets

Both rulesets can be customized to fit your project needs.

#### Add Rule Exceptions

Exclude specific rules from analysis:

```xml
<!-- In your ruleset file -->
<rule ref="category/apex/design.xml/CyclomaticComplexity">
  <properties>
    <property name="reportLevel" value="15" />  <!-- Default is 10 -->
  </properties>
</rule>
```

#### Exclude Files/Directories

Create a `.pmd-exclude` file:

```
force-app/main/default/classes/legacy/**
force-app/main/default/classes/ThirdPartyLib.cls
```

#### Suppress Warnings in Code

Use PMD suppression comments:

```apex
public class MyClass {
    // NOPMD - Legacy code, will be refactored in Q2
    @SuppressWarnings('PMD.AvoidGlobalModifier')
    global class GlobalUtil {
        // ...
    }
}
```

---

### Choosing the Right Ruleset

| Scenario                                     | Recommended Ruleset    |
| -------------------------------------------- | ---------------------- |
| Production codebase with existing violations | `main-ruleset.xml`     |
| New greenfield project                       | `standard-ruleset.xml` |
| CI/CD pipeline (fail on violations)          | `main-ruleset.xml`     |
| Enterprise-grade application                 | `standard-ruleset.xml` |
| Quick code review                            | `main-ruleset.xml`     |
| Team learning best practices                 | `standard-ruleset.xml` |

---

### PMD Version Compatibility

Both rulesets are based on **PMD 7.18.0** with Apex rules.

**Requirements**:

- PMD: 7.0.0+
- Java: 11+
- Salesforce Code Analyzer: 4.0.0+
- Salesforce CLI Scanner: 3.0.0+

---

### Common PMD Violations & Fixes

#### 1. ApexCRUDViolation

**Violation**: Missing CRUD/FLS checks before DML

**Fix**:

```apex
// Before (violation)
insert newAccount;

// After (fixed)
if (Schema.sObjectType.Account.isCreateable()) {
    insert newAccount;
}
```

#### 2. OperationWithLimitsInLoop

**Violation**: SOQL query inside a loop

**Fix**:

```apex
// Before (violation)
for (Account acc : accounts) {
    List<Contact> contacts = [SELECT Id FROM Contact WHERE AccountId = :acc.Id];
}

// After (fixed)
Set<Id> accountIds = new Set<Id>();
for (Account acc : accounts) {
    accountIds.add(acc.Id);
}
Map<Id, List<Contact>> contactsByAccount = new Map<Id, List<Contact>>();
for (Contact con : [SELECT Id, AccountId FROM Contact WHERE AccountId IN :accountIds]) {
    // Group contacts by account
}
```

#### 3. AvoidHardcodingId

**Violation**: Hardcoded Salesforce ID

**Fix**:

```apex
// Before (violation)
Id accountId = '001000000000000AAA';

// After (fixed)
Account acc = [SELECT Id FROM Account WHERE Name = 'Test Account' LIMIT 1];
Id accountId = acc.Id;
```

---

### Resources

- **PMD Official Docs**: [PMD Apex Rules](https://pmd.github.io/latest/pmd_rules_apex.html)
- **Salesforce Code Analyzer**: [Extension Marketplace](https://marketplace.visualstudio.com/items?itemName=salesforce.sfdx-code-analyzer-vscode)
- **PMD Downloads**: [GitHub Releases](https://github.com/pmd/pmd/releases)
- **Salesforce Scanner Plugin**: [CLI Plugin Docs](https://forcedotcom.github.io/sfdx-scanner/)

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
    "--orgs",
    "ALLOW_ALL_ORGS",
    "--toolsets",
    "metadata",
    "--tools",
    "retrieve_metadata,deploy_metadata,run_apex_test,..."
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

### PMD Rulesets

```bash
# Install PMD (requires Java 11+)
brew install pmd  # macOS
# OR download from: https://github.com/pmd/pmd/releases

# Verify Java version
java --version  # Should be 11+

# Verify PMD installation
pmd --version

# Optional: Install Salesforce Code Analyzer (for IDE integration)
# Via VS Code/Cursor extensions marketplace
# Search for: "Salesforce Code Analyzer"
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

### For PMD Code Analysis

```bash
# 1. Install PMD (if not already installed)
brew install pmd  # macOS

# 2. Run analysis on your Apex code
pmd check --dir force-app/main/default/classes \
  --rulesets salesforce/pmd/main-ruleset.xml \
  --format text

# 3. Or use with Salesforce CLI Scanner
sf scanner run --target "force-app/**/*.cls" \
  --pmdconfig salesforce/pmd/main-ruleset.xml \
  --format table
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

- **PMD Rulesets**: See [`salesforce/pmd/README.md`](../salesforce/pmd/README.md)

  - Quick reference for both rulesets
  - Common violations and fixes
  - Customization examples

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

### PMD Code Analysis

1. **Start with main-ruleset** for existing codebases
2. **Run in CI/CD** to prevent new violations from being committed
3. **Fix critical issues first** - prioritize Security and Error Prone categories
4. **Customize thresholds** based on team standards and legacy code
5. **Document suppressions** - always comment why PMD warnings are suppressed
6. **Regular audits** - review suppressed warnings periodically

### MCP Usage

1. **Authenticate all orgs** before starting MCP
2. **Test connections** after configuration changes
3. **Review permissions** - MCP has full SF CLI access
4. **Monitor logs** - check for authentication issues

---

## Contributing

Improvements welcome! Areas for contribution:

1. **New Scripts**: Add schema validation, backup utilities
2. **PMD Enhancements**: Suggest additional rules or custom rulesets
3. **MCP Tools**: Request additional Salesforce CLI integrations
4. **Documentation**: Clarify setup steps, add examples
5. **Bug Fixes**: Report issues with scripts, PMD, or MCP

---

## Resources

- **Salesforce CLI**: [Official Docs](https://developer.salesforce.com/docs/atlas.en-us.sfdx_cli_reference.meta/sfdx_cli_reference/)
- **PMD**: [Official Website](https://pmd.github.io/) | [Apex Rules](https://pmd.github.io/latest/pmd_rules_apex.html) | [GitHub](https://github.com/pmd/pmd)
- **Salesforce Code Analyzer**: [Extension Marketplace](https://marketplace.visualstudio.com/items?itemName=salesforce.sfdx-code-analyzer-vscode) | [CLI Plugin](https://forcedotcom.github.io/sfdx-scanner/)
- **MCP Protocol**: [Model Context Protocol](https://modelcontextprotocol.io/)
- **Salesforce MCP**: [@salesforce/mcp](https://www.npmjs.com/package/@salesforce/mcp)
- **PyYAML**: [PyYAML Docs](https://pyyaml.org/wiki/PyYAMLDocumentation)

---

[← Back to Main README](../README.md) | [← Previous: Customization Guide](CUSTOMIZATION_GUIDE.md)
