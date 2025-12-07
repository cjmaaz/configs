# Code OSS Configuration Repository

> Personal configuration repository for Code OSS-based editors (Cursor, VSCodium, VS Code OSS) with comprehensive settings, profiles, and Salesforce development tools.

[![Compatible with](https://img.shields.io/badge/Compatible%20with-Cursor%20%7C%20VSCodium%20%7C%20Code%20OSS-blue)](https://github.com)
[![Last Updated](https://img.shields.io/badge/Last%20Updated-December%202025-green)](https://github.com)

## Overview

This repository contains my personal IDE configurations, settings profiles, custom styling, and Salesforce development automation tools. While originally created for VS Code, these configurations are compatible with any Code OSS-based editor including **Cursor**, **VSCodium**, and **VS Code OSS**.

### Compatibility Note

🔵 **Works with**: Cursor, VSCodium, VS Code OSS, and other Code OSS-based editors  
⚠️ **Note**: Some settings are Microsoft VS Code proprietary but are included for completeness and may work partially or not at all in other editors.

## Repository Structure

```
configs/
├── .cursor/                # Cursor AI configuration (for this repository)
│   ├── rules/              # AI coding rules and guidelines
│   └── worktrees.json      # Git worktree configuration
├── code-oss/               # IDE settings and customization
│   ├── settings/           # Configuration file variants
│   ├── profiles/           # Development profiles (MERN, React, SF, etc.)
│   ├── keybindings/        # Custom keybindings
│   └── customization/      # Custom CSS/JS for IDE appearance
├── salesforce/             # Salesforce development tools
│   ├── scripts/            # Python schema generation scripts
│   └── mcp/                # MCP wrapper for Salesforce CLI
├── docs/                   # Comprehensive documentation
└── workspace-examples/     # Example workspace settings
```

> **Note:** The `.cursor/` folder contains AI assistant rules and configurations specifically for maintaining this repository. These are not intended for user configuration.

## Quick Start

### For General Development

1. **Choose your settings file**:
   - [`code-oss/settings/config.json`](code-oss/settings/config.json) - Production-ready settings (recommended)
   - [`code-oss/settings/config.jsonc`](code-oss/settings/config.jsonc) - JSONC variant with comments
   - [`code-oss/settings/commented-config.json`](code-oss/settings/commented-config.json) - Heavily annotated version

2. **Copy to your IDE settings**:
   - Open your IDE's settings file (Cmd/Ctrl + Shift + P → "Preferences: Open Settings (JSON)")
   - Copy the contents from your chosen config file
   - Adjust paths (Windows vs macOS) as needed

3. **Apply keybindings** (optional):
   - Copy [`code-oss/keybindings/keybindings.json`](code-oss/keybindings/keybindings.json) to your IDE's keybindings file

### For Profile-Based Setup

Load a pre-configured profile based on your development stack:

- **MERN Stack**: [`code-oss/profiles/MERN🪩.code-profile`](code-oss/profiles/MERN🪩.code-profile)
- **React**: [`code-oss/profiles/React⚛️.code-profile`](code-oss/profiles/React⚛️.code-profile)
- **Salesforce**: [`code-oss/profiles/SF ☁️.code-profile`](code-oss/profiles/)
- **Python**: [`code-oss/profiles/Python🐍.code-profile`](code-oss/profiles/Python🐍.code-profile)
- **Flutter/Dart**: [`code-oss/profiles/Flutter-Dart💙.code-profile`](code-oss/profiles/Flutter-Dart💙.code-profile)

See [Profiles Guide](docs/PROFILES_GUIDE.md) for complete list and usage instructions.

## Features

### 1. Comprehensive Settings

- **Editor Experience**: Font ligatures, bracket colorization, smooth scrolling
- **Language Support**: JavaScript/TypeScript, Python, Apex, Dart, PHP, Vue, and more
- **Performance Optimizations**: Disabled telemetry, optimized file watching
- **Privacy-Focused**: All telemetry disabled by default
- **Accessibility**: Customizable audio cues and screen reader support

[→ Settings Guide](docs/SETTINGS_GUIDE.md)

### 2. Development Profiles

Pre-configured profiles for different technology stacks with optimized extensions, settings, and window titles.

[→ Profiles Guide](docs/PROFILES_GUIDE.md)

### 3. Custom Styling

Custom CSS and JavaScript for enhanced IDE appearance including:
- Blurred command palette backdrop
- Custom sidebar shadows
- Styled hover tooltips
- Enhanced scrollbars

[→ Customization Guide](docs/CUSTOMIZATION_GUIDE.md)

### 4. Salesforce Tools

Automated Salesforce development utilities:
- **Schema Generation**: Automated Salesforce object schema extraction
- **Picklist Enrichment**: Adds active picklist values to schema files
- **MCP Wrapper**: Salesforce CLI integration for AI coding assistants

[→ Salesforce Tools Guide](docs/SALESFORCE_TOOLS.md)

## Documentation

### Reference Guides

- [**Settings Guide**](docs/SETTINGS_GUIDE.md) - Comprehensive reference for all settings organized by category
- [**Profiles Guide**](docs/PROFILES_GUIDE.md) - Development profiles and when to use them
- [**Customization Guide**](docs/CUSTOMIZATION_GUIDE.md) - Custom CSS/JS setup and modifications
- [**Salesforce Tools**](docs/SALESFORCE_TOOLS.md) - Salesforce development automation

### Component READMEs

- [Code OSS Settings](code-oss/settings/README.md) - Configuration file variants explained
- [Code OSS Profiles](code-oss/profiles/README.md) - Profile overview
- [Code OSS Customization](code-oss/customization/README.md) - Quick setup for custom styles
- [Salesforce Scripts](salesforce/scripts/README.md) - Python script documentation
- [Workspace Examples](workspace-examples/README.md) - Workspace vs user settings

### Repository Maintenance

- [Cursor AI Configuration](.cursor/README.md) - AI assistant rules for maintaining this repository (not for user configuration)

## Migration Notes

### December 2025 Reorganization

#### Directory Structure Changes
- Renamed `VSCode/` → `code-oss/` for IDE-agnostic naming
- Consolidated settings into `code-oss/settings/`
- Moved Salesforce tools to dedicated `salesforce/` directory

#### Settings File Reorganization ⚡ **NEW**
The main configuration file (`config.jsonc`) has been completely reorganized:

**✨ Key Improvements:**
- **10 major sections** organized by importance and workflow
- **33 granular subsections** for better navigation
- **3 new dedicated sections**: SALESFORCE, FILES & SEARCH, EXTENSIONS & PLUGINS
- **Zero duplicate keys** - All redundant settings removed
- **929 lines** of well-organized, documented configuration
- **Importance-based ordering** - Most used settings at the top

**📋 New Section Order:**
1. EDITOR CORE SETTINGS - Daily editing features
2. WORKBENCH & UI - Visual appearance and layout
3. TERMINAL - Terminal configuration
4. LANGUAGE & FILE SETTINGS - Language-specific behaviors
5. **SALESFORCE** ⚡ *New dedicated section*
6. **FILES & SEARCH** ⚡ *New dedicated section*
7. DEVELOPER TOOLS - Git, debug, development tools
8. **EXTENSIONS & PLUGINS** ⚡ *New dedicated section*
9. PRIVACY, SYNC & MISCELLANEOUS - Privacy and system settings
10. CUSTOMIZATION & PROFILES - Window titles, colors, custom CSS

**🔧 What Changed:**
- Removed all duplicate settings (5 duplicates eliminated)
- Moved Emmet settings from TERMINAL to LANGUAGE & FILE SETTINGS
- Moved Indent Rainbow from WORKBENCH to EXTENSIONS & PLUGINS
- Separated Salesforce settings into dedicated section
- Separated file handling and search into dedicated section
- Created comprehensive EXTENSIONS & PLUGINS section
- Moved cSpell dictionary to CUSTOMIZATION section for better organization

See [Settings README](code-oss/settings/README.md) for detailed section breakdown.

### Deprecated Settings Updated

The following deprecated settings were automatically migrated to their modern equivalents:

| Deprecated | Migrated To | Reason |
|------------|-------------|---------|
| `docker.containers.sortBy` | `containers.containers.sortBy` | Docker extension renamed to Containers |
| `docker.images.sortBy` | `containers.images.sortBy` | Docker extension renamed to Containers |

## Platform Differences

### Windows vs macOS Paths

Some settings require platform-specific paths. Search and replace as needed:

| Setting | Windows Example | macOS Example |
|---------|----------------|---------------|
| Custom CSS | `file:///C:\\Users\\...\\style.css` | `file:///Users/.../style.css` |
| Java Home (SF) | `C:\\Program Files\\Java\\jdk-21` | `/Library/Java/JavaVirtualMachines/...` |
| Terminal Font | Works cross-platform | Works cross-platform |

## IDE Compatibility

### Fully Supported Features

✅ All editor settings (fonts, colors, formatting)  
✅ Language-specific configurations  
✅ Keybindings  
✅ File associations  
✅ Git integration settings  

### Partially Supported (VS Code Specific)

⚠️ Custom CSS/JS loader (requires extension)  
⚠️ Some proprietary extension settings  
⚠️ Telemetry settings (may not exist in non-VS Code builds)  

## Contributing

This is a personal configuration repository, but feel free to:
- Fork for your own use
- Submit issues for questions
- Suggest improvements via pull requests

## Cursor AI Configuration

This repository includes a `.cursor/` folder with AI assistant rules and configurations used for maintaining this repository:

### AI Rules (`/.cursor/rules/`)

6 AI coding rules for repository maintenance:

- **apex-test-class-creation.mdc** - Best practices for Apex test class creation
- **code-styling-format.mdc** - Code formatting and style rules (always applied)
- **pmd-ruleset.mdc** - PMD static analysis rules for Apex
- **python-selenium-automation.mdc** - Python Selenium automation guidelines
- **salesforce-schema-validation.mdc** - Salesforce schema validation requirements
- **test-deploy-ruleset.mdc** - Testing and deployment rules for Apex

### Configuration Files

- **mcp.json** - Model Context Protocol (MCP) server configuration
- **worktrees.json** - Git worktree setup configuration

> ⚠️ **Important:** These files are for **repository maintenance only** and are not part of the user configuration. They help maintain consistency and enable advanced AI features when working on this repository.

See [Cursor AI Configuration](.cursor/README.md) for detailed documentation.

## File Count Summary

- **Settings Files**: 3 variants (JSON, JSONC, Commented)
- **Profiles**: 13 development profiles
- **Scripts**: 4 Python automation scripts
- **Custom Files**: 2 (CSS + JS)
- **Documentation**: 9 comprehensive guides (including Cursor AI docs)
- **AI Configuration**: 6 rules + 2 config files (mcp.json, worktrees.json)

## License

This configuration repository is provided as-is for personal and educational use. Third-party extensions and tools referenced maintain their own licenses.

---

**Last Updated**: December 2025  
**Maintained by**: [Maaz Rahman](https://github.com/cjmaaz)  
**Compatible Editors**: Cursor, VSCodium, VS Code OSS, and other Code OSS-based editors
