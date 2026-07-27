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
];
