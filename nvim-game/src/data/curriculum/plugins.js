import { settingLesson } from './helpers.js';

const topic = 'plugins';
const lesson = (config) => settingLesson({ topic, sim: 'settings', ...config });

export const pluginLessons = [
  lesson({
    id: 'plugins.colorscheme',
    setting: 'colorscheme',
    value: 'kanagawa-dragon',
    label: 'Kanagawa Dragon',
    prompt: 'Which colorscheme is loaded as the default?',
    explains: 'Dragon is Kanagawa’s darker, muted late-night variant.',
    choices: [
      { value: 'kanagawa-wave', label: 'Kanagawa Wave', effect: 'Warmer default Kanagawa contrast.' },
      { value: 'kanagawa-dragon', label: 'Kanagawa Dragon', effect: 'Darker muted palette used here.' },
      { value: 'kanagawa-lotus', label: 'Kanagawa Lotus', effect: 'Light palette for bright environments.' },
      { value: 'habamax', label: 'Habamax', effect: 'Built-in fallback if the theme fails.' },
    ],
  }),
  lesson({
    id: 'plugins.which_key_delay',
    setting: 'which-key delay',
    value: 300,
    label: 'which-key delay',
    prompt: 'How long does which-key wait before showing prefix hints?',
    explains: 'The delay matches timeoutlen and avoids flashing during familiar chords.',
    choices: [
      { value: 0, label: '0 ms', effect: 'Kickstart-style immediate popup.' },
      { value: 100, label: '100 ms', effect: 'Very fast hints with some visual churn.' },
      { value: 300, label: '300 ms', effect: 'Current balanced discovery delay.' },
      { value: 1000, label: '1000 ms', effect: 'Slow hints that rarely interrupt typing.' },
    ],
  }),
  lesson({
    id: 'plugins.todo_signs',
    setting: 'todo-comments signs',
    value: true,
    label: 'TODO gutter signs',
    prompt: 'Are TODO/FIXME annotations marked in the sign column?',
    explains: 'Signs make important annotations harder to miss; false is quieter.',
    choices: [
      { value: true, label: 'Visible signs', effect: 'Adds gutter markers beside annotations.' },
      { value: false, label: 'No signs', effect: 'Keeps annotations only in text and pickers.' },
    ],
  }),
  lesson({
    id: 'plugins.treesitter_auto',
    setting: 'auto_install_missing',
    value: true,
    label: 'On-demand parser install',
    prompt: 'What happens when you open a supported filetype whose parser is missing?',
    explains: 'Treesitter installs the parser asynchronously and attaches it after completion.',
    choices: [
      { value: true, label: 'Install automatically', effect: 'New supported languages work on first open.' },
      { value: false, label: 'Curated only', effect: 'Only parsers in the explicit list are installed.' },
    ],
  }),
  lesson({
    id: 'plugins.format_save',
    setting: 'format_on_save',
    value: true,
    label: 'Format on save',
    prompt: 'Do configured filetypes format automatically before writing?',
    explains: 'Yes unless the global/buffer disable flag is set via <leader>tf.',
    choices: [
      { value: true, label: 'Automatic', effect: 'Runs Conform on BufWritePre.' },
      { value: false, label: 'Manual only', effect: 'Requires <leader>f for each format.' },
    ],
  }),
  lesson({
    id: 'plugins.sql_dialect',
    setting: 'sqlfluff dialect',
    value: 'postgres',
    label: 'Postgres SQL dialect',
    prompt: 'Which SQL dialect do formatting and linting assume?',
    explains: 'Both Conform and nvim-lint pass the Postgres dialect to SQLFluff.',
    choices: [
      { value: 'ansi', label: 'ANSI', effect: 'Avoids vendor syntax but rejects Postgres extensions.' },
      { value: 'postgres', label: 'Postgres', effect: 'Understands PostgreSQL syntax.' },
      { value: 'soql', label: 'SOQL', effect: 'Salesforce queries use a separate Treesitter/sf.nvim path.' },
    ],
  }),
  lesson({
    id: 'plugins.completion_docs',
    setting: 'completion documentation auto_show',
    value: true,
    label: 'Automatic completion docs',
    prompt: 'Do completion docs appear automatically after a short delay?',
    explains: 'blink.cmp shows docs after 300 ms; false would require an explicit key.',
    choices: [
      { value: true, label: 'Auto-show', effect: 'Documentation appears after the configured delay.' },
      { value: false, label: 'Manual', effect: 'Quieter menu; request docs only when needed.' },
    ],
  }),
  lesson({
    id: 'plugins.neo_tree',
    setting: 'file explorer owner',
    value: 'netrw',
    label: 'Active file explorer',
    prompt: 'Which file explorer currently owns <leader>fe?',
    explains: 'Neo-tree remains parked as commented configuration for later.',
    choices: [
      { value: 'netrw', label: 'netrw', effect: 'Built-in tree/sidebar is active.' },
      { value: 'neo-tree', label: 'Neo-tree', effect: 'Would require uncommenting the parked plugin spec.' },
    ],
  }),

  // lualine
  lesson({
    id: 'plugins.lualine_globalstatus',
    setting: 'lualine globalstatus',
    value: true,
    label: 'One statusline for the whole screen',
    prompt: 'Does each window get its own lualine, or is there a single global one?',
    explains:
      'globalstatus=true draws one statusline across the bottom regardless of splits, which suits the sidebar layout. The plugin default is false.',
    choices: [
      { value: true, label: 'true — global', effect: 'A single statusline spans the whole editor.' },
      { value: false, label: 'false — per window', effect: 'The plugin default, one per split.' },
    ],
  }),
  lesson({
    id: 'plugins.lualine_filename',
    setting: 'lualine filename path',
    value: 1,
    label: 'Relative filename in the statusline',
    prompt: 'How much of the file path does lualine show?',
    explains:
      'path=1 shows the path relative to the working directory. The default 0 shows only the basename, which is ambiguous when several files share a name.',
    choices: [
      { value: 1, label: '1 — relative path', effect: 'Distinguishes files with the same basename.' },
      { value: 0, label: '0 — filename only', effect: 'The plugin default.' },
      { value: 2, label: '2 — absolute path', effect: 'Would consume most of the statusline.' },
    ],
  }),
  lesson({
    id: 'plugins.lualine_sf_guard',
    setting: 'salesforce_status guard',
    value: 'package.loaded',
    label: 'Checking sf.nvim without loading it',
    prompt: 'How does the statusline component avoid loading sf.nvim on every redraw?',
    explains:
      'It inspects package.loaded.sf rather than calling require. A require would force sf.nvim to load on the first statusline refresh, defeating its lazy trigger.',
    choices: [
      {
        value: 'package.loaded',
        label: 'Reads package.loaded.sf',
        effect: 'Only reports status when sf.nvim is already loaded.',
      },
      {
        value: 'require',
        label: 'Calls require("sf") in a pcall',
        effect: 'Would eagerly load the plugin on every redraw.',
      },
      {
        value: 'filetype',
        label: 'Checks the current filetype',
        effect: 'Not how the component decides.',
      },
    ],
  }),
  lesson({
    id: 'plugins.lualine_separators',
    setting: 'component_separators',
    value: 'bar',
    label: 'Statusline separators',
    prompt: 'Which separator style does this config use between components?',
    explains:
      'A thin vertical bar replaces the default powerline arrows, so the statusline renders correctly even without powerline glyphs.',
    choices: [
      { value: 'bar', label: 'Thin vertical bars', effect: 'Renders in any font, powerline or not.' },
      { value: 'powerline', label: 'Powerline arrows', effect: 'The plugin default.' },
      { value: 'none', label: 'No separators', effect: 'Not configured here.' },
    ],
  }),

  // indent-blankline
  lesson({
    id: 'plugins.ibl_main',
    setting: 'indent-blankline main',
    value: 'ibl',
    label: 'The ibl module name',
    prompt: 'Which module name does lazy.nvim need for indent-blankline?',
    explains:
      'main="ibl" is required because the module name does not match the repository name, indent-blankline.nvim. Without it lazy.nvim would call setup on the wrong module.',
    choices: [
      { value: 'ibl', label: '"ibl"', effect: 'The actual Lua module name.' },
      { value: 'indent_blankline', label: '"indent_blankline"', effect: 'The version 2 module name.' },
      { value: 'indent-blankline', label: '"indent-blankline"', effect: 'The repository name, not the module.' },
    ],
  }),
  lesson({
    id: 'plugins.ibl_scope',
    setting: 'scope.show_start',
    value: false,
    label: 'Scope underlines',
    prompt: 'Does indent-blankline underline the first and last line of the current scope?',
    explains:
      'Both show_start and show_end are turned off, removing the underline that the plugin enables by default. The vertical scope line itself is still shown.',
    choices: [
      { value: false, label: 'false — no underline', effect: 'Only the vertical guide marks the scope.' },
      { value: true, label: 'true — underlined', effect: 'The plugin default, which adds visual noise.' },
    ],
  }),
  lesson({
    id: 'plugins.ibl_exclude',
    setting: 'exclude.filetypes',
    value: 'replace',
    label: 'How exclusions merge',
    prompt: 'Does this config exclusion list add to the plugin defaults or replace them?',
    explains:
      'lazy.nvim replaces list-like opts rather than appending, so naming help, lazy, mason, neo-tree and notify drops the built-in exemptions for TelescopePrompt and lspinfo. Worth knowing before debugging stray guides in a picker.',
    choices: [
      {
        value: 'replace',
        label: 'Replaces the default list entirely',
        effect: 'Default exemptions such as TelescopePrompt are lost.',
      },
      {
        value: 'extend',
        label: 'Extends the default list',
        effect: 'Only true for keys listed in opts_extend.',
      },
    ],
  }),

  // which-key
  lesson({
    id: 'plugins.which_key_case',
    setting: 'which-key groups',
    value: 'case',
    label: 'Uppercase S versus lowercase s',
    prompt: 'What distinguishes the <leader>S group from <leader>s?',
    explains:
      'They are separate namespaces because mappings are case-sensitive: <leader>S is Salesforce and <leader>s is Search. That is the whole reason sf.nvim uses uppercase.',
    choices: [
      {
        value: 'case',
        label: 'Case: S is Salesforce, s is Search',
        effect: 'Two independent groups that never collide.',
      },
      {
        value: 'same',
        label: 'Nothing, which-key folds them together',
        effect: 'which-key treats case as significant.',
      },
    ],
  }),
  lesson({
    id: 'plugins.which_key_f',
    setting: '<leader>f duality',
    value: 'both',
    label: 'A group that is also a mapping',
    prompt: 'What is unusual about <leader>f in this configuration?',
    explains:
      'It is registered as a which-key group and bound directly to Conform formatting. Pressing it formats immediately, while <leader>fe and <leader>fE still work as a group would suggest.',
    choices: [
      {
        value: 'both',
        label: 'It is both a group prefix and a direct mapping',
        effect: 'Formats on its own, yet still prefixes the explorer keys.',
      },
      { value: 'group', label: 'It is only a group prefix', effect: 'It also formats the buffer.' },
      { value: 'unused', label: 'It is unused', effect: 'It is one of the busiest prefixes here.' },
    ],
  }),

  // conform
  lesson({
    id: 'plugins.conform_timeout',
    setting: 'format_on_save timeout_ms',
    value: 3000,
    label: 'Format-on-save timeout',
    prompt: 'How long may a formatter run during save before it is abandoned?',
    explains:
      'Three seconds, triple the conform default of 1000ms, because google-java-format and prettierd cold starts can be slow.',
    choices: [
      { value: 3000, label: '3000', effect: 'Generous window for slow formatter startup.' },
      { value: 1000, label: '1000', effect: 'The conform default.' },
      { value: 500, label: '500', effect: 'Would abort most cold starts.' },
    ],
  }),
  lesson({
    id: 'plugins.conform_fallback',
    setting: 'lsp_format',
    value: 'fallback',
    label: 'LSP formatting fallback',
    prompt: 'What happens on save when no external formatter is configured for a filetype?',
    explains:
      'lsp_format="fallback" asks the language server to format instead. The conform default is "never", which would leave such files untouched.',
    choices: [
      {
        value: 'fallback',
        label: '"fallback" — ask the LSP',
        effect: 'The language server formats when no CLI formatter exists.',
      },
      { value: 'never', label: '"never"', effect: 'The conform default; the file stays unformatted.' },
      { value: 'prefer', label: '"prefer"', effect: 'Would favour the LSP even when a formatter exists.' },
    ],
  }),
  lesson({
    id: 'plugins.conform_python',
    setting: 'python formatters',
    value: 'both',
    label: 'Two formatters in sequence',
    prompt: 'How is python = { "ruff_fix", "ruff_format" } executed?',
    explains:
      'Both run, in order, because conform stop_after_first defaults to false. ruff_fix applies lint fixes and ruff_format then reformats the result.',
    choices: [
      { value: 'both', label: 'Both, in the listed order', effect: 'Fixes are applied, then formatting.' },
      {
        value: 'first',
        label: 'Only the first one that succeeds',
        effect: 'That would require stop_after_first = true.',
      },
    ],
  }),
  lesson({
    id: 'plugins.conform_escape',
    setting: 'disable_autoformat',
    value: 'both',
    label: 'Turning off format-on-save',
    prompt: 'Which flags can disable formatting on save?',
    explains:
      'The format_on_save function checks both vim.g.disable_autoformat and vim.b[bufnr].disable_autoformat, so you can opt out globally with <leader>tf or for a single buffer.',
    choices: [
      {
        value: 'both',
        label: 'A global vim.g flag and a per-buffer vim.b flag',
        effect: 'Opt out everywhere or in just one buffer.',
      },
      { value: 'global', label: 'Only a global flag', effect: 'A buffer-local escape hatch also exists.' },
    ],
  }),
  lesson({
    id: 'plugins.conform_sqlfluff_cwd',
    setting: 'sqlfluff cwd',
    value: 'root_file',
    label: 'Finding the SQLFluff config',
    prompt: 'How does conform decide which directory to run sqlfluff from?',
    explains:
      'root_file searches upward for .sqlfluff, pyproject.toml, setup.cfg, tox.ini or .git, so project-local rules are honoured instead of the file own directory.',
    choices: [
      {
        value: 'root_file',
        label: 'Searches upward for a project marker',
        effect: 'Project-level SQLFluff configuration is respected.',
      },
      { value: 'buffer', label: 'Uses the buffer directory', effect: 'Would miss project-level config.' },
      { value: 'cwd', label: 'Uses Neovim working directory', effect: 'Not what is configured.' },
    ],
  }),

  // LuaSnip and blink.cmp
  lesson({
    id: 'plugins.luasnip_build',
    setting: 'LuaSnip build',
    value: 'conditional',
    label: 'Conditional jsregexp build',
    prompt: 'What happens to the LuaSnip native build on Windows or without make?',
    explains:
      'The build string is nil in that case, so installation succeeds and LuaSnip simply runs without jsregexp-powered snippet transformations rather than failing outright.',
    choices: [
      {
        value: 'conditional',
        label: 'Skipped, and LuaSnip degrades gracefully',
        effect: 'Install succeeds; advanced transformations are unavailable.',
      },
      { value: 'fail', label: 'Installation fails', effect: 'The conditional exists precisely to avoid this.' },
      { value: 'always', label: 'It always builds', effect: 'It is guarded by two checks.' },
    ],
  }),
  lesson({
    id: 'plugins.luasnip_updateevents',
    setting: 'LuaSnip updateevents',
    value: 'TextChanged,TextChangedI',
    label: 'Snippet update responsiveness',
    prompt: 'When does LuaSnip refresh dynamic snippet nodes here?',
    explains:
      'On TextChanged and TextChangedI rather than the default InsertLeave, so mirrored placeholders update as you type instead of only when insert ends.',
    choices: [
      {
        value: 'TextChanged,TextChangedI',
        label: 'On every text change',
        effect: 'Mirrored nodes update live while typing.',
      },
      { value: 'InsertLeave', label: 'On InsertLeave', effect: 'The plugin default, noticeably laggier.' },
    ],
  }),
  lesson({
    id: 'plugins.blink_signature',
    setting: 'signature.enabled',
    value: true,
    label: 'Signature help while typing',
    prompt: 'Does blink.cmp show function signature help as you type arguments?',
    explains:
      'Enabled here, though the plugin default is false. It is still marked experimental upstream, which is why it must be opted into.',
    choices: [
      { value: true, label: 'true', effect: 'Parameter hints appear inside a call.' },
      { value: false, label: 'false', effect: 'The plugin default.' },
    ],
  }),
  lesson({
    id: 'plugins.blink_docs_delay',
    setting: 'auto_show_delay_ms',
    value: 300,
    label: 'Documentation popup delay',
    prompt: 'How long after selecting a completion item does its documentation appear?',
    explains:
      '300ms, faster than the 500ms default, so docs feel responsive without flickering on every arrow press.',
    choices: [
      { value: 300, label: '300', effect: 'Documentation appears quickly.' },
      { value: 500, label: '500', effect: 'The plugin default.' },
      { value: 0, label: '0', effect: 'Would flicker on every selection change.' },
    ],
  }),
  lesson({
    id: 'plugins.blink_snippets',
    setting: 'snippets.preset',
    value: 'luasnip',
    label: 'Snippet engine binding',
    prompt: 'Which snippet engine does blink.cmp delegate to?',
    explains:
      'preset="luasnip" routes expansion through LuaSnip so friendly-snippets are available. The default "default" would use blink built-in minimal engine instead.',
    choices: [
      { value: 'luasnip', label: '"luasnip"', effect: 'friendly-snippets and LuaSnip transformations work.' },
      { value: 'default', label: '"default"', effect: 'The plugin built-in engine, without friendly-snippets.' },
    ],
  }),
  lesson({
    id: 'plugins.blink_sources',
    setting: 'sources.default',
    value: 'buffer',
    label: 'Completion sources',
    prompt: 'Which source makes blink suggest words already present in the file?',
    explains:
      'The buffer source. Removing it from the list would leave only semantic LSP, path and snippet candidates, which some people prefer for precision.',
    choices: [
      { value: 'buffer', label: 'buffer', effect: 'Suggests words found in open text.' },
      { value: 'lsp', label: 'lsp', effect: 'Semantic suggestions from the language server.' },
      { value: 'path', label: 'path', effect: 'Filesystem path completion.' },
      { value: 'snippets', label: 'snippets', effect: 'LuaSnip snippet names.' },
    ],
  }),
  lesson({
    id: 'plugins.blink_treesitter_menu',
    setting: 'menu.draw.treesitter',
    value: 'lsp',
    label: 'Highlighted completion menu',
    prompt: 'Which completion source gets Treesitter-highlighted labels in the menu?',
    explains:
      'Only "lsp". Applying Treesitter highlighting to buffer or path candidates would cost more than it adds, so the list is deliberately narrow.',
    choices: [
      { value: 'lsp', label: 'lsp only', effect: 'Semantic candidates are syntax highlighted.' },
      { value: 'all', label: 'Every source', effect: 'Not configured; would be needless work.' },
      { value: 'none', label: 'None', effect: 'The plugin default is an empty list.' },
    ],
  }),

  // Treesitter and autotag
  lesson({
    id: 'plugins.treesitter_branch',
    setting: 'nvim-treesitter branch',
    value: 'main',
    label: 'The main branch API',
    prompt: 'Which nvim-treesitter branch does this config track, and why does it matter?',
    explains:
      'branch="main" uses the rewritten API: there is no setup call, no ensure_installed and no highlight.enable. Parsers install via treesitter.install and highlighting starts with vim.treesitter.start.',
    choices: [
      {
        value: 'main',
        label: '"main" — the rewritten API',
        effect: 'install() and vim.treesitter.start() replace setup().',
      },
      {
        value: 'master',
        label: '"master" — the classic API',
        effect: 'Would expect ensure_installed and highlight.enable.',
      },
    ],
  }),
  lesson({
    id: 'plugins.treesitter_folds',
    setting: 'foldlevel on attach',
    value: 99,
    label: 'Folds start open',
    prompt: 'What foldlevel does a Treesitter-attached buffer get?',
    explains:
      'foldlevel=99 means every fold starts expanded, so enabling Treesitter folding does not hide your code the moment a file opens.',
    choices: [
      { value: 99, label: '99', effect: 'All folds open; you fold deliberately with zc or zM.' },
      { value: 0, label: '0', effect: 'Would collapse everything on open.' },
      { value: 1, label: '1', effect: 'Would show only the outermost level.' },
    ],
  }),
  lesson({
    id: 'plugins.treesitter_indent_guard',
    setting: 'indentexpr guard',
    value: 'query',
    label: 'Indent queries are optional',
    prompt: 'Why does the config check for an indents query before setting indentexpr?',
    explains:
      'Not every grammar ships indentation queries. Without the guard, those filetypes would get a broken indentexpr instead of falling back to Vim built-in indenting.',
    choices: [
      {
        value: 'query',
        label: 'Some grammars have no indents query',
        effect: 'Those filetypes keep the built-in indent behavior.',
      },
      {
        value: 'speed',
        label: 'To keep startup fast',
        effect: 'The check is about correctness, not speed.',
      },
    ],
  }),
  lesson({
    id: 'plugins.autotag_slash',
    setting: 'enable_close_on_slash',
    value: true,
    label: 'Closing a tag by typing a slash',
    prompt: 'Does typing </ complete the closing tag automatically?',
    explains:
      'enable_close_on_slash is the one autotag option here that deviates from its default. Note the doubly nested opts = { opts = { ... } } shape this plugin requires.',
    choices: [
      { value: true, label: 'true', effect: 'Typing </ finishes the tag for you.' },
      { value: false, label: 'false', effect: 'The plugin default.' },
    ],
  }),
  lesson({
    id: 'plugins.autopairs_ts',
    setting: 'autopairs check_ts',
    value: true,
    label: 'Treesitter-aware pairing',
    prompt: 'Does autopairs consult Treesitter before inserting a closing pair?',
    explains:
      'check_ts=true, a deviation from the plugin default, stops it adding a quote inside a string or comment where you almost never want one.',
    choices: [
      { value: true, label: 'true', effect: 'Context-aware; no stray pairs inside strings.' },
      { value: false, label: 'false', effect: 'The plugin default, purely textual matching.' },
    ],
  }),
  lesson({
    id: 'plugins.autopairs_fastwrap',
    setting: 'fast_wrap key',
    value: '<M-e>',
    label: 'The fast-wrap chord',
    prompt: 'Setting fast_wrap = {} activates which Insert-mode key?',
    explains:
      'Alt-e. Passing an empty table accepts every fast_wrap default, including its mapping, so the key exists even though it appears nowhere in the config.',
    choices: [
      { value: '<M-e>', label: '<M-e>', effect: 'Wraps the next region in the pair you just typed.' },
      { value: '<C-e>', label: '<C-e>', effect: 'That is the blink.cmp dismiss key.' },
      { value: '<Tab>', label: '<Tab>', effect: 'Bound to completion navigation.' },
    ],
  }),
  lesson({
    id: 'plugins.mini_disabled',
    setting: 'mini modules skipped',
    value: 'statusline',
    label: 'mini modules left off',
    prompt: 'Which mini.nvim module is deliberately not enabled to avoid duplication?',
    explains:
      'mini.statusline, because lualine already owns that role, and mini.icons for the same reason against nvim-web-devicons. Enabling either would give you two of the same thing.',
    choices: [
      {
        value: 'statusline',
        label: 'mini.statusline — lualine owns it',
        effect: 'mini.icons is skipped for the same reason.',
      },
      { value: 'surround', label: 'mini.surround', effect: 'This one is enabled.' },
      { value: 'ai', label: 'mini.ai', effect: 'This one is enabled with custom mappings.' },
    ],
  }),
  lesson({
    id: 'plugins.mini_ai_lines',
    setting: 'mini.ai n_lines',
    value: 500,
    label: 'Text-object search range',
    prompt: 'How far does mini.ai search for a text object?',
    explains:
      'n_lines=500, ten times the default of 50, so an enclosing function or class is still found in a long Apex class.',
    choices: [
      { value: 500, label: '500', effect: 'Finds enclosing objects far from the cursor.' },
      { value: 50, label: '50', effect: 'The plugin default.' },
      { value: 20, label: '20', effect: 'That is the mini.surround default.' },
    ],
  }),
  lesson({
    id: 'plugins.guess_indent',
    setting: 'guess-indent interaction',
    value: 'override',
    label: 'Detected indentation wins',
    prompt: 'What happens to expandtab and shiftwidth in a file that uses tabs?',
    explains:
      'guess-indent detects the existing style and overrides the buffer options, so a tab-indented file keeps tabs despite expandtab being set globally.',
    choices: [
      {
        value: 'override',
        label: 'guess-indent overrides them per buffer',
        effect: 'Existing files keep their own indentation style.',
      },
      {
        value: 'global',
        label: 'The global options always win',
        effect: 'guess-indent would then be pointless.',
      },
    ],
  }),
  lesson({
    id: 'plugins.kanagawa_defaults',
    setting: 'kanagawa deviations',
    value: 'three',
    label: 'Options that actually change something',
    prompt: 'Of the eleven kanagawa options set, how many differ from the plugin defaults?',
    explains:
      'Only three: dimInactive, theme and background.dark. The other eight restate defaults, which documents intent but has no runtime effect.',
    choices: [
      { value: 'three', label: 'Three', effect: 'dimInactive, theme and background.dark.' },
      { value: 'all', label: 'All eleven', effect: 'Most simply restate the default value.' },
      { value: 'none', label: 'None', effect: 'Three genuinely change behavior.' },
    ],
  }),
  lesson({
    id: 'plugins.todo_signs_choice',
    setting: 'todo-comments event',
    value: 'BufReadPost',
    label: 'When todo-comments loads',
    prompt: 'What triggers todo-comments to load?',
    explains:
      'Reading or creating a buffer, so highlighting is ready before you look at the file. A VeryLazy trigger would briefly show unhighlighted TODOs.',
    choices: [
      {
        value: 'BufReadPost',
        label: 'BufReadPost and BufNewFile',
        effect: 'Loads as soon as a real file is opened.',
      },
      { value: 'VeryLazy', label: 'VeryLazy', effect: 'Used by lualine, but not here.' },
      { value: 'InsertEnter', label: 'InsertEnter', effect: 'Used by autopairs and blink.' },
    ],
  }),
];
