const VISUAL_GROUPS = {
  gutter: [
    'number',
    'relativenumber',
    'numberwidth',
    'signcolumn',
    'cursorline',
    'diagnostic signs',
    'sign glyphs',
    'todo-comments signs',
  ],
  whitespace: [
    'list',
    'list + listchars',
    'expandtab + shiftwidth',
    'tabstop',
    'softtabstop',
    'smartindent',
    'autoindent',
    'smarttab',
    'shiftround',
    'textwidth',
  ],
  wrap: ['wrap + linebreak', 'linebreak', 'breakindent', 'smoothscroll'],
  scroll: ['scrolloff', 'sidescrolloff', 'sidescroll'],
  search: [
    'hlsearch',
    'incsearch',
    'ignorecase + smartcase',
    'ignorecase',
    'smartcase',
    'wrapscan',
    'inccommand',
  ],
  split: [
    'splitright + splitbelow',
    'splitright',
    'splitbelow',
    'equalalways',
    'splitkeep',
    'winwidth',
    'vim.g.netrw_browse_split',
    'vim.g.netrw_altv',
    'netrw_altv scope',
  ],
  chrome: [
    'showmode',
    'laststatus',
    'showtabline',
    'colorscheme',
    'lualine globalstatus',
    'lualine filename path',
    'component_separators',
  ],
  popup: [
    'pumheight',
    'pumwidth',
    'pumblend',
    'completeopt',
    'auto_show_delay_ms',
    'completion documentation auto_show',
    'signature.enabled',
    'path_display',
    'ui-select extension',
    'menu.draw.treesitter',
  ],
  fold: [
    'foldmethod',
    'foldenable',
    'foldlevel on attach',
    'conceallevel',
  ],
  diagnostics: [
    'diagnostic underline severity',
    'severity_sort',
    'virtual_text.source',
    'virtual_text default',
    'float.border',
    'update_in_insert',
    'document highlight',
  ],
  theme: [
    'scope.show_start',
    'word_diff default',
    'current_line_blame delay',
    'kanagawa deviations',
  ],
  tree: [
    'vim.g.netrw_liststyle',
    'vim.g.netrw_winsize',
    'vim.g.netrw_keepdir',
    'window.width',
    'follow_current_file.enabled',
    'use_libuv_file_watcher',
    'filtered_items',
    'close_if_last_window',
  ],
};

export const VISUAL_SETTINGS = Object.freeze(
  Object.fromEntries(
    Object.entries(VISUAL_GROUPS).flatMap(([category, settings]) =>
      settings.map((setting) => [setting, { category }]),
    ),
  ),
);

export function visualSettingFor(setting) {
  return VISUAL_SETTINGS[setting] || null;
}

function sameValue(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function hash(text) {
  return [...text].reduce((total, char) => ((total * 31) + char.charCodeAt(0)) >>> 0, 7);
}

export function settingComparison(lesson) {
  const configuredChoice = lesson.choices.find((choice) => sameValue(choice.value, lesson.value));
  const alternativeChoice = lesson.choices.find((choice) => !sameValue(choice.value, lesson.value));
  if (!configuredChoice || !alternativeChoice) return [];

  const configured = {
    key: configuredChoice.key,
    value: configuredChoice.value,
    label: configuredChoice.label,
    effect: configuredChoice.effect,
    configured: true,
  };
  const alternative = {
    key: alternativeChoice.key,
    value: alternativeChoice.value,
    label: alternativeChoice.label,
    effect: alternativeChoice.effect,
    configured: false,
  };

  return hash(lesson.id) % 2 === 0
    ? [configured, alternative]
    : [alternative, configured];
}

export function displaySettingValue(value) {
  if (value === '') return 'empty';
  if (typeof value === 'boolean') return value ? 'on' : 'off';
  if (Array.isArray(value)) return value.join(', ');
  if (value && typeof value === 'object') {
    return Object.entries(value)
      .map(([key, item]) => `${key}:${String(item)}`)
      .join(', ');
  }
  return String(value);
}
