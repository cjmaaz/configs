# Customization Guide

> Custom CSS and JavaScript for enhanced IDE appearance and user experience.

[← Back to Main README](../README.md)

## Table of Contents

- [Overview](#overview)
- [What Gets Customized](#what-gets-customized)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Custom CSS Features](#custom-css-features)
- [Custom JavaScript Features](#custom-javascript-features)
- [IDE-Specific Setup](#ide-specific-setup)
- [Modifying Styles](#modifying-styles)
- [Troubleshooting](#troubleshooting)
- [Reverting Changes](#reverting-changes)

---

## Overview

This repository includes custom CSS and JavaScript files that enhance the IDE's visual appearance beyond what's possible with standard settings. These customizations add:

- Blurred backdrop effect for command palette
- Custom shadows and depth
- Styled hover tooltips
- Enhanced sidebar appearance
- Custom scrollbar styling

**⚠️ Important Notes**:
- Requires patching IDE files (requires extension)
- Works best in **VS Code** (Microsoft build)
- **Limited support** in Cursor, VSCodium, Code OSS
- Must be re-applied after IDE updates
- Changes are cosmetic only (doesn't affect functionality)

---

## What Gets Customized

### Visual Enhancements

| Component | Customization |
|-----------|---------------|
| **Command Palette** | Blurred backdrop, centered position, custom styling |
| **Sidebar** | Enhanced shadows, hidden action buttons |
| **Hover Tooltips** | Custom gradient background, rounded corners |
| **Scrollbars** | Thin custom-colored scrollbar |
| **Search Icon** | Hidden for cleaner appearance |
| **File Explorer** | Selected item highlighting |

### Before & After

**Standard IDE**:
- Flat command palette
- Basic sidebar
- Standard tooltips
- Default scrollbars

**With Customizations**:
- Command palette with blurred backdrop
- Sidebar with depth via shadows
- Gradient-styled tooltips with rounded borders
- Sleek minimal scrollbars

---

## Prerequisites

### Required Extension

**Custom CSS and JS Loader**
- **ID**: `be5invis.vscode-custom-css`
- **Marketplace**: [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=be5invis.vscode-custom-css)

**Installation**:
```
Cmd/Ctrl + Shift + X → Search "Custom CSS and JS Loader" → Install
```

### System Requirements

| IDE | Support Level | Notes |
|-----|---------------|-------|
| **VS Code** | ✅ Full | Best compatibility |
| **Cursor** | ⚠️ Partial | May require manual patching |
| **VSCodium** | ⚠️ Partial | Extension available, may have issues |
| **Code OSS** | ⚠️ Partial | Manual setup required |

### Administrator/Sudo Access

The extension needs to modify IDE installation files, requiring:
- **Windows**: Administrator privileges
- **macOS/Linux**: Sudo access

---

## Installation

### Step 1: Copy Custom Files

#### Windows

1. Create directory for custom files:
   ```cmd
   mkdir C:\Users\%USERNAME%\AppData\Roaming\VSCodeCustomCSS
   ```

2. Copy custom files:
   ```cmd
   copy code-oss\customization\custom-style.css C:\Users\%USERNAME%\AppData\Roaming\VSCodeCustomCSS\style.css
   copy code-oss\customization\custom-script.js C:\Users\%USERNAME%\AppData\Roaming\VSCodeCustomCSS\script.js
   ```

#### macOS

1. Create directory:
   ```bash
   mkdir -p ~/VSCodeCustom
   ```

2. Copy custom files:
   ```bash
   cp code-oss/customization/custom-style.css ~/VSCodeCustom/custom-vscode.css
   cp code-oss/customization/custom-script.js ~/VSCodeCustom/custom-vscode-script.js
   ```

#### Linux

Similar to macOS:
```bash
mkdir -p ~/.vscode-custom
cp code-oss/customization/custom-style.css ~/.vscode-custom/style.css
cp code-oss/customization/custom-script.js ~/.vscode-custom/script.js
```

### Step 2: Configure Settings

Add to your `settings.json`:

#### Windows
```json
{
  "vscode_custom_css.imports": [
    "file:///C:\\Users\\YourUsername\\AppData\\Roaming\\VSCodeCustomCSS\\style.css",
    "file:///C:\\Users\\YourUsername\\AppData\\Roaming\\VSCodeCustomCSS\\script.js"
  ]
}
```

Replace `YourUsername` with your actual Windows username.

#### macOS
```json
{
  "vscode_custom_css.imports": [
    "file:///Users/yourusername/VSCodeCustom/custom-vscode.css",
    "file:///Users/yourusername/VSCodeCustom/custom-vscode-script.js"
  ]
}
```

Replace `yourusername` with your actual macOS username.

#### Linux
```json
{
  "vscode_custom_css.imports": [
    "file:///home/yourusername/.vscode-custom/style.css",
    "file:///home/yourusername/.vscode-custom/script.js"
  ]
}
```

### Step 3: Enable Custom CSS

1. Open Command Palette (`Cmd/Ctrl + Shift + P`)
2. Type: **"Enable Custom CSS and JS"**
3. Select the command
4. Grant administrator/sudo privileges when prompted
5. Restart IDE

**Success**: You should see a warning about modified installation (this is normal)

### Step 4: Verify Installation

1. Open Command Palette (`Cmd/Ctrl + Shift + P`)
2. Check for blurred backdrop effect
3. Hover over code to see styled tooltips
4. Check sidebar for enhanced shadows

If customizations aren't visible, see [Troubleshooting](#troubleshooting).

---

## Custom CSS Features

### Command Palette Styling

**File**: `custom-style.css` (Lines 85-125)

```css
.quick-input-widget {
  transform: translateY(-50%) !important;
  top: 50% !important;
  box-shadow: 0px 8px 32px rgba(0, 0, 0, .35) !important;
  padding: 10px 10px 18px 10px !important;
  background-image: linear-gradient(#413036 0%, #322a2d 100%) !important;
  backdrop-filter: blur(3px) !important;
  border-radius: 5px !important;
}
```

**Effect**: Centers command palette with gradient background and blur

### Hover Tooltips

**File**: `custom-style.css` (Lines 70-83)

```css
.monaco-editor-hover,
.monaco-hover {
  box-shadow: 0px 8px 32px rgba(0, 0, 0, .45) !important;
  background-image: linear-gradient(#413036 0%, #322a2d 100%) !important;
  backdrop-filter: blur(3px) !important;
  border-radius: 5px !important;
  border: 3px solid #fff !important;
}
```

**Effect**: Styled tooltips with gradient and white border

### Sidebar Enhancements

**File**: `custom-style.css` (Lines 1-4)

```css
.part.sidebar {
  box-shadow: 0px 0px 50px rgba(0, 0, 0, .25);
}
```

**Effect**: Adds depth to sidebar with shadow

### Custom Scrollbar

**File**: `custom-style.css` (Lines 55-63)

```css
.slider {
  position: absolute !important;
  right: 1px !important;
  width: 1px !important;
  background: #bc9abc !important;
  left: auto !important;
}
```

**Effect**: Thin purple scrollbar on right side

---

## Custom JavaScript Features

### Blurred Backdrop Logic

**File**: `custom-script.js`

The JavaScript implements intelligent backdrop blur for the command palette:

**Key Features**:
1. **Mutation Observer**: Detects when command palette opens/closes
2. **Backdrop Element**: Creates `#command-blur` div overlay
3. **ESC Key Handling**: Removes backdrop when closing palette
4. **Sticky Widget Management**: Hides/shows widgets appropriately

**How It Works**:

```javascript
function runMyScript() {
  const targetDiv = document.querySelector(".monaco-workbench");
  const newElement = document.createElement("div");
  newElement.setAttribute('id', 'command-blur');
  targetDiv.appendChild(newElement);
  // Adds blurred backdrop behind command palette
}
```

**Triggers**:
- Cmd/Ctrl + P (Command Palette)
- Cmd/Ctrl + Shift + P (Command Palette with ">")
- ESC key (removes backdrop)

---

## IDE-Specific Setup

### VS Code (Microsoft)

**Compatibility**: ✅ Excellent

**Steps**:
1. Follow standard installation
2. Extension works out-of-the-box
3. Re-apply after updates: `Cmd/Ctrl + Shift + P` → "Enable Custom CSS and JS"

**Update Warning**: 
```
VS Code was modified. Please reinstall if you see this message.
```
**Fix**: This is expected. Dismiss or add to "Do not show again"

---

### Cursor

**Compatibility**: ⚠️ Partial

**Known Issues**:
- Extension may not be available in Cursor's marketplace
- Manual patching required

**Workaround**:
1. Install extension manually from VSIX
2. Or use Cursor's built-in customization (if available)
3. Alternatively, skip custom CSS/JS and use native Cursor themes

**Recommendation**: Use Cursor's native theming instead of custom CSS

---

### VSCodium

**Compatibility**: ⚠️ Partial

**Steps**:
1. Check if extension is available in Open-VSX
2. If not, install from VSIX file
3. May require manual patching

**Alternative**: Use built-in VSCodium themes

---

### VS Code OSS

**Compatibility**: ⚠️ Partial

**Steps**:
1. Manually install extension
2. Patch installation files manually if extension doesn't work
3. Custom CSS may not persist after updates

**Recommendation**: Stick with standard theming

---

## Modifying Styles

### Editing CSS

1. Open `code-oss/customization/custom-style.css`
2. Modify desired CSS rules
3. Save file
4. Reload custom CSS:
   - `Cmd/Ctrl + Shift + P` → "Reload Custom CSS and JS"
5. Restart IDE if changes don't apply

### Common Modifications

#### Change Command Palette Position

```css
.quick-input-widget {
  top: 30% !important;  /* Move higher */
  /* OR */
  top: 70% !important;  /* Move lower */
}
```

#### Change Tooltip Border Color

```css
.monaco-editor-hover,
.monaco-hover {
  border: 3px solid #00ff00 !important;  /* Green border */
}
```

#### Change Scrollbar Color

```css
.slider {
  background: #ff0000 !important;  /* Red scrollbar */
}
```

### Testing Changes

1. Make CSS modifications
2. Run: `Cmd/Ctrl + Shift + P` → "Reload Custom CSS and JS"
3. If changes don't apply, restart IDE
4. If still not working, disable and re-enable custom CSS

---

## Troubleshooting

### Changes Not Applying

**Issue**: Custom styles don't show after installation

**Solutions**:
1. Verify file paths in settings are correct (check slashes and file:/// protocol)
2. Reload custom CSS: `Cmd/Ctrl + Shift + P` → "Reload Custom CSS and JS"
3. Restart IDE completely
4. Disable/re-enable custom CSS extension
5. Check console for errors: `Help` → `Toggle Developer Tools` → Console tab

### Permission Denied

**Issue**: "Permission denied" when enabling custom CSS

**Solutions**:
- **Windows**: Run IDE as Administrator (right-click → "Run as administrator")
- **macOS/Linux**: Grant sudo access when prompted
- **Alternative**: Modify file permissions on IDE installation directory

### IDE Shows "Corrupted" Warning

**Issue**: "IDE installation appears to be corrupt" message

**This is Normal**: Custom CSS modifies IDE files, triggering integrity check

**Solutions**:
1. Click "Don't Show Again"
2. OR ignore the warning (safe to do so)
3. **Do NOT** reinstall IDE (will remove customizations)

### Customizations Disappear After Update

**Issue**: Styles revert after IDE update

**Solution**: Re-apply custom CSS after each IDE update
```
Cmd/Ctrl + Shift + P → "Enable Custom CSS and JS"
```

**Automation** (Advanced):
Create a post-update script to auto-enable custom CSS

---

## Reverting Changes

### Disable Custom CSS

1. `Cmd/Ctrl + Shift + P` → "Disable Custom CSS and JS"
2. Grant admin/sudo access
3. Restart IDE
4. "Corrupted" warning should disappear

### Complete Removal

1. Disable custom CSS (above)
2. Remove settings:
   ```json
   // Delete these lines from settings.json
   "vscode_custom_css.imports": [...]
   ```
3. Uninstall extension: `Cmd/Ctrl + Shift + X` → Search extension → Uninstall
4. Delete custom files:
   - **Windows**: `C:\Users\YourUser\AppData\Roaming\VSCodeCustomCSS\`
   - **macOS**: `~/VSCodeCustom/`
   - **Linux**: `~/.vscode-custom/`

---

## Advanced Customization

### Adding New Styles

1. Open `custom-style.css`
2. Add new CSS rules at the end
3. Use `!important` to override IDE defaults
4. Target Monaco Editor classes (use DevTools to inspect)

### Debugging CSS

1. Open DevTools: `Help` → `Toggle Developer Tools`
2. Use Elements tab to inspect IDE components
3. Find Monaco Editor class names
4. Test CSS in DevTools console
5. Copy working CSS to `custom-style.css`

### Creating Themes

Instead of modifying core CSS, consider:
1. Creating a custom color theme extension
2. Publishing to marketplace for easier distribution
3. No need for patching with theme extensions

---

## Safety & Security

### Is Custom CSS Safe?

✅ **Yes, when used carefully**:
- Only modifies visual appearance
- Doesn't execute arbitrary code (JS is sandboxed)
- Changes are local to your machine

⚠️ **Risks**:
- IDE updates may break customizations
- Poorly written CSS can cause UI glitches
- Requires admin access to enable

### Best Practices

1. **Backup**: Keep original files before modifying
2. **Test**: Test CSS changes incrementally
3. **Version Control**: Track changes in Git
4. **Update Carefully**: Re-test after IDE updates
5. **Minimal JS**: Keep JavaScript simple (avoid complex logic)

---

## Resources

- **Extension**: [Custom CSS and JS Loader](https://marketplace.visualstudio.com/items?itemName=be5invis.vscode-custom-css)
- **Monaco Editor Docs**: [Monaco Editor API](https://microsoft.github.io/monaco-editor/)
- **DevTools**: Use built-in DevTools for CSS inspection
- **Community**: Search GitHub for more custom CSS examples

---

[← Back to Main README](../README.md) | [← Previous: Profiles Guide](PROFILES_GUIDE.md) | [Next: Salesforce Tools →](SALESFORCE_TOOLS.md)
