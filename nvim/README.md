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
- Modern Treesitter `main` branch, Telescope, built-in netrw, gitsigns,
  lualine, which-key, todo-comments, indent guides, autopairs, and tag
  auto-closing. The complete Neo-tree spec is parked as commented code for
  later.
- Kickstart-style section banners, automatic indentation detection,
  mini.ai/mini.surround text objects, LSP progress notifications, expanded
  Git/search actions, and on-demand Treesitter parser installation.
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
- Salesforce workflows through sf.nvim: org selection, metadata
  retrieve/diff/listing, Apex tests and coverage, logs, SObject definition
  refresh, SOQL execution, ctags, and target-org status.

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
- Salesforce CLI (`sf`) for Salesforce projects.
- `fzf` for sf.nvim metadata/ctags pickers; Universal Ctags is optional but
  recommended for enhanced Apex definition fallback.
- A clipboard provider: macOS includes one; use `wl-clipboard` on Wayland or
  `xclip`/`xsel` on X11.

### macOS (Homebrew)

```bash
brew install neovim git ripgrep fd fzf universal-ctags make tree-sitter node openjdk@21 rustup-init
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
  neovim git base-devel curl tar unzip ripgrep fd fzf universal-ctags tree-sitter-cli \
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

Install the Salesforce CLI separately from
[Salesforce CLI setup](https://developer.salesforce.com/tools/salesforcecli)
and verify it before using sf.nvim:

```bash
sf --version
sf org list --all
```

## Install

### Fresh machine — one command (Bash, Zsh, or Fish)

Copy and paste this entire command into any of the three shells:

```sh
sh -c 'set -eu; repo="$HOME/.local/share/nvim-config-source"; target="$HOME/.config/nvim"; mkdir -p "$HOME/.local/share" "$HOME/.config"; if [ -d "$repo/.git" ]; then git -C "$repo" sparse-checkout set --no-cone "/nvim/**"; git -C "$repo" pull --ff-only; else git clone --filter=blob:none --no-checkout --depth 1 --branch main https://github.com/cjmaaz/CodeOSS-Configs.git "$repo"; git -C "$repo" sparse-checkout set --no-cone "/nvim/**"; git -C "$repo" checkout; fi; if [ -e "$target" ] && [ ! -L "$target" ]; then mv "$target" "$target.bak.$(date +%Y%m%d-%H%M%S)"; fi; ln -sfn "$repo/nvim" "$target"; exec nvim'
```

Git cannot clone a repository subdirectory by itself, so the command creates a
blob-filtered sparse checkout under `~/.local/share/nvim-config-source`. Only
the `nvim/` tree is checked out; the hidden `.git` data is retained so the same
command can pull future updates. It then backs up an existing non-symlink
Neovim configuration, links the sparse `nvim/` tree to `~/.config/nvim`, and
starts Neovim.

### Existing checkout

If this repository is already cloned elsewhere, run from its root:

```bash
mkdir -p "$HOME/.config"
ln -sfn "$PWD/nvim" "$HOME/.config/nvim"
nvim
```

### Windows PowerShell

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
:check sf
:Lazy
:Mason
```

Commit the generated `nvim/lazy-lock.json` to keep plugin versions reproducible.

## Layout

```text
nvim/
├── init.lua
└── lua/
    ├── core/       # options, keymaps, autocommands, netrw
    ├── config/     # lazy.nvim bootstrap
    └── plugins/    # one plugin spec per concern/language
```

## Keymaps

The leader key is `<Space>` and the local leader is `\`.

| Mapping | Action |
|---|---|
| `<leader>sf` / `<leader>sg` | Find files / live grep |
| `<leader>sc` / `<leader>s/` | Search commands / grep open files |
| `<leader>sn` | Search this Neovim configuration |
| `<leader><leader>` | Find open buffers |
| `<leader>fe` | Toggle netrw sidebar (`:Lexplore`) |
| `<leader>fE` | Open netrw in the current window (`:Explore`) |
| `<leader>f` | Format buffer |
| `<leader>tf` | Toggle format-on-save |
| `<leader>cl` | Lint current buffer |
| `gd` / `gr` / `K` | Definition / references / hover |
| `<leader>rn` / `<leader>ca` | Rename / code action |
| `[d` / `]d` | Previous / next diagnostic |
| `]c` / `[c` | Next / previous git hunk |
| `<leader>hs` / `<leader>hr` | Stage / reset git hunk |
| `<leader>hi` / `<leader>hq` | Inline hunk preview / file changes quickfix |
| `<leader>tb` / `<leader>tw` | Toggle line blame / word diff |
| `ih` | Select the current git hunk in operator/visual mode |
| `<leader>co` | Java: organize imports |
| `<leader>cR` | Rust: code action |

Press `<Space>` and wait briefly to discover the rest through which-key.

## File explorer: netrw now, Neo-tree later

Netrw is Neovim's built-in file explorer and is currently the active choice.
Its settings live in `lua/core/netrw.lua` and load before lazy.nvim:

| Setting | Value | Effect |
|---|---:|---|
| `netrw_liststyle` | `3` | Displays directories as an expandable tree. |
| `netrw_browse_split` | `4` | Opens the selected file in the previously active editing window, keeping `:Lexplore` visible. |
| `netrw_altv` | `1` | Places netrw vertical splits on the right. |
| `netrw_winsize` | `25` | Sizes netrw-created splits to 25% of the current window. |
| `netrw_keepdir` | `0` | Updates Neovim's working directory (`:pwd`) while browsing. |

Use `<leader>fe` to toggle the sidebar or `<leader>fE` to browse in the
current window.

The complete Neo-tree configuration remains block-commented in
`lua/plugins/editor.lua`, and its lockfile entries remain pinned. To enable it:

1. Remove the `--[[` and `]]` delimiters around the Neo-tree plugin spec.
2. Remove/comment the two netrw `<leader>f*` mappings in
   `lua/core/keymaps.lua`, allowing Neo-tree to own `<leader>fe`.
3. Choose the desired explorer arrangement:
   - **Both:** leave netrw enabled. The parked Neo-tree spec already sets
     `hijack_netrw_behavior = "disabled"` so `:Explore` remains netrw.
   - **Neo-tree only:** uncomment `"netrwPlugin"` in lazy.nvim's
     `disabled_plugins` list and optionally remove `require("core.netrw")`
     from `init.lua`.
4. Run `:Lazy sync` and restart Neovim.

## Salesforce workflow (sf.nvim)

[sf.nvim](https://github.com/xixiaofinland/sf.nvim) activates for Salesforce
filetypes or on the first `:SF` command. Its own default hotkeys are disabled;
all custom actions use uppercase `<leader>S` because lowercase `<leader>s`
already belongs to Telescope. Press `<leader>S` and pause to discover them
through which-key.

Org discovery is manual to keep startup fast and side-effect free. Start a
Salesforce session with `<leader>SF`, then select the target with `<leader>So`.
Set `fetch_org_list_at_nvim_start = true` in `lua/plugins/salesforce.lua` if
automatic `sf org list` on plugin startup is preferable.

| Mapping | Salesforce action |
|---|---|
| `<leader>SF` | Fetch/refresh authenticated orgs |
| `<leader>So` / `<leader>SO` | Set project/global target org |
| `<leader>Sb` / `<leader>SB` | Open target org/current metadata in browser |
| `<leader>Sr` | Retrieve the current metadata file |
| `<leader>Sd` | Diff current file against target org |
| `<leader>Sl` | Pull and open a debug log |
| `<leader>Se` / `<leader>Sx` | Toggle sf terminal / cancel running command |
| `<leader>St` / `<leader>ST` | Run test under cursor without/with coverage |
| `<leader>Sa` / `<leader>SA` | Run current test file without/with coverage |
| `<leader>SR` | Repeat the last Apex test |
| `<leader>Sv` | Toggle Apex coverage signs |
| `[v` / `]v` | Previous/next uncovered Apex line |
| Visual `<leader>Sq` | Run selected text as SOQL |
| `<leader>SM` then `<leader>Sm` | Pull metadata inventory, then choose metadata to retrieve |
| `<leader>SK` then `<leader>Sk` | Pull metadata types, then choose a whole type to retrieve |
| `<leader>Ss` | Refresh standard/custom SObject definitions and restart apex_ls |
| `<leader>Sc` | Generate Universal Ctags for Apex fallback navigation |

All plugin operations are also discoverable through `:SF <Tab>`. A direct
deploy key is intentionally not enabled because `save_and_push` immediately
deploys the current file; a commented `<leader>Sp` example is available in
`lua/plugins/salesforce.lua` if that tradeoff is desired.

fzf-lua is installed only for sf.nvim metadata and ctags selection; Telescope
remains the general file/text/LSP picker. The integrated sf terminal is used
without an extra dependency. Changing `terminal = "overseer"` provides task
history and UI after adding `overseer.nvim`.

sf.nvim stores intermediate data under `sf_cache/` in each Salesforce project.
Add this to that project's `.gitignore`:

```gitignore
sf_cache/
```

Run `:check sf` to diagnose the CLI, parser, and optional dependency setup.
The lualine status automatically shows the selected target org and current
Apex coverage after sf.nvim has loaded.

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
`apex`, `soql`, `sosl`, and `sflog` parsers. LWC files use the
JS/TS/HTML/CSS/Vue stack. `<leader>Ss` refreshes faux SObject definitions under
`.sfdx/tools/sobjects/` and restarts attached apex_ls clients.

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

## Decisions and alternatives

- **Plugin manager:** lazy.nvim remains the only manager. Kickstart's
  `vim.pack` examples are not mixed into the same dependency graph.
- **Theme:** Kanagawa Dragon remains unchanged; Kickstart's theme settings
  were intentionally ignored.
- **Local leader:** `\` keeps local mappings separate. Setting it to `<Space>`
  is easier to type but merges local/global namespaces.
- **Diagnostics:** warning/error underlines reduce visual noise; setting
  `underline = true` also marks info and hints.
- **UI ownership:** lualine and nvim-web-devicons remain active, so
  mini.statusline/mini.icons are not enabled. mini.ai and mini.surround are.
- **Pickers:** Telescope owns general search; fzf-lua is scoped to sf.nvim
  metadata/ctags flows because sf.nvim does not expose those through Telescope.
- **Formatting:** configured filetypes format on save with a toggle. Kickstart's
  opt-in-only model can be restored by returning `nil` from `format_on_save`.
- **Debugging:** the optional Kickstart Go DAP example is omitted because this
  setup is Salesforce-focused and no target debug adapter was requested.

## Maintenance and troubleshooting

- Update plugins with `:Lazy update`; update parsers with `:TSUpdate`.
- Inspect formatting with `:ConformInfo` and active clients with `:LspInfo`.
- If a Mason tool is still installing on first launch, wait for `:Mason` to
  settle and reopen the file.
- If clipboard health fails on Linux, install `wl-clipboard`, `xclip`, or
  `xsel` for your display server.
- If a Nerd Font is not installed, set `vim.g.have_nerd_font = false` in
  `init.lua` and select a normal terminal font.
