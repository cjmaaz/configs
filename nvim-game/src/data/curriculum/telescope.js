import { keyLesson } from './helpers.js';

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
];
