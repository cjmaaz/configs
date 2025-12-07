# Settings Guide - Reference Handbook

> Comprehensive reference for all Code OSS IDE settings organized by category with explanations and use cases.

[← Back to Main README](../README.md)

## Table of Contents

- [Editor Compatibility](#editor-compatibility)
- [Configuration Structure](#configuration-structure) ⚡ *New*
- [Editor Core Settings](#editor-core-settings)
- [Workbench & UI](#workbench--ui)
- [Terminal Configuration](#terminal-configuration)
- [Language-Specific Settings](#language-specific-settings)
- [Salesforce Development](#salesforce-development)
- [Files & Search](#files--search) ⚡ *New*
- [Developer Tools](#developer-tools)
- [Extensions & Plugins](#extensions--plugins) ⚡ *New*
- [Performance & Privacy](#performance--privacy)
- [Customization & Profiles](#customization--profiles)
- [Platform Differences](#platform-differences)
- [Quick Reference Tables](#quick-reference-tables)

---

## Configuration Structure

### December 2025 Reorganization

The configuration file has been completely reorganized into **10 major sections** with **33 subsections**, ordered by importance and workflow frequency:

#### Section Overview

| # | Section | Purpose | Lines | Subsections |
|---|---------|---------|-------|-------------|
| 1 | **EDITOR CORE SETTINGS** | Daily editing features | 3-94 | 6 |
| 2 | **WORKBENCH & UI** | Visual appearance | 96-157 | 7 |
| 3 | **TERMINAL** | Terminal config | 158-215 | 2 |
| 4 | **LANGUAGE & FILE SETTINGS** | Language behaviors | 216-337 | 3 |
| 5 | **SALESFORCE** ⚡ | Salesforce dev tools | 338-373 | 1 |
| 6 | **FILES & SEARCH** ⚡ | File handling | 374-426 | 2 |
| 7 | **DEVELOPER TOOLS** | Git, debug, dev | 427-503 | 6 |
| 8 | **EXTENSIONS & PLUGINS** ⚡ | Extensions config | 504-575 | 3 |
| 9 | **PRIVACY & MISC** | Privacy, sync | 576-644 | 4 |
| 10 | **CUSTOMIZATION** | Colors, themes | 645-929 | 4 |

⚡ *New dedicated sections created in December 2025 reorganization*

#### Why This Order?

1. **Frequency of access** - Most-used settings first
2. **Workflow logic** - Editor → UI → Languages → Tools
3. **Importance** - Critical settings before optional customizations
4. **Discoverability** - Easier to find settings when organized logically

#### Key Improvements

✅ **Zero duplicates** - All redundant settings removed  
✅ **Logical grouping** - Related settings together  
✅ **Better navigation** - Clear section hierarchy  
✅ **Comprehensive docs** - Every setting explained  
✅ **Platform support** - Windows & macOS paths documented  

---

## Editor Core Settings

This section contains the most frequently used editor settings for daily coding, organized into 6 subsections:

1. **Fonts & Typography** - Font configuration and rendering
2. **Cursor & Selection** - Cursor appearance and selection behavior
3. **Code Intelligence & Suggestions** - IntelliSense and autocomplete
4. **Formatting & Code Actions** - Auto-formatting and code actions
5. **Bracket Colorization & Guides** - Bracket pair highlighting
6. **Editor Behavior & Appearance** - Tab size, word wrap, minimap, etc.

See the [configuration structure](#configuration-structure) for line numbers and subsection details.

---

## Workbench & UI

Visual appearance, layout, and user interface settings for the entire workspace.

### Subsections

1. **Theme & Visual Identity** - Color themes and icon themes
2. **Editor Tabs & Layout** - Tab behavior and editor layout
3. **Sidebar & Panels** - Sidebar positioning and panel configuration
4. **Explorer & Tree Views** - File explorer settings
5. **Breadcrumbs & Navigation** - Navigation breadcrumbs
6. **Notifications & Dialogs** - Dialog styles and notifications
7. **Performance & Behavior** - Workbench performance settings

---

## Editor Compatibility

### Supported IDEs

These settings work with any Code OSS-based editor:

- ✅ **Cursor** - AI-powered code editor
- ✅ **VSCodium** - FOSS build of VS Code (telemetry removed)
- ✅ **VS Code OSS** - Open-source Code editor
- ✅ **VS Code** - Microsoft's proprietary build

### Proprietary Features

⚠️ The following settings are Microsoft VS Code specific and may not work in other editors:

| Setting | Availability | Alternative |
|---------|-------------|-------------|
| `vscode_custom_css.imports` | VS Code + extension | Native theming in other editors |
| `github.copilot.*` | VS Code + GitHub Copilot | Use Cursor's native AI or other AI extensions |
| `remotehub.telemetry.enabled` | VS Code only | N/A in other editors |
| `salesforcedx-vscode-*` | Works in most Code OSS editors | Install Salesforce extensions separately |

---

## Editor Experience & Appearance

### Workbench & Window Layout

#### Visual Organization

```json
"workbench.sideBar.location": "right"
```
**Purpose**: Places sidebar on the right for left-handed workflows or multi-monitor setups.  
**Alternative Values**: `"left"` (default)

```json
"workbench.editor.wrapTabs": true
"workbench.editor.pinnedTabsOnSeparateRow": true
```
**Purpose**: Better tab management when working with many files. Wraps tabs to multiple rows and separates pinned tabs.  
**Use Case**: Large projects with 10+ files open simultaneously

```json
"workbench.tree.indent": 16
```
**Purpose**: Increases folder tree indentation for better visual hierarchy.  
**Range**: 8-40 pixels, 16 is optimal for deeply nested projects

#### Color Theme & Icons

```json
"workbench.colorTheme": "Noctis Bordo"
"workbench.iconTheme": "material-icon-theme"
"workbench.productIconTheme": "fluent-icons"
```
**Purpose**: Consistent dark theme with modern iconography.  
**Dependencies**: Requires extensions:
- `liviuschera.noctis` for Noctis themes
- `PKief.material-icon-theme` for file icons
- `miguelsolorio.fluent-icons` for UI icons

#### Window Title Format

```json
"window.title": "${rootName}🗃️${separator}${dirty}${activeEditorShort}👈🏻 ${activeFolderShort}📂 MERN🪩"
```
**Purpose**: Customized window title showing project context and tech stack.  
**Variables**:
- `${rootName}` - Workspace/folder name
- `${activeEditorShort}` - Current file name
- `${activeFolderShort}` - Current file's parent folder
- `${dirty}` - Shows `●` for unsaved files

**Emoji Meanings**:
- 🪩 MERN Stack
- ⚛️ React
- ☁️ Salesforce
- 💙 Flutter/Dart
- 🐍 Python
- 🐘 PHP
- 💚 Vue

### Fonts & Typography

#### Editor Fonts

```json
"editor.fontFamily": "'CaskaydiaMono Nerd Font','CaskaydiaCove Nerd Font','Hack Nerd Font','Cascadia Code','Fira Code',Consolas"
"editor.fontSize": 20
"editor.fontLigatures": true
```
**Purpose**: Prioritized font list with ligature support for better code readability.  
**Font Features**:
- **Nerd Fonts**: Include icons and glyphs for terminal/file icons
- **Cascadia Code**: Microsoft's coding font with ligatures
- **Fira Code**: Popular open-source coding font
- **Consolas**: Fallback system font

**Installation**:
- Download Nerd Fonts from [nerdfonts.com](https://www.nerdfonts.com/)
- Install Cascadia Code from [GitHub](https://github.com/microsoft/cascadia-code)

#### Terminal Fonts

```json
"terminal.integrated.fontFamily": "'CaskaydiaMono Nerd Font','CaskaydiaCove Nerd Font','Hack Nerd Font','Cascadia Code','Cascadia Code NF','Fira Code',Consolas"
```
**Purpose**: Consistent font in terminal with icon support for better CLI experience.

### Cursor & Animations

```json
"editor.cursorStyle": "line"
"editor.cursorBlinking": "expand"
"editor.cursorWidth": 3
"editor.cursorSmoothCaretAnimation": "on"
```
**Purpose**: Highly visible cursor with smooth animations for better tracking.  
**Customization**:
- `cursorStyle`: `"line"` | `"block"` | `"underline"`
- `cursorBlinking`: `"blink"` | `"smooth"` | `"phase"` | `"expand"` | `"solid"`

### Bracket Colorization

```json
"editor.bracketPairColorization.enabled": true
"editor.guides.bracketPairs": true
"editor.guides.highlightActiveBracketPair": true
```
**Purpose**: Color-codes matching brackets for easier navigation in nested code.

**Custom Bracket Colors**:
```json
"editorBracketHighlight.foreground1": "#1290f7"  // Blue
"editorBracketHighlight.foreground2": "#fdaa1a"  // Orange
"editorBracketHighlight.foreground3": "#cb26fd"  // Purple
"editorBracketHighlight.foreground4": "#0de4fc"  // Cyan
"editorBracketHighlight.foreground5": "#92ff24"  // Green
"editorBracketHighlight.foreground6": "#f3f719"  // Yellow
"editorBracketHighlight.unexpectedBracket.foreground": "#fc232a"  // Red
```

### Code Styling (Token Colorization)

```json
"editor.tokenColorCustomizations": {
  "textMateRules": [
    {
      "scope": ["comment", "keyword", "string.quoted.single.js"],
      "settings": { "fontStyle": "italic" }
    },
    {
      "scope": ["keyword.control.conditional", "keyword.operator"],
      "settings": { "fontStyle": "bold" }
    }
  ]
}
```
**Purpose**: Applies italic/bold styling to specific syntax elements for visual hierarchy.  
**Affected Elements**:
- **Italic**: Comments, keywords, strings, storage modifiers
- **Bold**: Conditional keywords (if/else), operators, arrow functions

---

## Language-Specific Settings

### JavaScript & TypeScript

```json
"[javascript]": {
  "editor.defaultFormatter": "vscode.typescript-language-features"
},
"[typescript]": {
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true
}
```
**Purpose**: Uses built-in formatter for JS, Prettier for TS.  
**Dependencies**: `esbenp.prettier-vscode` extension

```json
"typescript.updateImportsOnFileMove.enabled": "always"
"typescript.preferences.quoteStyle": "single"
```
**Purpose**: Auto-updates imports when moving files, enforces single quotes.

### Python

```json
"[python]": {
  "editor.defaultFormatter": "ms-python.python",
  "editor.formatOnSave": true,
  "editor.formatOnType": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports": "explicit"
  }
}
```
**Purpose**: Python-specific formatting and import organization.  
**Dependencies**: `ms-python.python` extension

```json
"python.formatting.provider": "black"
"python.linting.pylintEnabled": true
"python.analysis.typeCheckingMode": "basic"
```
**Purpose**: Uses Black formatter, enables Pylint, basic type checking.  
**Installation**: `pip install black pylint`

### Markdown

```json
"[markdown]": {
  "editor.defaultFormatter": "yzhang.markdown-all-in-one",
  "editor.wordWrap": "on",
  "editor.formatOnSave": true
}
```
**Purpose**: Formats Markdown with word wrap enabled.  
**Dependencies**: `yzhang.markdown-all-in-one` extension

### HTML & CSS

```json
"[html]": {
  "editor.defaultFormatter": "vscode.html-language-features",
  "editor.trimAutoWhitespace": false
}
```
**Purpose**: Uses built-in HTML formatter, preserves intentional whitespace.

```json
"html.format.indentInnerHtml": true
"html.format.wrapLineLength": 0
```
**Purpose**: Indents `<head>` and `<body>`, disables line wrapping.

### Dart & Flutter

```json
"[dart]": {
  "editor.formatOnSave": true,
  "editor.formatOnType": true,
  "editor.tabCompletion": "onlySnippets"
}
```
**Purpose**: Flutter-optimized settings with aggressive formatting.  
**Dependencies**: `Dart-Code.dart-code` extension

```json
"dart.lineLength": 100
```
**Purpose**: Follows Flutter's recommended 100-character line length.

---

## Salesforce Development

### Salesforce DX Core Settings

```json
"salesforcedx-vscode-core.retrieve-test-code-coverage": true
"salesforcedx-vscode-core.detectConflictsAtSync": true
"salesforcedx-vscode-core.telemetry.enabled": false
```
**Purpose**: Retrieves test coverage, detects sync conflicts, disables telemetry.  
**Dependencies**: `salesforce.salesforcedx-vscode` extension pack

```json
"salesforcedx-vscode-core.show-cli-success-msg": false
```
**Purpose**: Reduces notification noise from Salesforce CLI operations.

### Einstein for Developers

```json
"salesforce.einsteinForDevelopers.enable": false
"salesforce.einsteinForDevelopers.enableAutocompletions": false
```
**Purpose**: Disables Einstein AI features (personal preference or use Cursor's AI instead).  
**Note**: Set to `true` if you want to use Salesforce's AI code completion.

### Apex Java Configuration

```json
"salesforcedx-vscode-apex.java.home": "/Library/Java/JavaVirtualMachines/zulu-21.jdk/Contents/Home"
```
**Purpose**: Points Apex Language Server to Java 21 JDK.  
**Platform Paths**:
- **macOS**: `/Library/Java/JavaVirtualMachines/zulu-21.jdk/Contents/Home`
- **Windows**: `C:\\Program Files\\Eclipse Adoptium\\jdk-21.0.7.6-hotspot`

**Requirements**: Java 17+ for Apex Language Server

### Salesforce File Associations

```json
"files.associations": {
  "*.apxc": "java",
  "*.cmp": "html",
  "*.gs": "javascript"
}
```
**Purpose**: Treats Apex cache files as Java, Aura components as HTML, Google Apps Script as JS.

### Code Analyzer

```json
"codeAnalyzer.enableV5": true
```
**Purpose**: Enables Salesforce Code Analyzer v5 for static code analysis.  
**Dependencies**: `salesforce.sfdx-code-analyzer-vscode` extension

---

## Performance & Privacy

### Telemetry Disabled

```json
"telemetry.telemetryLevel": "off"
"telemetry.feedback.enabled": false
"telemetry.editStats.enabled": false
"redhat.telemetry.enabled": false
"githubPullRequests.telemetry.enabled": false
"typescript.surveys.enabled": false
```
**Purpose**: Completely disables telemetry and data collection for maximum privacy.  
**Coverage**: Core editor, Red Hat extensions, GitHub extensions, TypeScript

### Copilot & AI Settings

```json
"github.copilot.enable": { "*": false }
"chat.agent.enabled": false
"chat.commandCenter.enabled": false
```
**Purpose**: Disables GitHub Copilot and AI chat features.  
**Note**: If using Cursor, its native AI is preferred over Copilot

### File Watching & Performance

```json
"files.watcherExclude": {
  "**/.git/objects/**": true,
  "**/node_modules/**": true,
  "**/dist/**": true,
  "**/bower_components/**": true
}
```
**Purpose**: Excludes large directories from file watching to improve performance.

```json
"search.exclude": {
  "**/node_modules": true,
  "**/bower_components": true,
  "**/.sfdx": true
}
```
**Purpose**: Excludes directories from search for faster results.

### Auto-Save

```json
"files.autoSave": "afterDelay"
"files.autoSaveDelay": 60000
```
**Purpose**: Auto-saves files after 60 seconds of inactivity (adjust as needed).  
**Alternative**: `"files.autoSave": "off"` to disable

---

## Extensions & Tools

### Prettier

```json
"prettier.singleQuote": true
"prettier.trailingComma": "all"
"prettier.tabWidth": 2
"prettier.semi": true
"prettier.printWidth": 100
```
**Purpose**: Consistent code formatting across JavaScript/TypeScript/CSS/HTML.  
**Dependencies**: `esbenp.prettier-vscode` extension

### ESLint

```json
"eslint.validate": ["javascript", "javascriptreact", "typescript", "typescriptreact"]
"eslint.format.enable": true
```
**Purpose**: Validates and formats code using ESLint rules.  
**Dependencies**: `dbaeumer.vscode-eslint` extension

### Docker/Containers

```json
"containers.containers.sortBy": "CreatedTime"
"containers.images.sortBy": "CreatedTime"
```
**Purpose**: Sorts Docker containers and images by creation time.  
**Dependencies**: `ms-azuretools.vscode-docker` extension  
**Note**: Migrated from deprecated `docker.*` settings

### Live Server

```json
"liveServer.settings.CustomBrowser": "chrome:PrivateMode"
"liveServer.settings.donotShowInfoMsg": true
```
**Purpose**: Opens Live Server in Chrome private mode, hides info messages.  
**Dependencies**: `ritwickdey.LiveServer` extension

### Custom CSS/JS Loader

```json
"vscode_custom_css.imports": [
  "file:///C:\\Users\\Maaz\\AppData\\Roaming\\VSCodeCustomCSS\\style.css",
  "file:///C:\\Users\\Maaz\\AppData\\Roaming\\VSCodeCustomCSS\\script.js"
]
```
**Purpose**: Loads custom CSS/JS for IDE appearance customization.  
**Dependencies**: `be5invis.vscode-custom-css` extension  
**⚠️ VS Code Specific**: Requires patch mode, see [Customization Guide](CUSTOMIZATION_GUIDE.md)

---

## Git & Source Control

### Git Configuration

```json
"git.autofetch": true
"git.confirmSync": true
"git.enableSmartCommit": true
"git.fetchOnPull": true
```
**Purpose**: Auto-fetches updates, confirms sync, enables smart commits.

### Branch Protection

```json
"git.branchProtection": ["main", "master", "develop"]
```
**Purpose**: Prevents accidental commits directly to protected branches.

### GitLens Settings

```json
"gitlens.blame.ignoreWhitespace": true
"gitlens.views.commitDetails.files.layout": "list"
```
**Purpose**: Ignores whitespace in blame view, shows commit files as list.  
**Dependencies**: `eamodio.gitlens` extension

### Diff Editor

```json
"diffEditor.renderSideBySide": true
"diffEditor.ignoreTrimWhitespace": false
"diffEditor.diffAlgorithm": "advanced"
```
**Purpose**: Shows diffs side-by-side with advanced algorithm for better accuracy.

---

## Terminal Configuration

### Default Profiles

#### Windows
```json
"terminal.integrated.defaultProfile.windows": "PowerShell"
"terminal.integrated.profiles.windows": {
  "PowerShell": {
    "source": "PowerShell",
    "icon": "terminal-powershell"
  }
}
```

#### macOS/Linux
```json
"terminal.integrated.defaultProfile.linux": "zsh"
"terminal.integrated.profiles.linux": {
  "zsh": {
    "path": "/bin/zsh",
    "icon": "terminal-linux"
  }
}
```

### Terminal Features

```json
"terminal.integrated.copyOnSelection": true
"terminal.integrated.scrollback": 10000
"terminal.integrated.stickyScroll.enabled": true
```
**Purpose**: Copies on selection, increases scrollback buffer, shows command sticky scroll.

---

## Platform Differences

### File Paths

#### Windows
```json
"vscode_custom_css.imports": [
  "file:///C:\\Users\\Maaz\\AppData\\Roaming\\VSCodeCustomCSS\\style.css"
]
```

#### macOS
```json
"vscode_custom_css.imports": [
  "file:///Users/maaz.rahman/VSCodeCustom/custom-vscode.css"
]
```

### Java Home (Salesforce)

#### Windows
```json
"salesforcedx-vscode-apex.java.home": "C:\\Program Files\\Eclipse Adoptium\\jdk-21.0.7.6-hotspot"
```

#### macOS
```json
"salesforcedx-vscode-apex.java.home": "/Library/Java/JavaVirtualMachines/zulu-21.jdk/Contents/Home"
```

---

## Quick Reference Tables

### Essential Settings

| Setting | Value | Purpose |
|---------|-------|---------|
| `editor.fontSize` | `20` | Comfortable reading size |
| `editor.tabSize` | `2` | Standard indentation |
| `editor.formatOnSave` | `true` | Auto-format on save |
| `files.autoSave` | `"afterDelay"` | Auto-save after delay |
| `editor.minimap.enabled` | `false` | Disable minimap |
| `workbench.sideBar.location` | `"right"` | Sidebar on right |

### Performance Settings

| Setting | Value | Impact |
|---------|-------|---------|
| `files.watcherExclude` | Excludes large dirs | Reduces CPU usage |
| `search.exclude` | Excludes search dirs | Faster search |
| `editor.largeFileOptimizations` | `false` | Full features for large files |
| `telemetry.telemetryLevel` | `"off"` | No data collection |

### Formatter Priority

| Language | Formatter | Extension |
|----------|-----------|-----------|
| JavaScript | Built-in | None |
| TypeScript | Prettier | `esbenp.prettier-vscode` |
| Python | Black | `ms-python.python` |
| HTML | Built-in | None |
| CSS | Built-in | None |
| Markdown | Markdown All in One | `yzhang.markdown-all-in-one` |

---

[← Back to Main README](../README.md) | [Next: Profiles Guide →](PROFILES_GUIDE.md)
