# Cursor AI Configuration

> AI assistant rules and configurations for maintaining this repository.

[← Back to Main README](../README.md)

## ⚠️ Important Notice

**These configurations are for repository maintenance only.** They are not part of the user configuration and should not be copied to your personal IDE setup. These rules help maintain consistency when updating and managing this configuration repository.

---

## Directory Structure

```
.cursor/
├── rules/                 # AI coding rules and guidelines
│   ├── apex-test-class-creation.mdc
│   ├── code-styling-format.mdc
│   ├── pmd-ruleset.mdc
│   ├── python-selenium-automation.mdc
│   ├── salesforce-schema-validation.mdc
│   └── test-deploy-ruleset.mdc
├── mcp.json              # Model Context Protocol configuration
└── worktrees.json        # Git worktree configuration
```

---

## AI Rules

### 1. **apex-test-class-creation.mdc**

**Purpose**: Best practices for creating and maintaining Apex test classes

**Applies To**: 
- Creating Apex test classes
- Modifying test methods
- Executing Apex tests in Salesforce orgs

**Key Guidelines**:
- Test data creation best practices
- Factory usage patterns
- Schema validation requirements
- Method visibility awareness
- PMD exception handling
- 90%+ code coverage requirements
- Proper test execution commands
- Mandatory log verification

---

### 2. **code-styling-format.mdc** ⚡ *Always Applied*

**Purpose**: Code formatting and style consistency rules

**Applies To**: All code files in this repository

**Key Guidelines**:
- **Method Parameters**: Never split parameters across multiple lines
- **SOQL Formatting**: 
  - Single line if ≤ 200 characters
  - Multiple lines with logical breaks if > 200 characters

**Why Always Applied**: Ensures consistent code style across all edits

---

### 3. **pmd-ruleset.mdc**

**Purpose**: PMD static code analysis rules for Apex classes

**Applies To**: `.cls` files (Apex classes)

**Key Guidelines**:
- Code quality violation checks
- Complexity analysis
- Best practice enforcement
- Security pattern validation

---

### 4. **python-selenium-automation.mdc**

**Purpose**: Python Selenium automation guidelines

**Applies To**: Python files using Selenium for browser automation

**Key Guidelines**:
- Web element interaction patterns
- Wait strategies
- Page object model usage
- Error handling

---

### 5. **salesforce-schema-validation.mdc**

**Purpose**: Salesforce schema validation requirements

**Applies To**: 
- Apex code
- SOQL queries
- DML operations
- LWC components

**Key Guidelines**:
- **MUST** consult `config/schema/` before writing any Salesforce code
- Field and object validation
- Relationship validation
- Data type checking

---

### 6. **test-deploy-ruleset.mdc**

**Purpose**: Testing and deployment rules for Apex code

**Applies To**: 
- Creating/modifying Apex code
- Deploying to Salesforce orgs
- Executing tests
- Running anonymous Apex

**Key Guidelines**:
- Syntax validation before deployment
- Proper deployment procedures
- Test execution requirements
- **Mandatory log verification** to catch hidden failures

---

## Configuration Files

### mcp.json

**Purpose**: Model Context Protocol (MCP) server configuration

**What It Does**: Configures MCP servers for enhanced AI capabilities in Cursor IDE

**Features**:
- Connects to external MCP servers
- Provides additional context and tools to AI assistant
- Enables advanced features like Salesforce CLI integration

> **Note**: This configuration is specific to this repository's development workflow.

---

### worktrees.json

**Purpose**: Git worktree setup automation

**Content**:
```json
{
  "setup-worktree": [
    "npm install"
  ]
}
```

**Usage**: Automatically runs `npm install` when setting up a new Git worktree for this repository.

---

## Usage in Cursor IDE

These rules are automatically applied when working on this repository in Cursor IDE:

1. **Always Applied Rules**: 
   - `code-styling-format.mdc` (marked with `alwaysApply: true`)

2. **Context-Aware Rules**: 
   - Other rules apply based on file type and operation
   - Cursor AI uses these to provide contextual suggestions

3. **Worktree Setup**: 
   - Automatically executes when creating Git worktrees

---

## For Repository Maintainers

### Adding New Rules

1. Create a new `.mdc` file in `.cursor/rules/`
2. Add front matter:
   ```yaml
   ---
   alwaysApply: false  # or true
   ---
   ```
3. Document the rule with clear examples
4. Update this README with the new rule

### Modifying Existing Rules

1. Edit the `.mdc` file
2. Test with AI assistant to ensure proper application
3. Update this README if the purpose or guidelines change

---

## Not for User Configuration

❌ **Do NOT**:
- Copy these files to your personal IDE configuration
- Use these rules for your own projects (unless relevant)
- Expect these to work outside this repository

✅ **These Are**:
- Repository-specific maintenance rules
- Quality assurance guidelines
- Consistency enforcement tools
- For maintaining this config repository only

---

[← Back to Main README](../README.md)
