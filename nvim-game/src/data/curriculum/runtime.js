import { settingLesson } from './helpers.js';

// Startup and automation: nvim/init.lua, nvim/lua/core/autocommands.lua and
// nvim/lua/config/lazy.lua. These three files drive everything that happens
// before you press a key, and none of them had questions before.
const topic = 'runtime';
const lesson = (config) => settingLesson({ topic, sim: 'settings', ...config });

const onOff = (onEffect, offEffect) => [
  { value: true, label: 'true', effect: onEffect },
  { value: false, label: 'false', effect: offEffect },
];

export const runtimeLessons = [
  lesson({
    id: 'runtime.mapleader',
    setting: 'vim.g.mapleader',
    value: ' ',
    label: 'Leader key',
    prompt: 'Which key is the leader in this configuration?',
    explains:
      'Space is the leader, set in init.lua before lazy.nvim loads so every plugin keymap resolves against it. Setting it late is the classic cause of leader mappings silently not working.',
    choices: [
      { value: ' ', label: 'Space', effect: 'All <leader> chords start with the space bar.' },
      { value: ',', label: 'Comma', effect: 'A common alternative but not used here.' },
      { value: '\\', label: 'Backslash', effect: 'That is maplocalleader in this config.' },
    ],
  }),
  lesson({
    id: 'runtime.maplocalleader',
    setting: 'vim.g.maplocalleader',
    value: '\\',
    label: 'Local leader key',
    prompt: 'Which key is maplocalleader, kept deliberately distinct from the leader?',
    explains:
      'Backslash. Kickstart uses space for both, which is easier to type but lets filetype-local mappings collide with global ones.',
    choices: [
      { value: '\\', label: 'Backslash', effect: 'Buffer-local mappings get their own namespace.' },
      { value: ' ', label: 'Space', effect: 'Would collide with the global leader.' },
      { value: ',', label: 'Comma', effect: 'Not used in this config.' },
    ],
  }),
  lesson({
    id: 'runtime.nerd_font',
    setting: 'vim.g.have_nerd_font',
    value: true,
    label: 'Nerd Font flag',
    prompt: 'What does this config assume about the terminal font?',
    explains:
      'have_nerd_font=true unlocks glyph icons across lualine, devicons and the diagnostic signs. Set it false and each of those falls back to plain text such as E, W and I.',
    choices: onOff(
      'Glyph icons are used for signs, devicons and the statusline.',
      'Every icon degrades to an ASCII label instead.',
    ),
  }),
  lesson({
    id: 'runtime.loader',
    setting: 'vim.loader.enable()',
    value: true,
    label: 'Lua module cache',
    prompt: 'What does the first line of init.lua turn on?',
    explains:
      'vim.loader.enable() activates the bytecode cache for Lua modules, cutting startup time. It runs first so every subsequent require benefits from it.',
    choices: onOff(
      'Caches compiled Lua modules to speed up startup.',
      'Every Lua module would be recompiled on each launch.',
    ),
  }),
  lesson({
    id: 'runtime.netrw_order',
    setting: 'require order',
    value: 'netrw',
    label: 'Why core.netrw loads first',
    prompt: 'Which module does init.lua require before all the others, and why?',
    explains:
      'core.netrw comes first because netrw caches its own defaults when netrwPlugin loads during lazy.nvim startup. Setting the globals afterwards would be too late to take effect.',
    choices: [
      {
        value: 'netrw',
        label: 'core.netrw — before netrwPlugin caches defaults',
        effect: 'The netrw globals must exist before the plugin reads them.',
      },
      {
        value: 'options',
        label: 'core.options — options come first',
        effect: 'Options are loaded second, not first.',
      },
      {
        value: 'lazy',
        label: 'config.lazy — the plugin manager bootstraps first',
        effect: 'lazy.nvim is loaded last, after all core modules.',
      },
    ],
  }),
  lesson({
    id: 'runtime.yank_highlight',
    setting: 'TextYankPost timeout',
    value: 180,
    label: 'Yank highlight duration',
    prompt: 'For how many milliseconds does yanked text stay highlighted?',
    explains:
      'The TextYankPost autocommand calls on_yank with timeout=180, a brief flash that confirms the yank without lingering.',
    choices: [
      { value: 180, label: '180', effect: 'A short confirmation flash on every yank.' },
      { value: 150, label: '150', effect: 'The Neovim default for on_yank, not this config value.' },
      { value: 300, label: '300', effect: 'That is timeoutlen, unrelated to yanking.' },
      { value: 500, label: '500', effect: 'Not used here.' },
    ],
  }),
  lesson({
    id: 'runtime.checktime',
    setting: 'checktime events',
    value: 'focus',
    label: 'External change detection',
    prompt: 'Which events trigger :checktime to reload files changed outside Neovim?',
    explains:
      'FocusGained, TermClose and TermLeave. Returning to Neovim or leaving a terminal are exactly the moments a file may have changed underneath you.',
    choices: [
      {
        value: 'focus',
        label: 'FocusGained, TermClose, TermLeave',
        effect: 'Checks whenever focus returns or a terminal finishes.',
      },
      {
        value: 'write',
        label: 'BufWritePost only',
        effect: 'Would only check after you save, missing external edits.',
      },
      {
        value: 'cursor',
        label: 'CursorHold',
        effect: 'Would poll on idle, which this config does not do.',
      },
    ],
  }),
  lesson({
    id: 'runtime.cursor_restore',
    setting: 'BufReadPost cursor restore',
    value: 'mark',
    label: 'Restoring the last cursor position',
    prompt: 'How does this config return you to where you left off in a file?',
    explains:
      'A BufReadPost autocommand reads the " mark and only moves the cursor when the stored line is still within the buffer, guarding against a file that shrank since the last visit.',
    choices: [
      {
        value: 'mark',
        label: 'Reads the " mark, bounds-checked against the line count',
        effect: 'Safe restore that tolerates a file having shrunk.',
      },
      {
        value: 'shada',
        label: 'Relies on shada alone with no autocommand',
        effect: 'Neovim stores the mark, but jumping to it still needs this autocommand.',
      },
      {
        value: 'session',
        label: 'Through a session file',
        effect: 'No session management exists in this config.',
      },
    ],
  }),
  lesson({
    id: 'runtime.trim_whitespace',
    setting: 'BufWritePre trim',
    value: 'trim',
    label: 'Trailing whitespace on save',
    prompt: 'What happens to trailing whitespace when you write a code file?',
    explains:
      'A BufWritePre autocommand substitutes it away with keepjumps and keeppatterns, wrapped in winsaveview and winrestview so your scroll position and jump list survive the edit.',
    choices: [
      {
        value: 'trim',
        label: 'Removed, preserving the view and jump list',
        effect: 'Whitespace is stripped without moving the screen.',
      },
      {
        value: 'keep',
        label: 'Left alone; only the formatter touches it',
        effect: 'Conform handles formatting, but this trim runs independently.',
      },
      {
        value: 'warn',
        label: 'Highlighted as a diagnostic instead',
        effect: 'listchars shows it, but the save also strips it.',
      },
    ],
  }),
  lesson({
    id: 'runtime.trim_excludes',
    setting: 'trim exclusions',
    value: 'markdown',
    label: 'Filetypes exempt from trimming',
    prompt: 'Which filetype is deliberately exempt from trailing-whitespace trimming?',
    explains:
      'diff, gitcommit, gitrebase and markdown are all skipped. In Markdown two trailing spaces are a hard line break, and in diffs the whitespace is part of the payload.',
    choices: [
      {
        value: 'markdown',
        label: 'markdown — trailing spaces are a line break',
        effect: 'Also skipped: diff, gitcommit and gitrebase.',
      },
      { value: 'lua', label: 'lua', effect: 'Lua files are trimmed like any other code.' },
      { value: 'apex', label: 'apex', effect: 'Apex files are trimmed normally.' },
    ],
  }),
  lesson({
    id: 'runtime.trim_modifiable',
    setting: 'modifiable guard',
    value: true,
    label: 'The modifiable guard',
    prompt: 'Why does the trim autocommand check vim.bo.modifiable first?',
    explains:
      'Attempting a substitution in a read-only or scratch buffer would raise an error on write. The guard skips those buffers silently.',
    choices: onOff(
      'Skips read-only and scratch buffers instead of erroring.',
      'Would attempt to edit buffers that cannot be modified.',
    ),
  }),
  lesson({
    id: 'runtime.augroup_clear',
    setting: 'augroup clear',
    value: true,
    label: 'Clearing the autocommand group',
    prompt: 'Why is the user_config augroup created with clear = true?',
    explains:
      'Without clear, re-sourcing the config would register a second copy of every autocommand, so a single save would trim whitespace twice and stack up handlers.',
    choices: onOff(
      'Old handlers are removed so re-sourcing cannot duplicate them.',
      'Every reload would add another copy of each autocommand.',
    ),
  }),
  lesson({
    id: 'runtime.ft_apex',
    setting: 'filetype: cls',
    value: 'apex',
    label: 'Salesforce class files',
    prompt: 'Which filetype is assigned to a .cls file?',
    explains:
      'apex, alongside .apex and .trigger. This is what activates the Apex Treesitter parser, the Apex language server and the sf.nvim keymaps.',
    choices: [
      { value: 'apex', label: 'apex', effect: 'Enables the Apex parser, LSP and sf.nvim actions.' },
      { value: 'java', label: 'java', effect: 'Apex resembles Java but needs its own tooling.' },
      { value: 'cpp', label: 'cpp', effect: 'The .cls extension is also used by LaTeX classes.' },
    ],
  }),
  lesson({
    id: 'runtime.ft_soql',
    setting: 'filetype: soql',
    value: 'soql',
    label: 'SOQL over generic SQL',
    prompt: 'Is a .soql file treated as sql or as soql?',
    explains:
      'soql, so the Salesforce parser and sf.nvim query actions apply. Mapping it to sql instead would route it to SQLFluff and the Postgres dialect.',
    choices: [
      { value: 'soql', label: 'soql', effect: 'Salesforce syntax plus sf.nvim query execution.' },
      { value: 'sql', label: 'sql', effect: 'Would trigger SQLFluff linting and Postgres formatting.' },
    ],
  }),
  lesson({
    id: 'runtime.ft_page',
    setting: 'filetype: page',
    value: 'html',
    label: 'Visualforce pages',
    prompt: 'Which filetype does a .page file get?',
    explains:
      'html, because Visualforce markup is close enough to HTML for the parser, emmet server and prettierd formatter to work on it.',
    choices: [
      { value: 'html', label: 'html', effect: 'Reuses HTML tooling for Visualforce markup.' },
      { value: 'apex', label: 'apex', effect: 'Apex is the class language, not the markup.' },
      { value: 'xml', label: 'xml', effect: 'Not used for .page in this config.' },
    ],
  }),
  lesson({
    id: 'runtime.ft_mdc',
    setting: 'filetype: mdc',
    value: 'markdown',
    label: 'Cursor rule files',
    prompt: 'Which filetype is a .mdc Cursor rule file given?',
    explains:
      'markdown, since .mdc files are Markdown with YAML frontmatter. Without this they would open with no highlighting at all.',
    choices: [
      { value: 'markdown', label: 'markdown', effect: 'Full Markdown highlighting and formatting.' },
      { value: 'yaml', label: 'yaml', effect: 'Only the frontmatter is YAML.' },
      { value: 'text', label: 'text', effect: 'Would lose all highlighting.' },
    ],
  }),
  lesson({
    id: 'runtime.lazy_defaults',
    setting: 'defaults.lazy',
    value: true,
    label: 'Lazy loading by default',
    prompt: 'Are plugins lazy-loaded by default in this setup?',
    explains:
      'defaults.lazy=true means every spec is lazy unless it opts out. The colorscheme, treesitter and rustaceanvim set lazy=false because they must load eagerly.',
    choices: onOff(
      'Plugins load on demand unless a spec sets lazy = false.',
      'Every plugin would load during startup.',
    ),
  }),
  lesson({
    id: 'runtime.lazy_version',
    setting: 'defaults.version',
    value: false,
    label: 'Version pinning policy',
    prompt: 'Does lazy.nvim track semver tags or latest commits here?',
    explains:
      'defaults.version=false follows the latest commit on the default branch. Reproducibility comes from lazy-lock.json instead of from version ranges.',
    choices: [
      { value: false, label: 'false — latest commit', effect: 'Newest commit, pinned by the lockfile.' },
      { value: '*', label: '"*" — latest stable tag', effect: 'Would prefer semver releases where published.' },
    ],
  }),
  lesson({
    id: 'runtime.lazy_checker',
    setting: 'checker.frequency',
    value: 86400,
    label: 'Update check frequency',
    prompt: 'How often does lazy.nvim check for plugin updates?',
    explains:
      'Every 86400 seconds, once a day, and with notify=false so the check happens silently rather than interrupting you.',
    choices: [
      { value: 86400, label: '86400 — daily', effect: 'One silent update check per day.' },
      { value: 3600, label: '3600 — hourly', effect: 'Would check far more aggressively.' },
      { value: 604800, label: '604800 — weekly', effect: 'Not the configured interval.' },
    ],
  }),
  lesson({
    id: 'runtime.lazy_notify',
    setting: 'change_detection.notify',
    value: false,
    label: 'Silent change detection',
    prompt: 'Does lazy.nvim announce it when you edit your own config files?',
    explains:
      'change_detection stays enabled so edits are picked up, but notify=false suppresses the popup that would otherwise appear every time you save a plugin spec.',
    choices: [
      { value: false, label: 'false — silent', effect: 'Changes are detected without a notification.' },
      { value: true, label: 'true — notify', effect: 'Would show a message on every config save.' },
    ],
  }),
  lesson({
    id: 'runtime.lazy_disabled',
    setting: 'disabled_plugins',
    value: 'gzip',
    label: 'Disabled runtime plugins',
    prompt: 'Which built-in runtime plugin is disabled to speed up startup?',
    explains:
      'gzip, along with tarPlugin, tohtml, tutor and zipPlugin. Notably netrwPlugin is not in the list, because netrw is still the active file explorer.',
    choices: [
      { value: 'gzip', label: 'gzip', effect: 'Also disabled: tarPlugin, tohtml, tutor, zipPlugin.' },
      {
        value: 'netrwPlugin',
        label: 'netrwPlugin',
        effect: 'Deliberately left enabled; netrw is the current explorer.',
      },
      { value: 'matchit', label: 'matchit', effect: 'Not disabled in this config.' },
    ],
  }),
  lesson({
    id: 'runtime.lazy_bootstrap',
    setting: 'bootstrap clone',
    value: 'blob:none',
    label: 'Bootstrap clone flags',
    prompt: 'Which git flag keeps the lazy.nvim bootstrap clone small?',
    explains:
      'A blobless clone with --filter=blob:none fetches history without file contents, paired with --branch=stable to land on a release rather than main.',
    choices: [
      {
        value: 'blob:none',
        label: '--filter=blob:none',
        effect: 'Downloads metadata without every historical file blob.',
      },
      { value: 'depth', label: '--depth=1', effect: 'A shallow clone, not what this config uses.' },
      { value: 'bare', label: '--bare', effect: 'Would produce a repository with no working tree.' },
    ],
  }),
  lesson({
    id: 'runtime.lazy_colorscheme',
    setting: 'install.colorscheme',
    value: 'kanagawa-dragon',
    label: 'Install-time colorscheme',
    prompt: 'Which colorscheme does lazy.nvim try first while installing plugins?',
    explains:
      'kanagawa-dragon, with habamax as the fallback. The fallback matters on a first run, when Kanagawa is still being cloned and cannot be applied yet.',
    choices: [
      {
        value: 'kanagawa-dragon',
        label: 'kanagawa-dragon, then habamax',
        effect: 'Falls back to the built-in habamax before Kanagawa exists.',
      },
      { value: 'habamax', label: 'habamax only', effect: 'habamax is the fallback, not the first choice.' },
      { value: 'default', label: 'The built-in default', effect: 'Not configured here.' },
    ],
  }),
  lesson({
    id: 'runtime.lazy_spec',
    setting: 'spec import',
    value: 'plugins',
    label: 'How plugin specs are discovered',
    prompt: 'How does lazy.nvim find the plugin specifications?',
    explains:
      'A single { import = "plugins" } entry loads every file in lua/plugins automatically, so adding a new file is enough to register a plugin.',
    choices: [
      {
        value: 'plugins',
        label: 'One import of the whole lua/plugins directory',
        effect: 'New files are picked up with no further wiring.',
      },
      {
        value: 'inline',
        label: 'Each plugin listed inline in lazy.lua',
        effect: 'This config keeps lazy.lua free of individual specs.',
      },
      {
        value: 'require',
        label: 'Explicit require calls per file',
        effect: 'Would need editing lazy.lua for every new plugin.',
      },
    ],
  }),
];
