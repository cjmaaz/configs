import { keyLesson, settingLesson } from './helpers.js';

const topic = 'telescope';
const lesson = (config) => keyLesson({ topic, sim: 'telescope-picker', ...config });

const searchSiblings = [
  '<leader>sh',
  '<leader>sk',
  '<leader>sf',
  '<leader>ss',
  '<leader>sw',
  '<leader>sg',
  '<leader>sd',
  '<leader>sr',
  '<leader>sc',
  '<leader>s.',
  '<leader>s/',
  '<leader>sn',
];

const make = (id, keys, label, prompt, explains, mode = 'NORMAL') =>
  lesson({
    id: `telescope.${id}`,
    keys,
    mode,
    label,
    prompt,
    explains,
    siblings: searchSiblings.filter((item) => item !== keys).slice(0, 4),
  });

export const telescopeLessons = [
  make('help', '<leader>sh', 'Search help', 'Find a Neovim help topic through Telescope.', 'Opens help_tags with a preview of the selected documentation.'),
  make('keymaps', '<leader>sk', 'Search keymaps', 'Find a keymap by its description.', 'Lists active keymaps, modes, and descriptions.'),
  make('files', '<leader>sf', 'Search files', 'Show all project files through Telescope.', 'Fuzzy-matches filenames from the working directory.'),
  make('builtins', '<leader>ss', 'Select Telescope picker', 'Browse every available Telescope picker.', 'Opens telescope.builtin so you can discover capabilities.'),
  make('grep_word', '<leader>sw', 'Search word or selection', 'Search the project for the word under the cursor.', 'Normal mode searches the current word; Visual mode searches selected text.'),
  make('grep_selection', '<leader>sw', 'Search visual selection', 'Search the project for the currently selected text.', 'The same mapping is intentionally available in Normal and Visual modes.', 'VISUAL'),
  make('live_grep', '<leader>sg', 'Live grep', 'Search project contents interactively.', 'Runs ripgrep as the query changes.'),
  make('diagnostics', '<leader>sd', 'Search diagnostics', 'List all diagnostics in a Telescope picker.', 'Shows severity, message, file, and line for diagnostics.'),
  make('resume', '<leader>sr', 'Resume picker', 'Reopen the last Telescope search with its previous query.', 'Resumes the most recent picker state.'),
  make('commands', '<leader>sc', 'Search commands', 'Find and execute a Neovim command.', 'Lists Ex commands with descriptions where available.'),
  make('recent', '<leader>s.', 'Search recent files', 'Find a recently opened file.', 'Opens oldfiles; the dot mirrors Vim’s repeat/recent convention.'),
  make('open_files', '<leader>s/', 'Grep open files', 'Search only the files currently open in buffers.', 'Runs live_grep with grep_open_files enabled.'),
  make('nvim_config', '<leader>sn', 'Search Neovim config', 'Search files inside this Neovim configuration.', 'Runs find_files rooted at stdpath(config), following symlinks.'),
  lesson({
    id: 'telescope.buffers',
    keys: '<leader><leader>',
    label: 'Find buffers',
    prompt: 'Switch between currently open buffers using Telescope.',
    explains: 'Lists loaded buffers; this is not the same as searching all files.',
    siblings: ['<leader>sf', '<S-h>', '<S-l>'],
    sim: 'telescope-picker',
  }),
  lesson({
    id: 'telescope.current_buffer',
    keys: '<leader>/',
    label: 'Search current buffer',
    prompt: 'Fuzzy-search only the text in the current buffer.',
    explains: 'Uses a dropdown picker without a preview to keep the search compact.',
    siblings: ['<leader>sg', '<leader>s/'],
    sim: 'telescope-picker',
  }),

  // The two picker-internal mappings, plus the behavior of the picker itself.
  lesson({
    id: 'telescope.move_next',
    keys: '<C-j>',
    mode: 'INSERT',
    label: 'Next result in the picker',
    prompt: 'Move down the Telescope result list without leaving the prompt.',
    explains:
      'An added alias; Telescope own default is <C-n>. Note the same chord means "focus the window below" in Normal mode, so its meaning depends on whether a picker is open.',
    siblings: ['<C-k>', '<C-n>'],
  }),
  lesson({
    id: 'telescope.move_previous',
    keys: '<C-k>',
    mode: 'INSERT',
    label: 'Previous result in the picker',
    prompt: 'Move up the Telescope result list without leaving the prompt.',
    explains:
      'Mirror of <C-j>, aliasing the default <C-p>. Chosen so result navigation matches the hjkl-style window keys.',
    siblings: ['<C-j>', '<C-p>'],
  }),
  settingLesson({
    id: 'telescope.path_display',
    topic,
    setting: 'path_display',
    value: 'smart',
    label: 'Shortening result paths',
    prompt: 'How does Telescope render long file paths in results?',
    explains:
      '"smart" shortens the shared prefix so the distinguishing part of each path stays visible. The default is an empty table, which shows paths in full.',
    choices: [
      { value: 'smart', label: '"smart"', effect: 'Collapses common prefixes between results.' },
      { value: 'truncate', label: '"truncate"', effect: 'Would cut paths at the window edge.' },
      { value: 'full', label: 'Full paths', effect: 'The Telescope default.' },
    ],
    sim: 'settings',
  }),
  settingLesson({
    id: 'telescope.ui_select',
    topic,
    setting: 'ui-select extension',
    value: 'dropdown',
    label: 'Replacing vim.ui.select',
    prompt: 'What does the ui-select extension change globally?',
    explains:
      'It routes every vim.ui.select call through a Telescope dropdown, so code-action menus and similar prompts use the picker instead of a numbered list.',
    choices: [
      {
        value: 'dropdown',
        label: 'vim.ui.select uses a Telescope dropdown',
        effect: 'Affects code actions and any plugin that calls ui.select.',
      },
      { value: 'files', label: 'Only the file picker theme', effect: 'It is not about file finding.' },
      { value: 'nothing', label: 'Nothing without extra config', effect: 'It is loaded and active here.' },
    ],
    sim: 'settings',
  }),
  settingLesson({
    id: 'telescope.fzf_native',
    topic,
    setting: 'fzf-native cond',
    value: 'make',
    label: 'Conditional native sorter',
    prompt: 'Under what condition is fzf-native loaded?',
    explains:
      'Only when make is executable, since the extension compiles a C sorter. Without it Telescope falls back to its Lua sorter, and the pcall around load_extension keeps startup clean.',
    choices: [
      {
        value: 'make',
        label: 'Only if make is available',
        effect: 'Falls back to the Lua sorter otherwise.',
      },
      { value: 'always', label: 'Always', effect: 'Would fail on machines without a compiler.' },
      { value: 'never', label: 'Never', effect: 'It is used whenever it can be built.' },
    ],
    sim: 'settings',
  }),
  settingLesson({
    id: 'telescope.hidden_files',
    topic,
    setting: 'find_files hidden',
    value: false,
    label: 'Dotfiles in the file picker',
    prompt: 'Does <leader>sf list dotfiles and gitignored paths?',
    explains:
      'No: find_files leaves hidden and no_ignore at their defaults. This is the opposite of the parked Neo-tree configuration, which deliberately shows both.',
    choices: [
      {
        value: false,
        label: 'No, both are excluded',
        effect: 'Contrast with Neo-tree, which shows dotfiles and ignored files.',
      },
      { value: true, label: 'Yes, everything is listed', effect: 'Would need hidden = true explicitly.' },
    ],
    sim: 'settings',
  }),
  settingLesson({
    id: 'telescope.nvim_config_search',
    topic,
    setting: '<leader>sn cwd',
    value: 'stdpath',
    label: 'Searching the config itself',
    prompt: 'Which directory does <leader>sn search?',
    explains:
      'vim.fn.stdpath("config"), with follow=true so symlinks are traversed. That matters because this configuration is normally symlinked from a repository checkout.',
    choices: [
      {
        value: 'stdpath',
        label: 'The Neovim config directory, following symlinks',
        effect: 'Works even when the config is a symlink into a repo.',
      },
      { value: 'cwd', label: 'The current working directory', effect: 'That is what <leader>sf does.' },
      { value: 'data', label: 'The plugin data directory', effect: 'Not what this searches.' },
    ],
    sim: 'settings',
  }),
  settingLesson({
    id: 'telescope.grep_open_files',
    topic,
    setting: '<leader>s/ scope',
    value: 'open',
    label: 'Grep restricted to open buffers',
    prompt: 'What distinguishes <leader>s/ from <leader>sg?',
    explains:
      'It passes grep_open_files=true, limiting live grep to buffers you already have open, which is far narrower than grepping the whole project.',
    choices: [
      {
        value: 'open',
        label: 'It searches only open buffers',
        effect: 'A narrow search across your working set.',
      },
      { value: 'project', label: 'It searches the whole project', effect: 'That is <leader>sg.' },
      { value: 'buffer', label: 'It searches one buffer', effect: 'That is <leader>/.' },
    ],
    sim: 'settings',
  }),
  settingLesson({
    id: 'telescope.event',
    topic,
    setting: 'telescope event',
    value: 'VimEnter',
    label: 'Why Telescope loads at startup',
    prompt: 'Which lazy trigger does Telescope use?',
    explains:
      'VimEnter, so extensions register and vim.ui.select is replaced before anything can call it. A keys-only trigger would leave ui.select unpatched until the first picker.',
    choices: [
      {
        value: 'VimEnter',
        label: 'VimEnter',
        effect: 'Extensions are ready before any ui.select call.',
      },
      { value: 'keys', label: 'On first keypress', effect: 'Would delay the ui-select replacement.' },
      { value: 'VeryLazy', label: 'VeryLazy', effect: 'Used by lualine, not Telescope.' },
    ],
    sim: 'settings',
  }),
  settingLesson({
    id: 'telescope.branch',
    topic,
    setting: 'telescope branch',
    value: '0.1.x',
    label: 'Pinned Telescope branch',
    prompt: 'Which Telescope branch is tracked?',
    explains:
      '0.1.x, a maintenance branch, rather than master. It is one of the few plugins here pinned to a branch instead of following the default head.',
    choices: [
      { value: '0.1.x', label: '"0.1.x"', effect: 'Tracks the stable maintenance line.' },
      { value: 'master', label: '"master"', effect: 'Not pinned here.' },
      { value: 'main', label: '"main"', effect: 'That is the nvim-treesitter branch.' },
    ],
    sim: 'settings',
  }),
];
