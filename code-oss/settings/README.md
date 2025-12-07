# Code OSS Settings

> Production-ready configuration file for Code OSS-based IDEs.

[← Back to Main README](../../README.md)

## Available Files

### `config.jsonc` (Recommended)

**Purpose**: Production-ready settings file with comprehensive inline documentation.

**Use Case**: 
- Daily development (recommended)
- Import into any Code OSS-based IDE
- JSONC format (supports `//` comments for better readability)
- Learning through inline comments

### `config.json`

**Purpose**: Same as config.jsonc but in pure JSON format (no comments).

**Use Case**: 
- For tools that don't support JSONC
- Functionally identical to config.jsonc

**Features**:
- All settings optimized and tested
- Deprecated settings migrated to modern equivalents
- Platform-agnostic where possible
- Compatible with Cursor, VSCodium, VS Code OSS, VS Code
- Comprehensive inline comments explaining each setting
- Organized by category for easy navigation
- Latest AI chat and telemetry disable settings included

---

## How to Import

### Method 1: Copy All Settings

1. Open IDE settings JSON: `Cmd/Ctrl + Shift + P` → "Preferences: Open Settings (JSON)"
2. Copy entire contents of `config.json`
3. Paste into your settings.json
4. Adjust platform-specific paths (Windows vs macOS)

### Method 2: Selective Import

1. Open both files (config.json + your settings)
2. Copy specific sections you want
3. Merge into your existing settings
4. Avoid duplicates

### Method 3: Use as Base

1. Delete your current settings.json
2. Copy `config.json` as your new settings.json
3. Customize as needed

---

## Configuration Highlights

### Latest Updates (December 2025)

✅ **Complete reorganization** - Settings organized by importance and workflow  
✅ **10 major sections** with 33 granular subsections  
✅ **Zero duplicate keys** - All redundant settings removed  
✅ **New dedicated sections** - SALESFORCE, FILES & SEARCH, EXTENSIONS & PLUGINS  
✅ Deprecated `docker.*` → `containers.*`  
✅ Complete AI chat and telemetry controls disabled  
✅ Platform paths documented (Windows & macOS)  
✅ Git safety features enabled (`confirmForcePush`, `branchProtection`)  
✅ Enhanced editor features with comprehensive comments  

---

## File Organization

The configuration file is organized in **importance-based order** for optimal workflow:

### 1️⃣ **EDITOR CORE SETTINGS**
Most frequently used editor settings for daily coding:
- Fonts & Typography
- Cursor & Selection
- Code Intelligence & Suggestions
- Formatting & Code Actions
- Bracket Colorization & Guides
- Editor Behavior & Appearance

### 2️⃣ **WORKBENCH & UI**
Workspace appearance, layout, and user interface:
- Theme & Visual Identity
- Editor Tabs & Layout
- Sidebar & Panels
- Explorer & Tree Views
- Breadcrumbs & Navigation
- Notifications & Dialogs
- Performance & Behavior

### 3️⃣ **TERMINAL**
Integrated terminal configuration and behavior:
- Terminal Appearance (Windows/Linux/macOS profiles)
- Terminal Behavior

### 4️⃣ **LANGUAGE & FILE SETTINGS**
Language-specific behaviors and file handling:
- Emmet & IntelliSense
- Language-Specific Settings (15+ languages)
- Language-Specific Editor Overrides

### 5️⃣ **SALESFORCE** ⚡ *New Section*
Salesforce development tools and configuration:
- Code Analyzer
- DX Core Settings
- Apex Language Server
- Einstein Settings
- Java Configuration

### 6️⃣ **FILES & SEARCH** ⚡ *New Section*
File handling, associations, and search:
- File Associations
- File Handling Settings
- Search Configuration

### 7️⃣ **DEVELOPER TOOLS**
Source control, debugging, and development tools:
- Source Control & Git
- GitLens & GitHub
- Diff Editor
- Debug & Development
- Database & External Connections
- Live Server & Browser

### 8️⃣ **EXTENSIONS & PLUGINS** ⚡ *New Section*
Third-party extensions and plugin configuration:
- Extension Management
- External Tools & Formatters (Docker, ESLint, Prettier)
- Plugin Settings (15+ extensions configured)

### 9️⃣ **PRIVACY, SYNC & MISCELLANEOUS**
Privacy settings and miscellaneous options:
- Telemetry & Privacy (All disabled)
- Settings Sync
- Workspace Optimizations
- Accessibility & Usability

### 🔟 **CUSTOMIZATION & PROFILES**
Visual customizations (least frequently changed):
- Window Title Profiles
- Token Colorization
- Color Customizations
- Spell Checker Dictionary (cSpell)
- Custom CSS & JS Loader

---

## Platform-Specific Adjustments

After importing, update these paths for your platform:

### Windows
```json
{
  "vscode_custom_css.imports": [
    "file:///C:\\Users\\YourUser\\AppData\\Roaming\\VSCodeCustomCSS\\style.css",
    "file:///C:\\Users\\YourUser\\AppData\\Roaming\\VSCodeCustomCSS\\script.js"
  ],
  "terminal.integrated.fontFamily": "'CaskaydiaMono Nerd Font','CaskaydiaCove Nerd Font','Hack Nerd Font','Cascadia Code','Cascadia Code NF','Fira Code',Consolas",
  "salesforcedx-vscode-apex.java.home": "C:\\Program Files\\Eclipse Adoptium\\jdk-21.0.7.6-hotspot"
}
```

### macOS
```json
{
  "vscode_custom_css.imports": [
    "file:///Users/youruser/VSCodeCustom/custom-vscode.css",
    "file:///Users/youruser/VSCodeCustom/custom-vscode-script.js"
  ],
  "terminal.integrated.defaultProfile.linux": "zsh",
  "terminal.integrated.fontFamily": "'CaskaydiaMono Nerd Font','CaskaydiaCove Nerd Font','Hack Nerd Font','Cascadia Code','Cascadia Code NF','Fira Code',Consolas",
  "salesforcedx-vscode-apex.java.home": "/Library/Java/JavaVirtualMachines/zulu-21.jdk/Contents/Home"
}
```

---

## Key Features

### Editor Experience
- **Font**: Cascadia Code with ligatures and Nerd Font support
- **Cursor**: Yellow with expand animation and smooth caret
- **Bracket Pairs**: Colorized with 6-level rainbow highlighting
- **Auto-formatting**: On save and paste for multiple languages
- **Sticky scroll**: Disabled for cleaner view

### Terminal
- **Windows**: PowerShell (default)
- **macOS/Linux**: zsh with full shell integration
- **Features**: Smooth scrolling, copy on selection, sticky scroll for command tracking

### Git & Source Control
- **Safety**: Force push confirmation, branch protection (main/master/develop)
- **Smart commit**: Enabled with confirmation
- **Merge editor**: Advanced diff algorithm with side-by-side view

### Privacy & Performance
- **All telemetry disabled**: VSCode, extensions, and AI features
- **AI chat disabled**: Complete opt-out from chat features
- **File watching optimized**: Excludes node_modules, build artifacts

### Language Support
- **JavaScript/TypeScript**: Prettier + ESLint with auto-import updates
- **Python**: Black formatter with Pylint
- **Salesforce**: Apex with PMD, LWC, SOQL optimization
- **Dart/Flutter**: Auto-format on save and type
- **HTML/CSS/Vue**: Multiple formatter options configured

---

## Validation

After importing settings:

1. **Check for errors**: IDE should show no JSON errors
2. **Test features**: Open a file, test formatting, check extensions
3. **Review paths**: Ensure all file paths exist on your system
4. **Reload IDE**: `Cmd/Ctrl + Shift + P` → "Reload Window"

---

## Troubleshooting

### Settings Not Applying

**Issue**: Imported settings don't take effect

**Solutions**:
1. Reload IDE window
2. Check for JSON syntax errors
3. Ensure no duplicate keys
4. Verify extension dependencies are installed

### Font Not Found

**Issue**: Editor font doesn't match expected

**Solutions**:
1. Install recommended fonts (Cascadia Code, Fira Code, Nerd Fonts)
2. Font falls back to Consolas (always available)
3. Change `editor.fontFamily` to your preferred font

### Custom CSS Not Loading

**Issue**: Custom CSS/JS imports not working

**Solutions**:
1. Update file paths to match your system
2. Install "Custom CSS and JS Loader" extension
3. Run command: "Enable Custom CSS and JS"
4. Restart IDE

---

## Further Reading

- [Settings Guide](../../docs/SETTINGS_GUIDE.md) - Comprehensive reference for all settings
- [Main README](../../README.md) - Overview and quick start
- [Profiles Guide](../../docs/PROFILES_GUIDE.md) - Language-specific profile configurations

---

[← Back to Main README](../../README.md)
