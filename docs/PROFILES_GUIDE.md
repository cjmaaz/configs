# Profiles Guide

> Development profiles optimized for different technology stacks with pre-configured extensions, settings, and window titles.

[← Back to Main README](../README.md)

## Table of Contents

- [What are Profiles?](#what-are-profiles)
- [Available Profiles](#available-profiles)
- [Profile Comparison](#profile-comparison)
- [How to Use Profiles](#how-to-use-profiles)
- [Window Title Emojis](#window-title-emojis)
- [Customizing Profiles](#customizing-profiles)
- [IDE-Specific Instructions](#ide-specific-instructions)

---

## What are Profiles?

Profiles in Code OSS-based editors allow you to switch between different sets of extensions, settings, and UI customizations optimized for specific development contexts. Each profile contains:

- **Extensions**: Pre-installed extensions for the tech stack
- **Settings**: Optimized editor configurations
- **UI State**: Custom window title, sidebar layout, etc.
- **Keybindings**: (optional) Stack-specific shortcuts

**Benefits**:
- Quick context switching between projects
- Clean separation of concerns (no Salesforce extensions in React projects)
- Reduced memory footprint (only load what you need)
- Consistent environment across machines

---

## Available Profiles

### Web Development Profiles

#### MERN Stack 🪩
**File**: [`code-oss/profiles/MERN🪩.code-profile`](../code-oss/profiles/MERN🪩.code-profile)

**Optimized For**: MongoDB, Express, React, Node.js full-stack development

**Key Extensions**:
- React/JSX support
- MongoDB tools
- Node.js debugging
- REST client
- ESLint + Prettier

**Use When**:
- Building full-stack JavaScript applications
- Working with MongoDB databases
- Developing Express backends with React frontends

---

#### React ⚛️
**File**: [`code-oss/profiles/React⚛️.code-profile`](../code-oss/profiles/React⚛️.code-profile)

**Optimized For**: React & React Native frontend development

**Key Extensions**:
- ES7+ React snippets
- React component generators
- Styled components support
- Redux DevTools integration

**Use When**:
- Pure React frontend projects
- React Native mobile development
- Component library development

---

#### Vue 💚
**File**: [`code-oss/profiles/Vue💚.code-profile`](../code-oss/profiles/Vue💚.code-profile)

**Optimized For**: Vue.js 3 development with Vite

**Key Extensions**:
- Volar (Vue Language Features)
- Vue snippets
- Pinia state management
- Vue DevTools

**Use When**:
- Vue 3 applications
- Nuxt.js projects
- Vue component libraries

---

#### JavaScript/TypeScript 💛
**File**: [`code-oss/profiles/JS-TS💛.code-profile`](../code-oss/profiles/JS-TS💛.code-profile)

**Optimized For**: General JavaScript/TypeScript development

**Key Extensions**:
- TypeScript language support
- Path Intellisense
- Auto import
- JavaScript debugger

**Use When**:
- Vanilla JS/TS projects
- Library/package development
- Build tool configuration

---

### Backend & Systems Programming

#### Python 🐍
**File**: [`code-oss/profiles/Python🐍.code-profile`](../code-oss/profiles/Python🐍.code-profile)

**Optimized For**: Python development (Django, Flask, FastAPI, data science)

**Key Extensions**:
- Pylance (Python language server)
- Python debugger
- Jupyter notebook support
- autopep8/Black formatter

**Use When**:
- Python web applications
- Data science/ML projects
- Automation scripts
- Django/Flask development

---

#### Java/Spring ☕
**File**: [`code-oss/profiles/Java-Spring☕.code-profile`](../code-oss/profiles/Java-Spring☕.code-profile)

**Optimized For**: Java development with Spring Boot

**Key Extensions**:
- Extension Pack for Java
- Spring Boot Tools
- Maven/Gradle support
- Java debugger

**Use When**:
- Spring Boot microservices
- Enterprise Java applications
- Android development (without Flutter)

---

#### PHP/Laravel 🐘
**File**: [`code-oss/profiles/PHP-Laravel🐘.code-profile`](../code-oss/profiles/PHP-Laravel🐘.code-profile)

**Optimized For**: PHP development with Laravel framework

**Key Extensions**:
- PHP Intelephense
- Laravel snippets
- Blade template support
- PHP debugger

**Use When**:
- Laravel applications
- WordPress development
- PHP API development

---

#### C/C++ 🚦
**File**: [`code-oss/profiles/C-C++🚦.code-profile`](../code-oss/profiles/C-C++🚦.code-profile)

**Optimized For**: C/C++ system programming

**Key Extensions**:
- C/C++ Extension Pack
- CMake Tools
- GDB debugger
- Include autocomplete

**Use When**:
- System programming
- Embedded development
- Game development (C++)

---

#### C#/.NET 🪟
**File**: [`code-oss/profiles/C#-.NET🪟.code-profile`](../code-oss/profiles/C#-.NET🪟.code-profile)

**Optimized For**: .NET development (ASP.NET, Blazor, Unity)

**Key Extensions**:
- C# extension
- .NET SDK support
- NuGet package manager
- Unity snippets (if applicable)

**Use When**:
- ASP.NET Core applications
- Blazor web apps
- Unity game development

---

### Mobile & Cross-Platform

#### Flutter/Dart 💙
**File**: [`code-oss/profiles/Flutter-Dart💙.code-profile`](../code-oss/profiles/Flutter-Dart💙.code-profile)

**Optimized For**: Flutter mobile app development

**Key Extensions**:
- Dart language support
- Flutter tools
- Flutter widget snippets
- Android/iOS debugging

**Use When**:
- Cross-platform mobile development
- Flutter web applications
- Dart backend (Dart Frog)

---

### Enterprise & Cloud

#### Salesforce ☁️
**Files**: 
- [`code-oss/profiles/SF ☁️ (🍎).code-profile`](../code-oss/profiles/) (macOS)
- [`code-oss/profiles/SF ☁️ (🪟).code-profile`](../code-oss/profiles/) (Windows)

**Optimized For**: Salesforce development (Apex, LWC, Aura)

**Key Extensions**:
- Salesforce Extension Pack
- Apex language support
- Lightning Web Components
- Salesforce CLI integration
- Code Analyzer

**Use When**:
- Salesforce Apex development
- Lightning Web Component development
- Salesforce DX projects

**Platform Differences**:
- **macOS**: Java home points to `/Library/Java/...`
- **Windows**: Java home points to `C:\\Program Files\\...`

---

### General Purpose

#### Default 🏠
**File**: [`code-oss/profiles/Default.code-profile`](../code-oss/profiles/Default.code-profile)

**Optimized For**: General development with minimal extensions

**Use When**:
- Exploring new technologies
- Lightweight editing
- Configuration file editing
- Reading code without heavy tooling

---

## Profile Comparison

### Extensions Count

| Profile | Approx. Extensions | Memory Usage | Startup Time |
|---------|-------------------|--------------|--------------|
| Default | 10-15 | Low | Fast |
| JS/TS | 15-20 | Low-Medium | Fast |
| React | 20-25 | Medium | Medium |
| MERN | 25-30 | Medium-High | Medium |
| Python | 15-20 | Medium | Fast |
| Salesforce | 25-30 | High | Slow |
| Flutter | 10-15 | Medium | Medium |

### Use Case Matrix

| Profile | Web App | Mobile | Backend | Data Science | Enterprise |
|---------|---------|--------|---------|--------------|------------|
| MERN | ✅✅✅ | ❌ | ✅✅ | ❌ | ✅ |
| React | ✅✅✅ | ⚠️ | ❌ | ❌ | ✅ |
| Vue | ✅✅✅ | ❌ | ⚠️ | ❌ | ✅ |
| Python | ⚠️ | ❌ | ✅✅ | ✅✅✅ | ✅ |
| Flutter | ❌ | ✅✅✅ | ❌ | ❌ | ⚠️ |
| Salesforce | ⚠️ | ❌ | ⚠️ | ❌ | ✅✅✅ |
| PHP/Laravel | ✅✅ | ❌ | ✅✅ | ❌ | ✅ |

**Legend**: ✅✅✅ Excellent | ✅✅ Good | ✅ Adequate | ⚠️ Limited | ❌ Not Suitable

---

## How to Use Profiles

### Method 1: Import Profile (Recommended)

#### In VS Code / Cursor
1. Open Command Palette (`Cmd/Ctrl + Shift + P`)
2. Type "Profiles: Import Profile"
3. Select "Select File" and browse to profile file
4. Choose what to import (Settings, Extensions, UI State)
5. Click "Create Profile"

#### In VSCodium / VS Code OSS
1. Same as above, but extension sync may vary
2. Some extensions may need manual installation if marketplace differs

### Method 2: Manual Profile Creation

1. **Create New Profile**:
   - Command Palette → "Profiles: Create Profile"
   - Name it (e.g., "My React Setup")
   - Choose template: "None" (start fresh)

2. **Install Extensions**:
   - Open the profile's extension list
   - Install tech stack-specific extensions

3. **Copy Settings**:
   - Open `settings.json` in the profile
   - Copy relevant settings from the config files

4. **Set Window Title**:
   ```json
   "window.title": "${rootName}🗃️${separator}${dirty}${activeEditorShort}👈🏻 ${activeFolderShort}📂 React⚛️"
   ```

### Method 3: Workspace-Specific Profiles

For one-off projects without creating a full profile:

1. Open workspace settings (`.vscode/settings.json`)
2. Add project-specific overrides
3. See [Workspace Examples](../workspace-examples/README.md)

---

## Window Title Emojis

Profiles use emojis in window titles for quick visual identification:

| Emoji | Profile | Meaning |
|-------|---------|---------|
| 🪩 | MERN | Disco ball (MERN dance) |
| ⚛️ | React | Atom (React logo) |
| 💚 | Vue | Green heart (Vue brand color) |
| 💛 | JS/TS | Yellow heart (JavaScript color) |
| 🐍 | Python | Snake |
| ☁️ | Salesforce | Cloud |
| 💙 | Flutter | Blue heart (Flutter/Dart) |
| 🐘 | PHP/Laravel | Elephant (PHP logo) |
| ☕ | Java/Spring | Coffee (Java pun) |
| 🚦 | C/C++ | Traffic light (system control) |
| 🪟 | C#/.NET | Window (Windows/.NET) |
| 🏠 | Default | Home |

**Customization**:
Change emoji in window title setting:
```json
"window.title": "${rootName}🗃️${separator}${dirty}${activeEditorShort}👈🏻 ${activeFolderShort}📂 YOUR_EMOJI"
```

---

## Customizing Profiles

### Adding Extensions

1. Switch to profile
2. Install extensions from marketplace
3. Export profile to save changes

### Overriding Settings

Per-profile settings take precedence over global settings:

```json
// In profile's settings.json
{
  "editor.fontSize": 18,  // Override global fontSize for this profile
  "editor.formatOnSave": true
}
```

### Syncing Across Machines

#### VS Code
- Profiles sync automatically with Settings Sync
- Sign in with GitHub/Microsoft account

#### VSCodium / Cursor
- Manual export/import of `.code-profile` files
- Or use Git to version control profile files

---

## IDE-Specific Instructions

### Cursor

**Profile Support**: ✅ Full support

**Special Notes**:
- Cursor's AI features work in all profiles
- Use Cursor's built-in AI instead of GitHub Copilot
- Profile switching: `Cmd/Ctrl + Shift + P` → "Cursor: Switch Profile"

**Recommended Profiles for Cursor**:
- Any profile works seamlessly
- AI pair programming enhances React/Python/Salesforce workflows

---

### VSCodium

**Profile Support**: ✅ Full support (v1.70+)

**Special Notes**:
- Open-VSX marketplace instead of VS Code Marketplace
- Some proprietary extensions unavailable:
  - GitHub Copilot ❌
  - Remote Development (limited) ⚠️
  - Live Share ❌
- Most open-source extensions available

**Extension Alternatives**:
| VS Code Extension | VSCodium Alternative |
|-------------------|----------------------|
| GitHub Copilot | Tabnine, Codeium |
| Remote SSH | Native SSH support |
| Live Share | Code-Server |

---

### VS Code OSS

**Profile Support**: ✅ Full support

**Special Notes**:
- Similar to VSCodium (no telemetry)
- May require manual extension marketplace configuration
- All profiles work, adjust extension availability

---

### VS Code (Microsoft)

**Profile Support**: ✅ Full support + Cloud Sync

**Special Notes**:
- Best extension availability
- Automatic profile sync across devices
- All proprietary features work

---

## Best Practices

### Profile Management

1. **Don't Mix Contexts**: Keep profiles focused on one tech stack
2. **Use Default for Exploring**: Don't clutter specific profiles with experimental extensions
3. **Export Regularly**: Backup profiles before major updates
4. **Name Clearly**: Use descriptive names + emojis for quick identification

### Extension Management

1. **Install Only What You Need**: Each extension adds startup time
2. **Disable, Don't Uninstall**: Disable extensions in specific profiles rather than uninstalling globally
3. **Review Quarterly**: Remove unused extensions

### Switching Frequency

- **Within a project**: Create workspace settings instead of profile
- **Between projects**: Switch profiles when changing tech stacks
- **Daily drivers**: Pin 2-3 most-used profiles to quick switcher

---

## Troubleshooting

### Profile Won't Import

**Issue**: "Failed to import profile" error

**Solutions**:
1. Check IDE version (profiles require v1.65+)
2. Verify `.code-profile` file isn't corrupted
3. Try importing individual components (Settings, Extensions, UI State)
4. Create manually and copy settings

### Extensions Not Installing

**Issue**: Extensions don't install when importing profile

**Solutions**:
1. Check marketplace availability (VS Code vs Open-VSX)
2. Install extensions manually after importing
3. Use alternative extensions in VSCodium/OSS builds

### Window Title Not Changing

**Issue**: Emoji/title doesn't update after switching profiles

**Solutions**:
1. Reload IDE window (`Cmd/Ctrl + Shift + P` → "Reload Window")
2. Verify `window.title` setting in profile settings
3. Check for global settings override

---

[← Back to Main README](../README.md) | [← Previous: Settings Guide](SETTINGS_GUIDE.md) | [Next: Customization Guide →](CUSTOMIZATION_GUIDE.md)
