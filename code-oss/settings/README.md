# Code OSS Settings

> Configuration file variants for different use cases.

[← Back to Main README](../../README.md)

## Available Files

### 1. `config.json` (Recommended)

**Purpose**: Production-ready settings file.

**Use Case**: 
- Daily development
- Import into any Code OSS-based IDE
- Clean JSON without comments (IDE-compatible)

**Features**:
- All settings optimized and tested
- Deprecated settings migrated to modern equivalents
- Platform-agnostic where possible
- Compatible with Cursor, VSCodium, VS Code OSS, VS Code

---

### 2. `config.jsonc`

**Purpose**: JSONC variant with inline comments.

**Use Case**:
- Prefer JSON with Comments format
- Some IDEs support JSONC natively
- Same settings as `config.json` but with comments preserved

**Features**:
- Identical settings to `config.json`
- Inline comments for clarity
- Use if your IDE supports JSONC

---

### 3. `commented-config.json`

**Purpose**: Heavily annotated version for learning and reference.

**Use Case**:
- Understanding what each setting does
- Learning Code OSS configuration
- Reference for customizing your own settings

**Features**:
- Every setting explained with inline comments
- Organized by category
- Great for beginners
- **Note**: May have slight differences from `config.json` - use as reference only

---

## Which File to Use?

| Situation | Recommended File |
|-----------|-----------------|
| **Daily use** | `config.json` |
| **Learning** | `commented-config.json` |
| **JSONC IDE** | `config.jsonc` |
| **Reference** | `commented-config.json` |

---

## How to Import

### Method 1: Copy All Settings

1. Open IDE settings JSON: `Cmd/Ctrl + Shift + P` → "Preferences: Open Settings (JSON)"
2. Copy entire contents of chosen config file
3. Paste into your settings.json
4. Adjust platform-specific paths (Windows vs macOS)

### Method 2: Selective Import

1. Open both files (config + your settings)
2. Copy specific sections you want
3. Merge into your existing settings
4. Avoid duplicates

### Method 3: Use as Base

1. Delete your current settings.json
2. Copy chosen config file as your new settings.json
3. Customize as needed

---

## Key Differences

### config.json vs commented-config.json

Minor differences exist due to different last update times:

| Setting | config.json | commented-config.json |
|---------|-------------|----------------------|
| `editor.scrollBeyondLastLine` | `true` | `false` |
| `editor.foldingImportsByDefault` | `false` | `true` |
| `liveServer.settings.CustomBrowser` | `chrome:PrivateMode` | `brave incognito` |

**Recommendation**: Use `config.json` for actual settings, `commented-config.json` for reference.

---

## Migration Notes

All config files have been updated with:

✅ Deprecated `docker.*` → `containers.*`  
✅ Platform paths documented  
✅ IDE-agnostic comments  
✅ Proprietary features noted  

---

## Platform-Specific Adjustments

After importing, update these paths for your platform:

### Windows
```json
{
  "vscode_custom_css.imports": [
    "file:///C:\\Users\\YourUser\\AppData\\Roaming\\VSCodeCustomCSS\\style.css"
  ],
  "salesforcedx-vscode-apex.java.home": "C:\\Program Files\\Eclipse Adoptium\\jdk-21.0.7.6-hotspot"
}
```

### macOS
```json
{
  "vscode_custom_css.imports": [
    "file:///Users/youruser/VSCodeCustom/custom-vscode.css"
  ],
  "salesforcedx-vscode-apex.java.home": "/Library/Java/JavaVirtualMachines/zulu-21.jdk/Contents/Home"
}
```

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

---

## Further Reading

- [Settings Guide](../../docs/SETTINGS_GUIDE.md) - Comprehensive reference for all settings
- [Main README](../../README.md) - Overview and quick start

---

[← Back to Main README](../../README.md)
