import { settingLesson } from './helpers.js';

// Options this configuration deliberately never touches. Every value below was
// read from `nvim --clean --headless` on Neovim 0.12, so the answers are the
// real built-in defaults rather than remembered ones. Knowing what you did not
// change is as useful as knowing what you did.
const topic = 'defaults';
const lesson = (config) => settingLesson({ topic, sim: 'settings', ...config });

// Choice labels are always visible, unlike effects, so they must never hint at
// which option is correct. Every question here asks what the default is, so a
// label such as "on (default)" would give the answer away.
const onOff = (onEffect, offEffect) => [
  { value: true, label: 'on', effect: onEffect },
  { value: false, label: 'off', effect: offEffect },
];

const offOn = (offEffect, onEffect) => [
  { value: false, label: 'off', effect: offEffect },
  { value: true, label: 'on', effect: onEffect },
];

export const defaultLessons = [
  lesson({
    id: 'defaults.hlsearch',
    setting: 'hlsearch',
    value: true,
    label: 'Search highlighting is on by default',
    prompt: 'This config never sets hlsearch. What is its built-in value?',
    explains:
      'Because highlighting is on by default, matches stay lit after a search finishes. That is precisely why the config maps <Esc> to :nohlsearch.',
    choices: onOff(
      'Matches stay highlighted until cleared, so :nohlsearch is needed.',
      'Matches would never highlight and the <Esc> mapping would be pointless.',
    ),
  }),
  lesson({
    id: 'defaults.incsearch',
    setting: 'incsearch',
    value: true,
    label: 'Incremental search',
    prompt: 'Does Neovim show partial search matches while you type, without configuration?',
    explains:
      'Neovim enables incsearch by default; Vim does not. This pairs with inccommand="split", which the config does set, to preview substitutions.',
    choices: onOff(
      'Jumps to the closest match as the pattern is typed.',
      'Nothing moves until the search is submitted.',
    ),
  }),
  lesson({
    id: 'defaults.wrapscan',
    setting: 'wrapscan',
    value: true,
    label: 'Searches wrap at the end of file',
    prompt: 'Does a search continue from the top once it passes the last line?',
    explains:
      'wrapscan is on by default, so the n mapping (n → nzzzv) keeps cycling through a file forever rather than stopping at the bottom.',
    choices: onOff(
      'Search restarts from the opposite end of the buffer.',
      'Search stops at the last match and reports an error.',
    ),
  }),
  lesson({
    id: 'defaults.gdefault',
    setting: 'gdefault',
    value: false,
    label: 'Substitute needs an explicit /g',
    prompt: 'Without configuration, does :s/foo/bar/ replace every match on a line?',
    explains:
      'gdefault is off, so :s replaces only the first match per line unless /g is appended. Turning it on inverts the meaning of the /g flag.',
    choices: offOn(
      'Only the first match on each line is replaced.',
      'Every match is replaced and /g reverts to a single replacement.',
    ),
  }),
  lesson({
    id: 'defaults.timeout',
    setting: 'timeout',
    value: true,
    label: 'Mapping timeout master switch',
    prompt: 'Which option must be on for timeoutlen=300 to have any effect?',
    explains:
      'timeout is the master switch for waiting on an incomplete mapping. With it off, Neovim would wait forever and timeoutlen would be ignored.',
    choices: onOff(
      'Incomplete mappings time out after timeoutlen milliseconds.',
      'Neovim waits indefinitely and timeoutlen is ignored.',
    ),
  }),
  lesson({
    id: 'defaults.ttimeoutlen',
    setting: 'ttimeoutlen',
    value: 50,
    label: 'Key-code timeout',
    prompt: 'What is the default ttimeoutlen, the timeout for terminal key codes?',
    explains:
      'ttimeoutlen governs escape sequences sent by the terminal and is separate from timeoutlen, which governs your mappings. Confusing the two is a classic source of laggy <Esc>.',
    choices: [
      { value: 50, label: '50', effect: 'Terminal key codes must arrive within 50ms.' },
      { value: 300, label: '300', effect: 'That is this config timeoutlen, not ttimeoutlen.' },
      { value: 1000, label: '1000', effect: 'That is the default timeoutlen.' },
      { value: -1, label: '-1', effect: 'Would defer to timeoutlen instead.' },
    ],
  }),
  lesson({
    id: 'defaults.timeoutlen_builtin',
    setting: 'timeoutlen',
    value: 1000,
    label: 'Default mapping timeout',
    prompt: 'This config lowers timeoutlen to 300. What is the built-in default it overrides?',
    explains:
      'The default is a full second. Dropping it to 300ms makes which-key appear quickly, at the cost of needing to type chords more promptly.',
    choices: [
      { value: 1000, label: '1000', effect: 'One second to complete a mapping.' },
      { value: 300, label: '300', effect: 'This is the configured value, not the default.' },
      { value: 500, label: '500', effect: 'Not a Neovim default.' },
      { value: 50, label: '50', effect: 'That is the default ttimeoutlen.' },
    ],
  }),
  lesson({
    id: 'defaults.updatetime_builtin',
    setting: 'updatetime',
    value: 4000,
    label: 'Default updatetime',
    prompt: 'This config sets updatetime to 250. What is the built-in default?',
    explains:
      'Four seconds is far too slow for CursorHold-driven features, which is why the config lowers it; the LSP document-highlight autocommands depend on it firing quickly.',
    choices: [
      { value: 4000, label: '4000', effect: 'CursorHold fires after four seconds of idling.' },
      { value: 250, label: '250', effect: 'This is the configured value, not the default.' },
      { value: 1000, label: '1000', effect: 'Not a Neovim default.' },
      { value: 200, label: '200', effect: 'That is the default updatecount, in characters.' },
    ],
  }),
  lesson({
    id: 'defaults.updatecount',
    setting: 'updatecount',
    value: 200,
    label: 'Characters before a swap sync',
    prompt: 'How many typed characters trigger a swap-file write by default?',
    explains:
      'updatecount counts keystrokes, while updatetime counts milliseconds. Both flush the swap file, and only the latter is changed by this config.',
    choices: [
      { value: 200, label: '200', effect: 'Swap file syncs every 200 characters.' },
      { value: 250, label: '250', effect: 'That is this config updatetime, in milliseconds.' },
      { value: 0, label: '0', effect: 'Would disable swap-file syncing entirely.' },
    ],
  }),
  lesson({
    id: 'defaults.autoread',
    setting: 'autoread',
    value: true,
    label: 'Automatic reload of unchanged buffers',
    prompt: 'Is autoread enabled by default?',
    explains:
      'autoread is on, so the FocusGained and TermClose autocommands only need to run :checktime to prompt a check. Neovim performs the actual re-read.',
    choices: onOff(
      'Files changed outside Neovim are re-read when a check occurs.',
      'External edits would require a manual :edit.',
    ),
  }),
  lesson({
    id: 'defaults.hidden',
    setting: 'hidden',
    value: true,
    label: 'Modified buffers may be hidden',
    prompt: 'Can you leave a modified buffer without saving, by default?',
    explains:
      'Neovim enables hidden by default, unlike Vim. This is what lets <S-h> and <S-l> cycle buffers freely without complaining about unsaved changes.',
    choices: onOff(
      'Buffers stay loaded in the background with their changes intact.',
      'Neovim would refuse to leave an unsaved buffer.',
    ),
  }),
  lesson({
    id: 'defaults.confirm_builtin',
    setting: 'confirm',
    value: false,
    label: 'Default quit behavior',
    prompt: 'This config enables confirm. What happens by default when you :q a modified buffer?',
    explains:
      'By default the command fails with E37. Enabling confirm converts that error into a save/discard/cancel dialog.',
    choices: offOn(
      'The command aborts with an error message.',
      'A save-or-discard prompt appears instead.',
    ),
  }),
  lesson({
    id: 'defaults.swapfile',
    setting: 'swapfile',
    value: true,
    label: 'Swap files',
    prompt: 'Does Neovim create swap files by default?',
    explains:
      'Swap files are on by default and unrelated to undofile, which the config does enable. Swap protects against crashes; undofile persists undo history between sessions.',
    choices: onOff(
      'A .swp file guards against crashes and concurrent edits.',
      'No crash-recovery file is written.',
    ),
  }),
  lesson({
    id: 'defaults.backup',
    setting: 'writebackup',
    value: true,
    label: 'Backup during write',
    prompt: 'Is writebackup on by default?',
    explains:
      'writebackup is on while backup is off: a temporary backup exists during the write and is deleted once it succeeds, so no .bak files accumulate.',
    choices: onOff(
      'A temporary backup exists only for the duration of the write.',
      'The original is overwritten with no intermediate copy.',
    ),
  }),
  lesson({
    id: 'defaults.undolevels',
    setting: 'undolevels',
    value: 1000,
    label: 'Undo depth',
    prompt: 'How many changes can be undone by default?',
    explains:
      'A thousand levels are kept in memory, and because this config enables undofile they also survive a restart.',
    choices: [
      { value: 1000, label: '1000', effect: 'A thousand undoable changes per buffer.' },
      { value: 100, label: '100', effect: 'Not the Neovim default.' },
      { value: 10000, label: '10000', effect: 'That is the default command history size.' },
    ],
  }),
  lesson({
    id: 'defaults.history',
    setting: 'history',
    value: 10000,
    label: 'Command-line history',
    prompt: 'How many command-line entries does Neovim remember by default?',
    explains:
      'Neovim keeps 10000 entries where Vim keeps 50. This is the pool that Telescope command history and : searches draw from.',
    choices: [
      { value: 10000, label: '10000', effect: 'Ten thousand remembered commands.' },
      { value: 50, label: '50', effect: 'That is the Vim default, not Neovim.' },
      { value: 1000, label: '1000', effect: 'That is the default undolevels.' },
    ],
  }),
  lesson({
    id: 'defaults.exrc',
    setting: 'exrc',
    value: false,
    label: 'Project-local config files',
    prompt: 'Does Neovim automatically source a project-local .nvim.lua by default?',
    explains:
      'exrc is off for security: an untrusted repository could otherwise execute code on open. Enabling it prompts for trust before sourcing.',
    choices: offOn(
      'Project-local config is ignored unless explicitly enabled.',
      'A .nvim.lua in the working directory would be sourced on startup.',
    ),
  }),
  lesson({
    id: 'defaults.belloff',
    setting: 'belloff',
    value: 'all',
    label: 'Terminal bell',
    prompt: 'When does Neovim ring the bell by default?',
    explains:
      'Neovim silences every bell by default (belloff=all), while Vim beeps freely. Nothing in this config needs to change it.',
    choices: [
      { value: 'all', label: '"all" — never', effect: 'Every bell event is suppressed.' },
      { value: '', label: '"" — always', effect: 'That is the Vim default behavior.' },
      { value: 'error', label: '"error"', effect: 'Would silence only error bells.' },
    ],
  }),
  lesson({
    id: 'defaults.autoindent',
    setting: 'autoindent',
    value: true,
    label: 'Automatic indentation',
    prompt: 'Is autoindent on by default in Neovim?',
    explains:
      'Neovim enables autoindent out of the box; Vim does not. The config adds smartindent on top, which additionally reacts to syntax such as an opening brace.',
    choices: onOff(
      'A new line inherits the previous line indentation.',
      'Every new line starts at column zero.',
    ),
  }),
  lesson({
    id: 'defaults.smarttab',
    setting: 'smarttab',
    value: true,
    label: 'Smart tab at line start',
    prompt: 'Does <Tab> at the start of a line insert shiftwidth spaces by default?',
    explains:
      'smarttab is on by default, so leading indentation follows shiftwidth (2 here) while a tab elsewhere follows tabstop.',
    choices: onOff(
      'Leading whitespace uses shiftwidth instead of tabstop.',
      'Tab always inserts tabstop worth of whitespace.',
    ),
  }),
  lesson({
    id: 'defaults.shiftround',
    setting: 'shiftround',
    value: false,
    label: 'Rounding indent operations',
    prompt: 'Do >> and << round the indent to a multiple of shiftwidth by default?',
    explains:
      'shiftround is off, so an oddly indented line stays offset when shifted. Turning it on snaps indentation onto the shiftwidth grid.',
    choices: offOn(
      'Indent is added or removed without snapping to a multiple.',
      'Indent is rounded to the nearest multiple of shiftwidth.',
    ),
  }),
  lesson({
    id: 'defaults.textwidth',
    setting: 'textwidth',
    value: 0,
    label: 'Automatic hard wrapping',
    prompt: 'What is the default textwidth?',
    explains:
      'Zero means no automatic hard wrap is inserted while typing. Combined with wrap=false in this config, long lines simply extend off screen.',
    choices: [
      { value: 0, label: '0 — no wrapping', effect: 'Lines are never broken automatically.' },
      { value: 80, label: '80', effect: 'Would hard-wrap at 80 columns.' },
      { value: 79, label: '79', effect: 'A common convention but not the default.' },
    ],
  }),
  lesson({
    id: 'defaults.formatoptions',
    setting: 'formatoptions',
    value: 'tcqj',
    label: 'Default format options',
    prompt: 'Which formatoptions string does Neovim start with?',
    explains:
      'The j flag, which removes a comment leader when joining lines, is a Neovim addition. t and c auto-wrap text and comments, q enables gq.',
    choices: [
      { value: 'tcqj', label: '"tcqj"', effect: 'Neovim default, including the j join flag.' },
      { value: 'tcq', label: '"tcq"', effect: 'That is the Vim default, without j.' },
      { value: 'jcroql', label: '"jcroql"', effect: 'A popular hand-tuned value, not a default.' },
    ],
  }),
  lesson({
    id: 'defaults.joinspaces',
    setting: 'joinspaces',
    value: false,
    label: 'Spaces after a sentence on join',
    prompt: 'How many spaces does J insert after a period by default?',
    explains:
      'joinspaces is off, so J inserts a single space. Enabling it restores the two-space typewriter convention.',
    choices: offOn(
      'A single space is inserted after sentence-ending punctuation.',
      'Two spaces are inserted after a period, question or exclamation mark.',
    ),
  }),
  lesson({
    id: 'defaults.backspace',
    setting: 'backspace',
    value: 'indent,eol,start',
    label: 'Backspace reach in Insert mode',
    prompt: 'What can backspace delete over by default in Neovim?',
    explains:
      'Neovim defaults to the permissive indent,eol,start, so backspace crosses autoindent, line breaks and the start of the insert. Vim leaves this empty.',
    choices: [
      {
        value: 'indent,eol,start',
        label: '"indent,eol,start"',
        effect: 'Backspace crosses indentation, line ends and the insert start point.',
      },
      { value: '', label: '"" — restricted', effect: 'That is the Vim default.' },
      { value: 'eol', label: '"eol" only', effect: 'Would cross line breaks only.' },
    ],
  }),
  lesson({
    id: 'defaults.whichwrap',
    setting: 'whichwrap',
    value: 'b,s',
    label: 'Keys that wrap across lines',
    prompt: 'Which keys move across a line boundary by default?',
    explains:
      'Only <BS> (b) and <Space> (s) wrap. h and l deliberately stop at the line edge, which is why the config can safely nudge you away from the arrow keys.',
    choices: [
      { value: 'b,s', label: '"b,s"', effect: 'Backspace and space wrap; h and l do not.' },
      { value: '', label: '"" — none', effect: 'No key would cross a line boundary.' },
      { value: 'b,s,<,>,h,l', label: '"b,s,<,>,h,l"', effect: 'A common override, not the default.' },
    ],
  }),
  lesson({
    id: 'defaults.virtualedit',
    setting: 'virtualedit',
    value: '',
    label: 'Cursor past end of line',
    prompt: 'Can the cursor sit beyond the last character of a line by default?',
    explains:
      'virtualedit is empty, so the cursor is confined to real characters. Setting it to "block" is a common tweak for visual-block editing.',
    choices: [
      { value: '', label: '"" — confined', effect: 'The cursor cannot pass end of line.' },
      { value: 'all', label: '"all"', effect: 'Would allow free positioning anywhere.' },
      { value: 'block', label: '"block"', effect: 'Would allow it in visual block mode only.' },
    ],
  }),
  lesson({
    id: 'defaults.nrformats',
    setting: 'nrformats',
    value: 'bin,hex',
    label: 'Number formats for Ctrl-A',
    prompt: 'Which number bases does <C-a> recognise by default in Neovim?',
    explains:
      'Neovim dropped octal from the default, so <C-a> on 007 yields 008 rather than 010. Binary and hexadecimal literals are still understood.',
    choices: [
      { value: 'bin,hex', label: '"bin,hex"', effect: 'Binary and hex; 007 increments to 008.' },
      { value: 'bin,octal,hex', label: '"bin,octal,hex"', effect: 'That is the Vim default.' },
      { value: '', label: '"" — decimal only', effect: 'Would treat 0x10 as 0 followed by x10.' },
    ],
  }),
  lesson({
    id: 'defaults.startofline',
    setting: 'startofline',
    value: false,
    label: 'Column memory across jumps',
    prompt: 'Does <C-d> keep your column, or jump to the first non-blank, by default?',
    explains:
      'Neovim disables startofline, so the column is preserved across page jumps and G. Vim enables it. This is why <C-d>zz feels stable here.',
    choices: offOn(
      'The cursor keeps its column when paging or jumping.',
      'The cursor moves to the first non-blank character of the line.',
    ),
  }),
  lesson({
    id: 'defaults.laststatus',
    setting: 'laststatus',
    value: 2,
    label: 'Statusline scope',
    prompt: 'What is the default laststatus, before lualine sets globalstatus?',
    explains:
      'The default 2 gives every window its own statusline. lualine globalstatus=true in this config effectively behaves like 3, one shared statusline.',
    choices: [
      { value: 2, label: '2 — per window', effect: 'Each window draws its own statusline.' },
      { value: 3, label: '3 — global', effect: 'One statusline for the whole screen.' },
      { value: 1, label: '1 — only if split', effect: 'That is the Vim default.' },
      { value: 0, label: '0 — never', effect: 'No statusline at all.' },
    ],
  }),
  lesson({
    id: 'defaults.numberwidth',
    setting: 'numberwidth',
    value: 4,
    label: 'Number column width',
    prompt: 'How many columns are reserved for line numbers by default?',
    explains:
      'Four columns is the minimum width. With relativenumber enabled the column mostly shows small distances, so the reserved space rarely grows.',
    choices: [
      { value: 4, label: '4', effect: 'Minimum of four columns for the number gutter.' },
      { value: 2, label: '2', effect: 'Not the default; too narrow for large files.' },
      { value: 6, label: '6', effect: 'Not the default.' },
    ],
  }),
  lesson({
    id: 'defaults.showtabline',
    setting: 'showtabline',
    value: 1,
    label: 'Tabline visibility',
    prompt: 'When is the tabline shown by default?',
    explains:
      'The tabline appears only once a second tab page exists. Since <S-h> and <S-l> switch buffers rather than tabs, it normally stays hidden.',
    choices: [
      { value: 1, label: '1 — if more than one tab', effect: 'Hidden until a second tab page exists.' },
      { value: 2, label: '2 — always', effect: 'Would always reserve a line.' },
      { value: 0, label: '0 — never', effect: 'Would never show a tabline.' },
    ],
  }),
  lesson({
    id: 'defaults.equalalways',
    setting: 'equalalways',
    value: true,
    label: 'Automatic split equalisation',
    prompt: 'Are window sizes equalised when a split opens or closes, by default?',
    explains:
      'equalalways is on, which competes with the netrw_winsize=25 sidebar: opening another split can resize the explorer away from its 25 percent.',
    choices: onOff(
      'All windows are resized equally on split and close.',
      'Existing window sizes are left untouched.',
    ),
  }),
  lesson({
    id: 'defaults.splitkeep',
    setting: 'splitkeep',
    value: 'cursor',
    label: 'Text stability when splitting',
    prompt: 'What is the default splitkeep in current Neovim?',
    explains:
      'The default "cursor" keeps the cursor on the same screen line when a split changes the layout, so opening the netrw sidebar does not appear to scroll the buffer.',
    choices: [
      { value: 'cursor', label: '"cursor"', effect: 'Keeps the cursor on the same screen line.' },
      { value: 'topline', label: '"topline"', effect: 'Would keep the first visible line stable.' },
      { value: 'screen', label: '"screen"', effect: 'Would keep all text on the same screen line.' },
    ],
  }),
  lesson({
    id: 'defaults.switchbuf',
    setting: 'switchbuf',
    value: 'uselast',
    label: 'Where quickfix entries open',
    prompt: 'Where does a quickfix jump open a file by default?',
    explains:
      'The Neovim default "uselast" reuses the last accessed window, which is what happens when you pick an entry from the <leader>q diagnostic list.',
    choices: [
      { value: 'uselast', label: '"uselast"', effect: 'Reuses the most recently used window.' },
      { value: '', label: '"" — current window', effect: 'That is the Vim default.' },
      { value: 'usetab,newtab', label: '"usetab,newtab"', effect: 'A common override, not a default.' },
    ],
  }),
  lesson({
    id: 'defaults.foldmethod',
    setting: 'foldmethod',
    value: 'manual',
    label: 'Default fold method',
    prompt: 'What is the global foldmethod before Treesitter changes it?',
    explains:
      'Globally folds are manual, but this config sets foldmethod=expr with the Treesitter foldexpr on every buffer that gets a parser attached.',
    choices: [
      { value: 'manual', label: '"manual"', effect: 'Folds exist only where you create them by hand.' },
      { value: 'expr', label: '"expr"', effect: 'This is what the Treesitter setup switches to.' },
      { value: 'indent', label: '"indent"', effect: 'Would fold on indentation levels.' },
      { value: 'syntax', label: '"syntax"', effect: 'Would fold using syntax regions.' },
    ],
  }),
  lesson({
    id: 'defaults.foldenable',
    setting: 'foldenable',
    value: true,
    label: 'Folding enabled',
    prompt: 'Is folding enabled by default, even with foldmethod=manual?',
    explains:
      'foldenable is on, so folds display as soon as any exist. zi toggles this switch, which is why the config can rely on foldlevel=99 to keep them open.',
    choices: onOff(
      'Folds are shown closed according to foldlevel.',
      'All folds are force-opened regardless of foldlevel.',
    ),
  }),
  lesson({
    id: 'defaults.conceallevel',
    setting: 'conceallevel',
    value: 0,
    label: 'Concealed text',
    prompt: 'What is the default conceallevel?',
    explains:
      'Zero means nothing is ever concealed, so Markdown link syntax and similar markup render literally unless a plugin raises it.',
    choices: [
      { value: 0, label: '0 — nothing concealed', effect: 'All markup is shown as written.' },
      { value: 1, label: '1', effect: 'Would replace concealed text with a placeholder.' },
      { value: 2, label: '2', effect: 'Would hide concealed text entirely.' },
    ],
  }),
  lesson({
    id: 'defaults.pumblend',
    setting: 'pumblend',
    value: 0,
    label: 'Popup menu transparency',
    prompt: 'How transparent is the completion popup by default?',
    explains:
      'pumblend=0 means fully opaque. The config sets pumheight=12 to cap the popup height but leaves its transparency alone.',
    choices: [
      { value: 0, label: '0 — opaque', effect: 'The popup menu is fully solid.' },
      { value: 10, label: '10', effect: 'Would make it slightly translucent.' },
      { value: 100, label: '100', effect: 'Would make it fully transparent.' },
    ],
  }),
  lesson({
    id: 'defaults.pumwidth',
    setting: 'pumwidth',
    value: 15,
    label: 'Minimum popup width',
    prompt: 'What is the default minimum width of the completion popup?',
    explains:
      'Fifteen columns is the floor. This is distinct from pumheight, which this config lowers to 12 rows.',
    choices: [
      { value: 15, label: '15', effect: 'Popup is at least fifteen columns wide.' },
      { value: 12, label: '12', effect: 'That is this config pumheight, in rows.' },
      { value: 0, label: '0', effect: 'Would impose no minimum width.' },
    ],
  }),
  lesson({
    id: 'defaults.sidescroll',
    setting: 'sidescroll',
    value: 1,
    label: 'Horizontal scroll step',
    prompt: 'How many columns does Neovim scroll horizontally at a time by default?',
    explains:
      'A single column, which matters here because wrap is off: long lines scroll smoothly rather than jumping half a screen as in Vim, where the default is 0.',
    choices: [
      { value: 1, label: '1 — column by column', effect: 'Smooth single-column horizontal scroll.' },
      { value: 0, label: '0 — half a screen', effect: 'That is the Vim default.' },
      { value: 8, label: '8', effect: 'That is this config sidescrolloff, a margin not a step.' },
    ],
  }),
  lesson({
    id: 'defaults.mousemodel',
    setting: 'mousemodel',
    value: 'popup_setpos',
    label: 'Right-click behavior',
    prompt: 'What does a right-click do by default in current Neovim?',
    explains:
      'The default popup_setpos moves the cursor and opens a context menu. Since this config sets mouse="a", that menu is reachable in every mode.',
    choices: [
      {
        value: 'popup_setpos',
        label: '"popup_setpos"',
        effect: 'Moves the cursor to the click and opens a context menu.',
      },
      { value: 'extend', label: '"extend"', effect: 'That was the older default; extends the selection.' },
      { value: 'popup', label: '"popup"', effect: 'Opens a menu without moving the cursor.' },
    ],
  }),
  lesson({
    id: 'defaults.wildoptions',
    setting: 'wildoptions',
    value: 'pum,tagfile',
    label: 'Command-line completion display',
    prompt: 'How does Neovim display command-line completions by default?',
    explains:
      'Neovim includes "pum", so :  completion appears in a popup menu rather than a single status row. Nothing in this config changes it.',
    choices: [
      { value: 'pum,tagfile', label: '"pum,tagfile"', effect: 'Completions render in a popup menu.' },
      { value: 'tagfile', label: '"tagfile"', effect: 'Would use the flat single-line list.' },
      { value: '', label: '"" — plain', effect: 'No popup and no tag file formatting.' },
    ],
  }),
  lesson({
    id: 'defaults.report',
    setting: 'report',
    value: 2,
    label: 'Change-count reporting threshold',
    prompt: 'How many changed lines before Neovim prints a message, by default?',
    explains:
      'More than two lines triggers a report. It is why moving a couple of lines with the visual J and K mappings stays quiet.',
    choices: [
      { value: 2, label: '2', effect: 'Reports when more than two lines change.' },
      { value: 0, label: '0', effect: 'Would report every single change.' },
      { value: 10, label: '10', effect: 'Not the default.' },
    ],
  }),
  lesson({
    id: 'defaults.redrawtime',
    setting: 'redrawtime',
    value: 2000,
    label: 'Highlight timeout',
    prompt: 'How long will Neovim spend on syntax and search highlighting before giving up?',
    explains:
      'Two seconds. Exceeding it silently disables highlighting for that buffer, a common cause of a large file suddenly losing colour.',
    choices: [
      { value: 2000, label: '2000', effect: 'Two seconds before highlighting is abandoned.' },
      { value: 250, label: '250', effect: 'That is this config updatetime.' },
      { value: 4000, label: '4000', effect: 'That is the default updatetime.' },
    ],
  }),
  lesson({
    id: 'defaults.matchtime',
    setting: 'matchtime',
    value: 5,
    label: 'Matching bracket flash',
    prompt: 'In tenths of a second, how long is a matching paren highlighted by default?',
    explains:
      'matchtime is five tenths, half a second, and only applies when showmatch is on. showmatch itself defaults to off, so nothing flashes until you enable it.',
    choices: [
      { value: 5, label: '5 — half a second', effect: 'Match flashes for 500ms when showmatch is on.' },
      { value: 0, label: '0', effect: 'Would not pause on the match at all.' },
      { value: 15, label: '15', effect: 'Not the default.' },
    ],
  }),
  lesson({
    id: 'defaults.termguicolors',
    setting: 'termguicolors',
    value: false,
    label: 'True colour',
    prompt: 'What is the raw default of termguicolors, before terminal detection?',
    explains:
      'The option itself defaults to off, but modern Neovim enables it automatically when the terminal advertises truecolor support. Kanagawa relies on that detection.',
    choices: offOn(
      'Off as a raw default, though auto-enabled on capable terminals.',
      'Would force 24-bit colour even on terminals that cannot render it.',
    ),
  }),
  lesson({
    id: 'defaults.winwidth',
    setting: 'winwidth',
    value: 20,
    label: 'Minimum current-window width',
    prompt: 'What is the default minimum width for the focused window?',
    explains:
      'Twenty columns. Because the parked Neo-tree spec asks for width 34 and netrw for 25 percent, this floor rarely comes into play.',
    choices: [
      { value: 20, label: '20', effect: 'The focused window is kept at least 20 columns wide.' },
      { value: 1, label: '1', effect: 'That is winminwidth, the floor for inactive windows.' },
      { value: 34, label: '34', effect: 'That is the parked Neo-tree window width.' },
    ],
  }),
];
