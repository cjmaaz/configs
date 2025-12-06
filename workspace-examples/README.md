# Workspace Examples

> Example workspace settings for project-specific configurations.

[← Back to Main README](../README.md)

## Overview

This directory contains example workspace settings that override user settings at the project level. Workspace settings are useful for:

- Project-specific configurations
- Team collaboration (shared settings)
- Temporary overrides without changing global settings
- Per-project Salesforce org configurations

## What are Workspace Settings?

### User Settings vs Workspace Settings

| Type | Scope | File Location | Use Case |
|------|-------|---------------|----------|
| **User Settings** | Global (all projects) | IDE config directory | Personal preferences |
| **Workspace Settings** | Project-specific | `.vscode/settings.json` | Project requirements |

**Priority**: Workspace settings **override** user settings.

## Available Examples

### `salesforce-project/`

Example workspace settings for Salesforce development projects.

**File**: `.vscode/settings.json`

**Key Overrides**:
- Salesforce-specific search exclusions
- Java home for Apex Language Server
- Einstein AI settings (disabled for performance)
- Format on save disabled (Salesforce preference)
- Peacock color for visual project identification

**Use When**:
- Working on Salesforce DX projects
- Need project-specific Salesforce org configuration
- Team shares workspace settings in Git

---

## How to Use Workspace Settings

### Method 1: Copy Example

1. **Copy workspace settings**:
   ```bash
   cp workspace-examples/salesforce-project/.vscode/settings.json your-project/.vscode/
   ```

2. **Customize** for your project

3. **Commit to Git** (optional):
   ```bash
   git add .vscode/settings.json
   git commit -m "Add workspace settings"
   ```

### Method 2: Create Manually

1. **Open workspace settings**:
   - `Cmd/Ctrl + Shift + P` → "Preferences: Open Workspace Settings (JSON)"

2. **Add overrides**:
   ```json
   {
     "salesforcedx-vscode-apex.java.home": "/path/to/java",
     "editor.formatOnSave": false
   }
   ```

3. **Save**: Creates `.vscode/settings.json` in project root

---

## Common Workspace Overrides

### Salesforce Projects

```json
{
  "search.exclude": {
    "**/.sfdx": true
  },
  "salesforcedx-vscode-apex.java.home": "/Library/Java/JavaVirtualMachines/zulu-21.jdk/Contents/Home",
  "salesforce.einsteinForDevelopers.enable": false,
  "editor.formatOnSave": false
}
```

### JavaScript/TypeScript Projects

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

### Python Projects

```json
{
  "python.linting.enabled": true,
  "python.linting.pylintEnabled": true,
  "python.formatting.provider": "black",
  "[python]": {
    "editor.formatOnSave": true
  }
}
```

---

## Team Collaboration

### Sharing Workspace Settings

**Benefits**:
- Consistent team configuration
- Easier onboarding
- Project-specific linters/formatters

**Best Practices**:
1. ✅ **Do commit** `.vscode/settings.json` for team projects
2. ❌ **Don't commit** personal preferences (font size, themes)
3. ✅ **Do document** why certain settings are needed
4. ✅ **Do use** `.vscode/extensions.json` to recommend extensions

**Example `.vscode/extensions.json`**:
```json
{
  "recommendations": [
    "salesforce.salesforcedx-vscode",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint"
  ]
}
```

### Settings Priority

```
Workspace Settings (highest priority)
        ↓
User Settings
        ↓
Default Settings (lowest priority)
```

---

## When NOT to Use Workspace Settings

❌ **Personal Preferences**: Font size, theme, sidebar position  
❌ **Sensitive Data**: API keys, tokens, credentials  
❌ **Machine-Specific Paths**: Unless team uses same structure  
❌ **Extension Settings**: Use user settings for personal extension configs  

---

## Peacock Colors

Workspace settings can include Peacock colors for visual project identification:

```json
{
  "workbench.colorCustomizations": {
    "activityBar.activeBackground": "#215731",
    "activityBar.background": "#215731",
    "statusBar.background": "#13321c",
    "titleBar.activeBackground": "#13321c"
  },
  "peacock.color": "#13321c"
}
```

**Common Project Colors**:
- 🟢 Green (`#13321c`) - Salesforce projects
- 🔵 Blue (`#1857a4`) - JavaScript/TypeScript
- 🟡 Yellow (`#8c6c00`) - Python projects
- 🔴 Red (`#8c1c1c`) - Production projects (warning)

---

## Advanced: Multi-Root Workspaces

For projects with multiple root folders:

**File**: `myproject.code-workspace`
```json
{
  "folders": [
    { "path": "frontend" },
    { "path": "backend" },
    { "path": "salesforce" }
  ],
  "settings": {
    // Workspace-level settings apply to all folders
    "files.exclude": {
      "**/node_modules": true
    }
  }
}
```

---

## Troubleshooting

### Workspace Settings Not Applying

**Issue**: Changes don't take effect

**Solutions**:
1. Check for JSON syntax errors
2. Reload IDE window
3. Verify settings aren't overridden by user settings (shouldn't happen)
4. Check workspace is opened (not just folder)

### Settings Conflicts

**Issue**: Unexpected behavior due to conflicting settings

**Solution**: Open Settings UI and check "Workspace" tab to see effective settings

---

## Further Reading

- [Settings Guide](../docs/SETTINGS_GUIDE.md) - All available settings
- [Main README](../README.md) - Repository overview
- [VS Code Docs](https://code.visualstudio.com/docs/getstarted/settings) - Official workspace settings documentation

---

[← Back to Main README](../README.md)
