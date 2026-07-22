# Neovim configuration

A modular, polyglot Neovim configuration built on
[lazy.nvim](https://github.com/folke/lazy.nvim). It targets Neovim 0.12+
and covers web development, Python, Salesforce Apex/LWC, Java/Spring, Lua,
Rust, C/C++, and SQL/Postgres.

## What is included

- Core options, keymaps, autocommands, persistent undo, system clipboard,
  relative line numbers, and automatic trailing-whitespace cleanup for code.
- Kanagawa Dragon as the default colorscheme: a dark, warm, muted late-night
  palette that avoids bright backgrounds while retaining WCAG AA text contrast.
- lazy.nvim plugin management with a committed `lazy-lock.json` after the
  first successful bootstrap.
- Modern Treesitter `main` branch, Telescope, neo-tree, gitsigns, lualine,
  which-key, todo-comments, indent guides, autopairs, and tag auto-closing.
- Native Neovim LSP (`vim.lsp.config`) through Mason:
  - Web: vtsls, Vue Language Server, ESLint, HTML, CSS, Emmet, JSON, YAML.
  - Python: basedpyright + Ruff.
  - Lua: lua-language-server + lazydev.
  - C/C++: clangd.
  - SQL/Postgres: sqls + SQLFluff.
  - Salesforce Apex: Salesforce Apex Language Server; LWC uses the web stack.
  - Java: nvim-jdtls with one workspace per project.
  - Rust: rustaceanvim (the only rust-analyzer owner; no duplicate LSP).
- Completion through blink.cmp + LuaSnip + friendly-snippets.
- Formatting through conform.nvim and linting through nvim-lint.

## Requirements

Required:

- Neovim **0.12.0+** (the nvim-treesitter `main` branch requires it).
- Git, curl, tar, unzip, make, a C compiler, ripgrep, and fd.
- `tree-sitter-cli` **0.26.1+ installed by your OS package manager** (not npm).
- A Nerd Font (the config sets `vim.g.have_nerd_font = true`).
- Node.js for the web language servers and formatters.
- Python 3.9+ for Mason tooling and the jdtls launcher.
- JDK 21 (recommended for both jdtls and the Apex language server).
- rustup + a Rust toolchain for Rust development.
- A clipboard provider: macOS includes one; use `wl-clipboard` on Wayland or
  `xclip`/`xsel` on X11.

### macOS (Homebrew)

```bash
brew install neovim git ripgrep fd make tree-sitter node openjdk@21 rustup-init
brew install --cask font-jetbrains-mono-nerd-font
rustup-init
```

Ensure Homebrew's JDK is visible to Java-based tools:

```bash
export JAVA_HOME="$("/usr/libexec/java_home" -v 21)"
```

### Arch Linux

```bash
sudo pacman -S --noconfirm --needed \
  neovim git base-devel curl tar unzip ripgrep fd tree-sitter-cli \
  nodejs npm jdk21-openjdk rustup wl-clipboard ttf-jetbrains-mono-nerd
rustup default stable
```

For X11, replace `wl-clipboard` with `xclip`.

### Windows

Use Scoop (or install equivalent packages with winget):

```powershell
scoop install neovim git ripgrep fd make gcc nodejs-lts openjdk21 rustup
scoop bucket add nerd-fonts
scoop install JetBrainsMono-NF
```

Install `tree-sitter-cli` 0.26.1+ from your package manager or its official
release. Enable Windows Developer Mode if you intend to symlink the config.

## Install

Back up any existing config first:

```bash
mv ~/.config/nvim ~/.config/nvim.bak
```

From this repository's root:

```bash
mkdir -p ~/.config
ln -sfn "$PWD/nvim" ~/.config/nvim
nvim
```

Windows PowerShell:

```powershell
New-Item -ItemType SymbolicLink `
  -Path "$env:LOCALAPPDATA\nvim" `
  -Target "$PWD\nvim"
nvim
```

On first launch lazy.nvim clones itself and installs plugins. Mason then
installs the configured language servers, linters, and formatters. Some tools
finish asynchronously; after Mason completes, restart Neovim and run:

```vim
:checkhealth
:Lazy
:Mason
```

Commit the generated `nvim/lazy-lock.json` to keep plugin versions reproducible.

## Layout

```text
nvim/
├── init.lua
└── lua/
    ├── core/       # options, keymaps, autocommands
    ├── config/     # lazy.nvim bootstrap
    └── plugins/    # one plugin spec per concern/language
```

## Keymaps

The leader key is `<Space>` and the local leader is `\`.

| Mapping | Action |
|---|---|
| `<leader>sf` / `<leader>sg` | Find files / live grep |
| `<leader><leader>` | Find open buffers |
| `<leader>fe` | Toggle file explorer |
| `<leader>f` | Format buffer |
| `<leader>tf` | Toggle format-on-save |
| `<leader>cl` | Lint current buffer |
| `gd` / `gr` / `K` | Definition / references / hover |
| `<leader>rn` / `<leader>ca` | Rename / code action |
| `[d` / `]d` | Previous / next diagnostic |
| `]c` / `[c` | Next / previous git hunk |
| `<leader>hs` / `<leader>hr` | Stage / reset git hunk |
| `<leader>co` | Java: organize imports |
| `<leader>cR` | Rust: code action |

Press `<Space>` and wait briefly to discover the rest through which-key.

## Language notes

### Salesforce Apex and LWC

Mason installs `apex-language-server` and the config uses:

```text
~/.local/share/nvim/mason/share/apex-language-server/apex-jorje-lsp.jar
```

The exact data-root prefix varies by OS. To use a different JAR:

```bash
export APEX_LS_JAR=/absolute/path/to/apex-jorje-lsp.jar
```

The server starts only inside a project containing `sfdx-project.json`.
`*.cls` and `*.trigger` are detected as `apex`; Treesitter also installs the
`apex`, `soql`, and `sosl` parsers. LWC files use the JS/TS/HTML/CSS/Vue stack.

### Java / Spring

jdtls starts per Java buffer and stores each project's workspace under
Neovim's data directory. It requires a project marker such as `pom.xml`,
`build.gradle`, `mvnw`, `gradlew`, or `.git`. A JDK must be available through
`JAVA_HOME`/`PATH`.

### Rust

rustaceanvim owns rust-analyzer; do not also add `rust_analyzer` to
`mason-lspconfig`'s automatically enabled servers. Install a toolchain with
`rustup default stable`.

### SQL / Postgres

SQLFluff is configured with the Postgres dialect in
`lua/plugins/formatting.lua` and `lua/plugins/linting.lua`. Change both files
if a project uses a different SQL dialect.

## Maintenance and troubleshooting

- Update plugins with `:Lazy update`; update parsers with `:TSUpdate`.
- Inspect formatting with `:ConformInfo` and active clients with `:LspInfo`.
- If a Mason tool is still installing on first launch, wait for `:Mason` to
  settle and reopen the file.
- If clipboard health fails on Linux, install `wl-clipboard`, `xclip`, or
  `xsel` for your display server.
- If a Nerd Font is not installed, set `vim.g.have_nerd_font = false` in
  `init.lua` and select a normal terminal font.
