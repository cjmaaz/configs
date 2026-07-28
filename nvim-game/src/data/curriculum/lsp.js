import { keyLesson, settingLesson } from './helpers.js';

const topic = 'lsp';
const lesson = (config) => keyLesson({ topic, sim: 'lsp-hover', ...config });
const setting = (config) => settingLesson({ topic, sim: 'settings', ...config });

export const lspLessons = [
  lesson({
    id: 'lsp.hover',
    keys: 'K',
    label: 'Hover documentation',
    prompt: 'Show type and documentation for the symbol under the cursor.',
    explains: 'Calls vim.lsp.buf.hover in an attached LSP buffer.',
    siblings: ['gd', 'gr', '<leader>ca'],
  }),
  lesson({
    id: 'lsp.declaration',
    keys: 'gD',
    label: 'Go to declaration',
    prompt: 'Jump to the symbol declaration (for example, a C header).',
    explains: 'Declaration is not always the same location as the implementation.',
    siblings: ['gd', 'gI', '<leader>D'],
  }),
  lesson({
    id: 'lsp.definition',
    keys: 'gd',
    label: 'Go to definition',
    prompt: 'Jump to where the current symbol is defined.',
    explains: 'Uses the LSP definition request; use <C-o> to jump back.',
    siblings: ['gD', 'gI', 'gr'],
  }),
  lesson({
    id: 'lsp.implementation',
    keys: 'gI',
    label: 'Go to implementation',
    prompt: 'Jump from an interface or abstract symbol to its implementation.',
    explains: 'Uses textDocument/implementation where the server supports it.',
    siblings: ['gd', 'gD', '<leader>D'],
  }),
  lesson({
    id: 'lsp.type_definition',
    keys: '<leader>D',
    label: 'Type definition',
    prompt: 'Jump to the definition of the symbol’s type.',
    explains: 'Useful when a variable definition and its class/type live in different places.',
    siblings: ['gd', 'gD', 'gI'],
  }),
  lesson({
    id: 'lsp.rename',
    keys: '<leader>rn',
    label: 'Rename symbol',
    prompt: 'Rename the symbol under the cursor across the workspace.',
    explains: 'The LSP computes safe edits in every referencing file.',
    siblings: ['<leader>ca', 'gr'],
  }),
  lesson({
    id: 'lsp.code_action',
    keys: '<leader>ca',
    label: 'Code action',
    prompt: 'Show refactors or quick fixes for the cursor/selection.',
    explains: 'Available in Normal and Visual modes; actions depend on the server.',
    siblings: ['<leader>rn', 'K'],
  }),
  lesson({
    id: 'lsp.references',
    keys: 'gr',
    label: 'Find references',
    prompt: 'List every reference to the current symbol in Telescope.',
    explains: 'Uses telescope.builtin.lsp_references rather than a raw quickfix list.',
    siblings: ['gd', '<leader>ds', '<leader>ws'],
    sim: 'telescope-picker',
  }),
  lesson({
    id: 'lsp.document_symbols',
    keys: '<leader>ds',
    label: 'Document symbols',
    prompt: 'Fuzzy-find classes, methods, and variables in this file.',
    explains: 'Uses Telescope’s LSP document-symbol picker.',
    siblings: ['<leader>ws', '<leader>sd'],
    sim: 'telescope-picker',
  }),
  lesson({
    id: 'lsp.workspace_symbols',
    keys: '<leader>ws',
    label: 'Workspace symbols',
    prompt: 'Search symbols across the entire language-server workspace.',
    explains: 'Uses the dynamic workspace-symbol request and Telescope.',
    siblings: ['<leader>ds', '<leader>wl'],
    sim: 'telescope-picker',
  }),
  lesson({
    id: 'lsp.workspace_add',
    keys: '<leader>wa',
    label: 'Add workspace folder',
    prompt: 'Add another folder to the active LSP workspace.',
    explains: 'Useful for multi-root projects when the server supports workspace folders.',
    siblings: ['<leader>wr', '<leader>wl'],
  }),
  lesson({
    id: 'lsp.workspace_remove',
    keys: '<leader>wr',
    label: 'Remove workspace folder',
    prompt: 'Remove a folder from the active LSP workspace.',
    explains: 'Changes the server workspace without deleting files.',
    siblings: ['<leader>wa', '<leader>wl'],
  }),
  lesson({
    id: 'lsp.workspace_list',
    keys: '<leader>wl',
    label: 'List workspace folders',
    prompt: 'Print all folders known to the current LSP client.',
    explains: 'Inspects vim.lsp.buf.list_workspace_folders.',
    siblings: ['<leader>wa', '<leader>wr'],
  }),
  lesson({
    id: 'lsp.inlay_hints',
    keys: '<leader>th',
    label: 'Toggle inlay hints',
    prompt: 'Show or hide inferred types/parameter names inside the code.',
    explains: 'The buffer-local map exists only when the attached server supports inlay hints.',
    siblings: ['<leader>tb', '<leader>tw'],
  }),
  settingLesson({
    id: 'lsp.underline_severity',
    topic,
    setting: 'diagnostic underline severity',
    value: 'warn',
    label: 'Diagnostic underline threshold',
    prompt: 'Which diagnostic severities receive underlines?',
    explains: 'Virtual text still shows other diagnostics; limiting underline reduces visual noise.',
    choices: [
      { value: 'all', label: 'All severities', effect: 'Hints and info are underlined too.' },
      { value: 'warn', label: 'Warning and error', effect: 'Only actionable diagnostics are underlined.' },
      { value: 'error', label: 'Errors only', effect: 'Warnings lose underline emphasis.' },
      { value: 'none', label: 'None', effect: 'No diagnostic uses an underline.' },
    ],
    sim: 'lsp-hover',
  }),

  // Diagnostic presentation, LSP lifecycle, the server settings table, the Apex
  // bootstrap and the Mason split. None of this had questions before.
  setting({
    id: 'lsp.severity_sort',
    setting: 'severity_sort',
    value: true,
    label: 'Worst diagnostic first',
    prompt: 'When several diagnostics share a line, which one is shown first?',
    explains:
      'severity_sort=true puts errors ahead of warnings and hints. The Neovim default is false, which orders them by the source language server instead.',
    choices: [
      { value: true, label: 'true — by severity', effect: 'Errors take precedence in signs and virtual text.' },
      { value: false, label: 'false — source order', effect: 'The Neovim default.' },
    ],
  }),
  setting({
    id: 'lsp.virtual_text',
    setting: 'virtual_text.source',
    value: 'if_many',
    label: 'Naming the diagnostic source',
    prompt: 'When does inline diagnostic text name which tool produced it?',
    explains:
      '"if_many" adds the source only when more than one is attached, which matters here because eslint and vtsls can both report on the same TypeScript file.',
    choices: [
      {
        value: 'if_many',
        label: '"if_many"',
        effect: 'Source shown only when several servers report.',
      },
      { value: true, label: 'always', effect: 'Would repeat the source on every message.' },
      { value: false, label: 'never', effect: 'Would leave ambiguous messages unattributed.' },
    ],
  }),
  setting({
    id: 'lsp.virtual_text_default',
    setting: 'virtual_text default',
    value: false,
    label: 'Inline diagnostics are opt-in',
    prompt: 'Does current Neovim show inline diagnostic text without configuration?',
    explains:
      'No: virtual_text defaults to false in Neovim 0.11 and later, so this config enabling it with spacing=2 is a real addition rather than a tweak.',
    choices: [
      { value: false, label: 'false — off by default', effect: 'Enabling it here is a deliberate choice.' },
      { value: true, label: 'true — on by default', effect: 'That was true of older Neovim releases.' },
    ],
  }),
  setting({
    id: 'lsp.float_border',
    setting: 'float.border',
    value: 'rounded',
    label: 'Diagnostic float border',
    prompt: 'Which border style do diagnostic floats use?',
    explains:
      'rounded, against a Neovim default of no border at all. This is what <leader>e and the [d / ]d jumps render with.',
    choices: [
      { value: 'rounded', label: '"rounded"', effect: 'A soft bordered popup.' },
      { value: '', label: '"" — none', effect: 'The Neovim default.' },
      { value: 'single', label: '"single"', effect: 'Square border, not used here.' },
    ],
  }),
  setting({
    id: 'lsp.signs_nerd',
    setting: 'diagnostic signs',
    value: 'conditional',
    label: 'Two complete sign tables',
    prompt: 'How are the diagnostic gutter signs chosen?',
    explains:
      'A ternary on vim.g.have_nerd_font builds either a glyph table or an ASCII one using E, W, I and H, so the gutter stays legible on a plain font.',
    choices: [
      {
        value: 'conditional',
        label: 'Glyphs or ASCII, chosen by have_nerd_font',
        effect: 'Falls back to E, W, I and H without a Nerd Font.',
      },
      { value: 'glyph', label: 'Always Nerd Font glyphs', effect: 'Would render as tofu on a plain font.' },
      { value: 'numbers', label: 'Neovim numeric defaults', effect: 'Both tables are custom here.' },
    ],
  }),
  setting({
    id: 'lsp.update_in_insert',
    setting: 'update_in_insert',
    value: false,
    label: 'Diagnostics while typing',
    prompt: 'Are diagnostics refreshed mid-insert?',
    explains:
      'Left at false, matching the Neovim default, so errors do not flicker while a line is half written. They refresh once you leave Insert mode.',
    choices: [
      { value: false, label: 'false', effect: 'Diagnostics settle after you stop inserting.' },
      { value: true, label: 'true', effect: 'Would update on every keystroke.' },
    ],
  }),
  setting({
    id: 'lsp.capabilities',
    setting: 'capabilities source',
    value: 'blink',
    label: 'Where capabilities come from',
    prompt: 'Which plugin supplies the LSP client capabilities?',
    explains:
      'blink.cmp, via get_lsp_capabilities(), applied to every server through vim.lsp.config("*"). This advertises the completion features blink can actually consume.',
    choices: [
      {
        value: 'blink',
        label: 'blink.cmp, applied to "*"',
        effect: 'One wildcard config covers every server.',
      },
      { value: 'default', label: 'Neovim defaults', effect: 'Would understate completion support.' },
      { value: 'lspconfig', label: 'nvim-lspconfig', effect: 'Not how this config wires it.' },
    ],
  }),
  setting({
    id: 'lsp.document_highlight',
    setting: 'document highlight',
    value: 'CursorHold',
    label: 'Highlighting other uses of a symbol',
    prompt: 'What triggers the highlight of matching references under the cursor?',
    explains:
      'CursorHold and CursorHoldI, which is why updatetime=250 matters: at the 4000ms default this would feel broken. It is also gated on the server supporting documentHighlight.',
    choices: [
      {
        value: 'CursorHold',
        label: 'CursorHold, after updatetime elapses',
        effect: 'Depends directly on updatetime being lowered.',
      },
      { value: 'CursorMoved', label: 'CursorMoved', effect: 'That event clears the highlight instead.' },
      { value: 'manual', label: 'Only on demand', effect: 'It is automatic here.' },
    ],
  }),
  setting({
    id: 'lsp.detach_cleanup',
    setting: 'LspDetach',
    value: 'clear',
    label: 'Cleaning up on detach',
    prompt: 'What does the LspDetach autocommand do?',
    explains:
      'It clears reference highlights and deletes the per-buffer augroup, so a detached server leaves no stale highlights or orphaned autocommands behind.',
    choices: [
      {
        value: 'clear',
        label: 'Clears references and removes the buffer augroup',
        effect: 'No stale highlights survive a detach.',
      },
      { value: 'restart', label: 'Restarts the server', effect: 'Detach does not reattach anything.' },
      { value: 'nothing', label: 'Nothing', effect: 'Cleanup is explicit here.' },
    ],
  }),
  setting({
    id: 'lsp.lua_globals',
    setting: 'Lua.diagnostics.globals',
    value: 'vim',
    label: 'Teaching lua_ls about vim',
    prompt: 'Which global is declared to stop lua_ls flagging it as undefined?',
    explains:
      'vim. Without it every line of this configuration would be an undefined-global warning. lazydev.nvim then supplies the actual type information.',
    choices: [
      { value: 'vim', label: 'vim', effect: 'Silences undefined-global across the whole config.' },
      { value: 'nvim', label: 'nvim', effect: 'Not the name of the global.' },
      { value: 'require', label: 'require', effect: 'Already a known Lua global.' },
    ],
  }),
  setting({
    id: 'lsp.lua_third_party',
    setting: 'checkThirdParty',
    value: false,
    label: 'Suppressing the third-party prompt',
    prompt: 'Why is Lua.workspace.checkThirdParty set to false?',
    explains:
      'It stops lua_ls asking whether to configure itself for detected libraries every time you open a plugin directory. lazydev handles library types instead.',
    choices: [
      {
        value: false,
        label: 'false — no prompts',
        effect: 'Avoids a recurring dialog in plugin directories.',
      },
      { value: true, label: 'true', effect: 'The server default, which prompts repeatedly.' },
    ],
  }),
  setting({
    id: 'lsp.lazydev_words',
    setting: 'lazydev library words',
    value: 'vim%.uv',
    label: 'Loading luv types on demand',
    prompt: 'What makes lazydev load the luv type library?',
    explains:
      'A words pattern matching vim%.uv, so the library is only pulled in for files that actually reference it rather than for every Lua buffer.',
    choices: [
      {
        value: 'vim%.uv',
        label: 'A file mentioning vim.uv',
        effect: 'Types load only where they are needed.',
      },
      { value: 'always', label: 'Every Lua file', effect: 'Would load types unnecessarily.' },
      { value: 'never', label: 'Never automatically', effect: 'The words trigger exists precisely to automate it.' },
    ],
  }),
  setting({
    id: 'lsp.vtsls_imports',
    setting: 'importModuleSpecifier',
    value: 'non-relative',
    label: 'Auto-import style',
    prompt: 'Which import path style does vtsls generate?',
    explains:
      '"non-relative", so it prefers a configured path alias over a chain of ../. The same value is set for both TypeScript and JavaScript.',
    choices: [
      {
        value: 'non-relative',
        label: '"non-relative"',
        effect: 'Prefers path aliases over ../../ chains.',
      },
      { value: 'relative', label: '"relative"', effect: 'Would always produce relative paths.' },
      { value: 'shortest', label: '"shortest"', effect: 'The server default heuristic.' },
    ],
  }),
  setting({
    id: 'lsp.vue_hybrid',
    setting: 'vue hybridMode',
    value: true,
    label: 'The hybrid Vue setup',
    prompt: 'How do vue_ls and vtsls divide work on a .vue file?',
    explains:
      'hybridMode=true lets vue_ls handle the template while vtsls handles the script, wired together by registering @vue/typescript-plugin as a tsserver global plugin.',
    choices: [
      {
        value: true,
        label: 'Split: vue_ls templates, vtsls script',
        effect: 'Requires the tsserver global plugin to bridge them.',
      },
      { value: false, label: 'vue_ls handles everything', effect: 'The non-hybrid arrangement.' },
    ],
  }),
  setting({
    id: 'lsp.yaml_schemastore',
    setting: 'yaml schemaStore',
    value: false,
    label: 'Replacing the YAML schema store',
    prompt: 'Why is yaml.schemaStore.enable set to false?',
    explains:
      'Because SchemaStore.nvim supplies the catalogue instead. Leaving the built-in store on as well would fetch schemas twice and can produce conflicting validation.',
    choices: [
      {
        value: false,
        label: 'false — SchemaStore.nvim provides them',
        effect: 'The url is also blanked to stop remote fetches.',
      },
      { value: true, label: 'true', effect: 'Would duplicate the schema source.' },
    ],
  }),
  setting({
    id: 'lsp.clangd_flags',
    setting: 'clangd cmd',
    value: 'iwyu',
    label: 'Clangd header insertion',
    prompt: 'Which header-insertion policy does the clangd command line request?',
    explains:
      '--header-insertion=iwyu, include-what-you-use, alongside --background-index and --clang-tidy. Only servers needing argv overrides define cmd at all.',
    choices: [
      { value: 'iwyu', label: 'iwyu', effect: 'Inserts only headers that are actually used.' },
      { value: 'never', label: 'never', effect: 'Would disable automatic header insertion.' },
      { value: 'default', label: 'The clangd default', effect: 'This config overrides it explicitly.' },
    ],
  }),
  setting({
    id: 'lsp.python_typecheck',
    setting: 'typeCheckingMode',
    value: 'standard',
    label: 'basedpyright strictness',
    prompt: 'Which type-checking mode is basedpyright set to?',
    explains:
      '"standard", a middle ground: "off" gives no type errors and "strict" or "all" flags far more than most projects want. diagnosticMode also limits it to open files.',
    choices: [
      { value: 'standard', label: '"standard"', effect: 'Balanced type checking.' },
      { value: 'strict', label: '"strict"', effect: 'Considerably noisier on untyped code.' },
      { value: 'off', label: '"off"', effect: 'Would report no type errors at all.' },
    ],
  }),
  setting({
    id: 'lsp.python_diagnostic_mode',
    setting: 'diagnosticMode',
    value: 'openFilesOnly',
    label: 'Scope of Python diagnostics',
    prompt: 'Does basedpyright analyse the whole workspace or only open files?',
    explains:
      '"openFilesOnly" keeps a large repository responsive. The alternative, "workspace", surfaces errors in files you have not opened at the cost of a heavy initial scan.',
    choices: [
      { value: 'openFilesOnly', label: '"openFilesOnly"', effect: 'Fast, limited to buffers you have open.' },
      { value: 'workspace', label: '"workspace"', effect: 'Whole-project analysis, much slower to start.' },
    ],
  }),
  setting({
    id: 'lsp.apex_jar',
    setting: 'APEX_LS_JAR',
    value: 'env',
    label: 'Locating the Apex language server',
    prompt: 'How is the Apex language server JAR found?',
    explains:
      '$APEX_LS_JAR takes precedence, otherwise it falls back to the Mason share directory. The path is checked with vim.uv.fs_stat before the server is registered.',
    choices: [
      {
        value: 'env',
        label: '$APEX_LS_JAR first, then the Mason path',
        effect: 'An environment override wins over the managed install.',
      },
      { value: 'mason', label: 'Mason only', effect: 'The env var is checked first.' },
      { value: 'bundled', label: 'Bundled with the config', effect: 'No JAR ships in the repository.' },
    ],
  }),
  setting({
    id: 'lsp.apex_missing',
    setting: 'missing JAR behavior',
    value: 'notify',
    label: 'When the Apex JAR is absent',
    prompt: 'What happens when the Apex JAR cannot be found?',
    explains:
      'A single notify_once warning naming :MasonInstall apex-language-server or the env var. Apex files still open normally; only the language server is skipped.',
    choices: [
      {
        value: 'notify',
        label: 'One warning, and Apex files still open',
        effect: 'Graceful degradation with an actionable message.',
      },
      { value: 'error', label: 'Startup fails', effect: 'The fs_stat guard prevents that.' },
      { value: 'silent', label: 'Silent failure', effect: 'notify_once makes the cause visible.' },
    ],
  }),
  setting({
    id: 'lsp.apex_semantic',
    setting: 'apex_enable_semantic_errors',
    value: true,
    label: 'Apex semantic errors',
    prompt: 'Are semantic errors enabled for the Apex language server?',
    explains:
      'Yes, while completion statistics are disabled. Semantic analysis catches real type problems; the statistics only add telemetry noise.',
    choices: [
      { value: true, label: 'true', effect: 'Type-level Apex errors are reported.' },
      { value: false, label: 'false', effect: 'Would reduce Apex diagnostics to syntax only.' },
    ],
  }),
  setting({
    id: 'lsp.apex_filetype',
    setting: 'apex_ls trigger',
    value: 'FileType',
    label: 'Starting the Apex server',
    prompt: 'What starts the Apex language server?',
    explains:
      'A FileType autocommand on apex and apexcode, so the JVM-based server only starts once you actually open Salesforce code rather than at launch.',
    choices: [
      {
        value: 'FileType',
        label: 'A FileType autocommand for apex and apexcode',
        effect: 'The JVM starts only when needed.',
      },
      { value: 'VimEnter', label: 'On startup', effect: 'Would slow every launch.' },
      { value: 'manual', label: 'Manually with a command', effect: 'It is automatic per filetype.' },
    ],
  }),
  setting({
    id: 'lsp.server_names',
    setting: 'ensure_installed source',
    value: 'tbl_keys',
    label: 'One source of truth for servers',
    prompt: 'How is the mason-lspconfig ensure_installed list built?',
    explains:
      'From vim.tbl_keys of the servers table, sorted. Adding a server to that one table installs it and enables it, with no second list to keep in sync.',
    choices: [
      {
        value: 'tbl_keys',
        label: 'Derived from the servers table',
        effect: 'Adding a server in one place is enough.',
      },
      { value: 'literal', label: 'A hand-written list', effect: 'Would drift out of sync.' },
      { value: 'auto', label: 'Mason detects them', effect: 'Mason installs only what it is told to.' },
    ],
  }),
  setting({
    id: 'lsp.mason_tools',
    setting: 'mason-tool-installer',
    value: 'formatters',
    label: 'Two Mason lists, two purposes',
    prompt: 'What belongs in mason-tool-installer rather than mason-lspconfig?',
    explains:
      'Formatters and linters, things with no LSP interface, such as stylua, prettierd, eslint_d and sqlfluff. Servers live in mason-lspconfig. jdtls and rust-analyzer appear here because their plugins own the server side.',
    choices: [
      {
        value: 'formatters',
        label: 'Formatters and linters',
        effect: 'Tools without a language-server protocol.',
      },
      { value: 'servers', label: 'Language servers', effect: 'Those come from the servers table.' },
      { value: 'both', label: 'Everything', effect: 'The two lists are deliberately separate.' },
    ],
  }),
  setting({
    id: 'lsp.tool_delay',
    setting: 'start_delay',
    value: 3000,
    label: 'Delaying tool installation',
    prompt: 'How long does mason-tool-installer wait before checking tools on startup?',
    explains:
      'Three seconds, against a default of 0, so opening a file is not competing with installation work. debounce_hours=24 then limits it to one check a day.',
    choices: [
      { value: 3000, label: '3000', effect: 'Editing stays responsive at launch.' },
      { value: 0, label: '0', effect: 'The plugin default, which runs immediately.' },
      { value: 24, label: '24', effect: 'That is debounce_hours, not the delay.' },
    ],
  }),
  setting({
    id: 'lsp.rust_analyzer_owner',
    setting: 'rust-analyzer owner',
    value: 'rustaceanvim',
    label: 'Who configures rust-analyzer',
    prompt: 'Why is rust_analyzer missing from the servers table despite being installed by Mason?',
    explains:
      'rustaceanvim owns it. Configuring it through vim.lsp.config as well would start two clients against the same project. The same split applies to jdtls and nvim-jdtls.',
    choices: [
      {
        value: 'rustaceanvim',
        label: 'rustaceanvim configures it',
        effect: 'Adding it to the servers table would duplicate the client.',
      },
      { value: 'mason', label: 'Mason configures it', effect: 'Mason installs but does not configure.' },
      { value: 'notused', label: 'It is unused', effect: 'It is installed and active via rustaceanvim.' },
    ],
  }),
  setting({
    id: 'lsp.desc_prefix',
    setting: 'keymap desc prefix',
    value: 'LSP: ',
    label: 'Discoverable LSP mappings',
    prompt: 'What is prepended to every LSP keymap description?',
    explains:
      '"LSP: ", so searching keymaps with <leader>sk groups them all together. A small convention that makes the mappings findable.',
    choices: [
      { value: 'LSP: ', label: '"LSP: "', effect: 'All LSP mappings sort together in the keymap picker.' },
      { value: '', label: 'Nothing', effect: 'They would scatter through the list.' },
      { value: 'lsp.', label: '"lsp."', effect: 'Not the convention used.' },
    ],
  }),
];
