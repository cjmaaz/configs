import { keyLesson, settingLesson } from './helpers.js';

const topic = 'git';
const lesson = (config) => keyLesson({ topic, sim: 'gitsigns', ...config });
const setting = (config) => settingLesson({ topic, sim: 'settings', ...config });

export const gitLessons = [
  lesson({
    id: 'git.next_hunk',
    keys: ']c',
    label: 'Next git hunk',
    prompt: 'Jump to the next changed hunk.',
    explains: 'Gitsigns navigates hunks; in diff mode the built-in ]c behavior is preserved.',
    siblings: ['[c', '<leader>hp', '<leader>hq'],
  }),
  lesson({
    id: 'git.previous_hunk',
    keys: '[c',
    label: 'Previous git hunk',
    prompt: 'Jump to the previous changed hunk.',
    explains: 'Gitsigns navigates backward; in diff mode the built-in [c behavior is preserved.',
    siblings: [']c', '<leader>hp', '<leader>hq'],
  }),
  lesson({
    id: 'git.stage_hunk',
    keys: '<leader>hs',
    label: 'Stage hunk',
    prompt: 'Stage the git hunk under the cursor.',
    explains: 'Stages only the current hunk rather than the whole buffer.',
    siblings: ['<leader>hr', '<leader>hS'],
  }),
  lesson({
    id: 'git.reset_hunk',
    keys: '<leader>hr',
    label: 'Reset hunk',
    prompt: 'Discard the current hunk from the working tree.',
    explains: 'Restores the hunk to the index version; this is destructive.',
    siblings: ['<leader>hs', '<leader>hR'],
  }),
  lesson({
    id: 'git.stage_selection',
    keys: '<leader>hs',
    mode: 'VISUAL',
    label: 'Stage selected lines',
    prompt: 'Stage only the selected lines of a hunk.',
    explains: 'Visual mode passes the selected line range to stage_hunk.',
    siblings: ['<leader>hr'],
  }),
  lesson({
    id: 'git.reset_selection',
    keys: '<leader>hr',
    mode: 'VISUAL',
    label: 'Reset selected lines',
    prompt: 'Discard only the selected changed lines.',
    explains: 'Visual mode passes the selected line range to reset_hunk.',
    siblings: ['<leader>hs'],
  }),
  lesson({
    id: 'git.stage_buffer',
    keys: '<leader>hS',
    label: 'Stage buffer',
    prompt: 'Stage every change in the current buffer.',
    explains: 'Stages the file but not unrelated files elsewhere in the repository.',
    siblings: ['<leader>hs', '<leader>hR'],
  }),
  lesson({
    id: 'git.reset_buffer',
    keys: '<leader>hR',
    label: 'Reset buffer',
    prompt: 'Discard all working-tree changes in the current buffer.',
    explains: 'Resets every hunk in the file and is more destructive than reset_hunk.',
    siblings: ['<leader>hr', '<leader>hS'],
  }),
  lesson({
    id: 'git.preview',
    keys: '<leader>hp',
    label: 'Preview hunk',
    prompt: 'Open the current hunk in a floating preview.',
    explains: 'Shows removed and added lines without leaving the buffer.',
    siblings: ['<leader>hi', '<leader>hd'],
  }),
  lesson({
    id: 'git.preview_inline',
    keys: '<leader>hi',
    label: 'Preview hunk inline',
    prompt: 'Show deleted text inline in the current buffer.',
    explains: 'Uses preview_hunk_inline instead of a floating window.',
    siblings: ['<leader>hp', '<leader>tw'],
  }),
  lesson({
    id: 'git.blame',
    keys: '<leader>hb',
    label: 'Blame line',
    prompt: 'Show full commit blame for the current line.',
    explains: 'Displays author, date, SHA, and commit summary for the line.',
    siblings: ['<leader>tb', '<leader>hd'],
  }),
  lesson({
    id: 'git.diff_index',
    keys: '<leader>hd',
    label: 'Diff against index',
    prompt: 'Open a diff against the git index.',
    explains: 'Compares the working buffer to what is currently staged.',
    siblings: ['<leader>hD', '<leader>hp'],
  }),
  lesson({
    id: 'git.diff_previous',
    keys: '<leader>hD',
    label: 'Diff against previous commit',
    prompt: 'Compare the buffer against the previous commit.',
    explains: 'Passes ~ as the revision to gitsigns.diffthis.',
    siblings: ['<leader>hd', '<leader>hb'],
  }),
  lesson({
    id: 'git.quickfix_repo',
    keys: '<leader>hQ',
    label: 'Repository changes quickfix',
    prompt: 'Put changed hunks from every file into quickfix.',
    explains: 'Calls setqflist(\"all\") for repository-wide navigation.',
    siblings: ['<leader>hq', '<leader>q'],
  }),
  lesson({
    id: 'git.quickfix_file',
    keys: '<leader>hq',
    label: 'File changes quickfix',
    prompt: 'Put only this file’s changed hunks into quickfix.',
    explains: 'Calls gitsigns.setqflist for the current buffer.',
    siblings: ['<leader>hQ', '<leader>q'],
  }),
  lesson({
    id: 'git.toggle_blame',
    keys: '<leader>tb',
    label: 'Toggle current-line blame',
    prompt: 'Continuously show or hide blame at the end of the current line.',
    explains: 'Unlike <leader>hb, this is a persistent toggle.',
    siblings: ['<leader>hb', '<leader>tw'],
  }),
  lesson({
    id: 'git.toggle_word_diff',
    keys: '<leader>tw',
    label: 'Toggle word diff',
    prompt: 'Show or hide intra-line git changes.',
    explains: 'Highlights exactly which words changed inside a modified line.',
    siblings: ['<leader>tb', '<leader>hi'],
  }),
  lesson({
    id: 'git.select_hunk',
    keys: 'ih',
    mode: 'OPERATOR/VISUAL',
    label: 'Git hunk text object',
    prompt: 'Select the current git hunk as a text object.',
    explains: 'Use vih to select or dih/yih to delete/yank the hunk.',
    siblings: ['aa', 'ii'],
  }),

  setting({
    id: 'git.on_attach',
    setting: 'on_attach scope',
    value: 'buffer',
    label: 'Buffer-local hunk mappings',
    prompt: 'Where do the gitsigns mappings actually exist?',
    explains:
      'Every one is created inside on_attach with buffer = bufnr, so they only exist in git-tracked buffers. In an untracked file <leader>hs is simply unmapped.',
    choices: [
      {
        value: 'buffer',
        label: 'Only in buffers gitsigns attached to',
        effect: 'No hunk mappings in untracked files.',
      },
      { value: 'global', label: 'Globally, in every buffer', effect: 'Would error outside a repository.' },
    ],
  }),
  setting({
    id: 'git.diff_guard',
    setting: ']c in diff mode',
    value: 'native',
    label: 'Preserving native ]c',
    prompt: 'What does ]c do when the buffer is already in diff mode?',
    explains:
      'The mapping checks vim.wo.diff and falls back to the built-in ]c, so during a merge or :diffthis you get real diff navigation rather than gitsigns hunks.',
    choices: [
      {
        value: 'native',
        label: 'Falls back to the built-in diff jump',
        effect: 'Diff mode behaves as Vim intends.',
      },
      { value: 'gitsigns', label: 'Still uses gitsigns hunks', effect: 'The guard exists to prevent this.' },
      { value: 'nothing', label: 'Nothing', effect: 'It always does something.' },
    ],
  }),
  setting({
    id: 'git.signs_ascii',
    setting: 'sign glyphs',
    value: 'ascii',
    label: 'ASCII change markers',
    prompt: 'Which characters mark added and changed lines in the gutter?',
    explains:
      'Plain ASCII: + for add, ~ for change and _ for delete, replacing the plugin thick Unicode bars. They read clearly in any font, Nerd Font or not.',
    choices: [
      {
        value: 'ascii',
        label: 'ASCII +, ~ and _',
        effect: 'Legible without special glyph support.',
      },
      { value: 'bars', label: 'Unicode bars', effect: 'The plugin default.' },
      { value: 'icons', label: 'Nerd Font icons', effect: 'Not used for git signs here.' },
    ],
  }),
  setting({
    id: 'git.word_diff_default',
    setting: 'word_diff default',
    value: false,
    label: 'Why word diff is a toggle',
    prompt: 'Is word-level diff highlighting on by default?',
    explains:
      'No, which is precisely why <leader>tw exists as a toggle. The same reasoning applies to current_line_blame and <leader>tb.',
    choices: [
      { value: false, label: 'false — off, hence the toggle', effect: 'Enable it on demand with <leader>tw.' },
      { value: true, label: 'true — always on', effect: 'Would make the toggle pointless.' },
    ],
  }),
  setting({
    id: 'git.blame_delay',
    setting: 'current_line_blame delay',
    value: 1000,
    label: 'Inline blame delay',
    prompt: 'Once <leader>tb enables line blame, how long before it appears?',
    explains:
      'One second, the plugin default, shown as virtual text at end of line. This config leaves the blame options untouched and only maps the toggle.',
    choices: [
      { value: 1000, label: '1000', effect: 'Blame appears after a second of rest.' },
      { value: 250, label: '250', effect: 'That is updatetime, not the blame delay.' },
      { value: 0, label: '0', effect: 'Would show instantly on every cursor move.' },
    ],
  }),
  setting({
    id: 'git.attach_untracked',
    setting: 'attach_to_untracked',
    value: false,
    label: 'Untracked files',
    prompt: 'Does gitsigns attach to a file that git does not track?',
    explains:
      'No, that is the plugin default and it is left alone. A brand-new file shows no signs until it is added to the index.',
    choices: [
      { value: false, label: 'false', effect: 'New files show no hunk signs yet.' },
      { value: true, label: 'true', effect: 'Would mark the whole file as added.' },
    ],
  }),
  setting({
    id: 'git.quickfix_scope',
    setting: 'setqflist("all")',
    value: 'repo',
    label: 'Two quickfix scopes',
    prompt: 'What distinguishes <leader>hQ from <leader>hq?',
    explains:
      'The uppercase version passes "all" for every change in the repository; lowercase covers the current file only. Results open according to switchbuf, which defaults to uselast.',
    choices: [
      {
        value: 'repo',
        label: 'Uppercase covers the whole repository',
        effect: 'Lowercase is limited to the current file.',
      },
      { value: 'staged', label: 'Uppercase covers staged changes', effect: 'It covers all changes, not just staged.' },
    ],
  }),
  setting({
    id: 'git.event',
    setting: 'gitsigns event',
    value: 'BufReadPre',
    label: 'Loading before the buffer reads',
    prompt: 'Which event loads gitsigns?',
    explains:
      'BufReadPre, unusually early compared with the BufReadPost used elsewhere, so gitsigns can attach as the buffer is being read and signs appear without a flicker.',
    choices: [
      {
        value: 'BufReadPre',
        label: 'BufReadPre and BufNewFile',
        effect: 'Attaches before the buffer contents load.',
      },
      { value: 'BufReadPost', label: 'BufReadPost', effect: 'Used by most other plugins here.' },
      { value: 'VeryLazy', label: 'VeryLazy', effect: 'Would delay signs noticeably.' },
    ],
  }),
];
