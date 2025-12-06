# Code OSS Customization

> Custom CSS and JavaScript for enhanced IDE appearance.

[← Back to Main README](../../README.md)

## Files

### `custom-style.css`
Custom CSS for enhanced visual appearance:
- Command palette blur effect
- Sidebar shadows
- Styled hover tooltips
- Custom scrollbars
- Hidden UI elements

### `custom-script.js`
JavaScript for interactive features:
- Command palette backdrop blur
- ESC key handling
- Sticky widget management
- DOM mutation observer

## Quick Setup

### 1. Install Extension

Search for and install: **Custom CSS and JS Loader** (`be5invis.vscode-custom-css`)

### 2. Copy Files

#### Windows
```cmd
mkdir C:\Users\%USERNAME%\AppData\Roaming\VSCodeCustomCSS
copy custom-style.css C:\Users\%USERNAME%\AppData\Roaming\VSCodeCustomCSS\style.css
copy custom-script.js C:\Users\%USERNAME%\AppData\Roaming\VSCodeCustomCSS\script.js
```

#### macOS
```bash
mkdir -p ~/VSCodeCustom
cp custom-style.css ~/VSCodeCustom/custom-vscode.css
cp custom-script.js ~/VSCodeCustom/custom-vscode-script.js
```

### 3. Configure Settings

Add to your `settings.json`:

**Windows**:
```json
{
  "vscode_custom_css.imports": [
    "file:///C:\\Users\\YourUser\\AppData\\Roaming\\VSCodeCustomCSS\\style.css",
    "file:///C:\\Users\\YourUser\\AppData\\Roaming\\VSCodeCustomCSS\\script.js"
  ]
}
```

**macOS**:
```json
{
  "vscode_custom_css.imports": [
    "file:///Users/youruser/VSCodeCustom/custom-vscode.css",
    "file:///Users/youruser/VSCodeCustom/custom-vscode-script.js"
  ]
}
```

### 4. Enable Custom CSS

1. `Cmd/Ctrl + Shift + P` → "Enable Custom CSS and JS"
2. Grant admin/sudo privileges
3. Restart IDE

## IDE Compatibility

| IDE | Support | Notes |
|-----|---------|-------|
| **VS Code** | ✅ Excellent | Full support |
| **Cursor** | ⚠️ Partial | May need manual setup |
| **VSCodium** | ⚠️ Partial | Extension available |
| **VS Code OSS** | ⚠️ Partial | Manual patch required |

## Features

### Visual Enhancements

- ✨ **Command Palette**: Blurred backdrop, centered, gradient background
- 🎨 **Tooltips**: Gradient background, white border, rounded corners
- 📦 **Sidebar**: Enhanced shadows for depth
- 📜 **Scrollbar**: Thin purple custom scrollbar
- 🔍 **Search**: Hidden search icon for cleaner UI

### Interactive Features

- ⌨️ **Keyboard**: ESC key closes command palette backdrop
- 👁️ **Visibility**: Smart widget hiding/showing
- 🔄 **Dynamic**: Mutation observer for real-time updates

## Detailed Documentation

For complete setup instructions, troubleshooting, and customization:

📖 [Customization Guide](../../docs/CUSTOMIZATION_GUIDE.md)

## Important Notes

⚠️ **Requires Admin Access**: Extension needs to modify IDE files  
⚠️ **Re-apply After Updates**: IDE updates may remove customizations  
⚠️ **"Corrupted" Warning Normal**: IDE shows warning when files are modified (safe to ignore)

## Troubleshooting

### Changes Not Applying?
1. Reload Custom CSS: `Cmd/Ctrl + Shift + P` → "Reload Custom CSS and JS"
2. Restart IDE
3. Verify file paths are correct

### Permission Denied?
- **Windows**: Run IDE as Administrator
- **macOS/Linux**: Grant sudo when prompted

### Reverting
1. `Cmd/Ctrl + Shift + P` → "Disable Custom CSS and JS"
2. Delete files from custom directory
3. Remove settings from `settings.json`

---

[← Back to Main README](../../README.md) | [View Full Customization Guide →](../../docs/CUSTOMIZATION_GUIDE.md)
