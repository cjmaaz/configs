# Nvim Dojo

A gamified browser simulator for the exact Neovim configuration under
[`../nvim/`](../nvim/). It teaches real keymaps and settings with a terminal-like
UI, live mode/statusline feedback, scripted plugin panes, and persistent mastery.

The game is self-contained. It does not import, generate, or modify any file
inside the real `nvim/` directory.

## Run locally

Requires Node.js 20.19+ (or 22.12+) and npm.

```bash
cd nvim-game
npm install
npm run dev
```

Open [http://localhost:5174](http://localhost:5174).

Production check:

```bash
npm run build
npm run preview
```

## Modes

### Learn

Shows the goal, expected Neovim mode, and exact chord. Replay it to trigger the
simulated pane. Wrong input gives a nudge and leaves the same challenge active.

### Practice

Shows only the task. After answering, the reveal explains:

- What the pressed chord means (when it matches another mapping).
- The correct chord and its behavior.
- Nearby sibling mappings and what each alternative does.

Missed challenges are added to the weak-item queue and prioritized in future
Practice sessions.

## Simulator

- Real browser `keydown` capture normalized to Neovim notation.
- Prefix-aware chord timing: the real config uses `timeoutlen=300`, while the
  trainer keeps valid `<leader>` prefixes active until the chord is completed
  or Escape cancels it, so learning tests recall rather than typing speed.
- Live NORMAL / INSERT / VISUAL / COMMAND / TERMINAL statusline.
- Blue terminal and gold sidebar focus glows. With the sidebar focused, Enter
  activates **Skip for now** or **Next challenge**; terminal-focused Enter
  remains the Neovim `<CR>` key.
- Relative line numbers, sign column, current-line highlight, and Kanagawa
  Dragon colors.
- Reactive Telescope, netrw, gitsigns, LSP, completion/settings, which-key,
  and sf.nvim terminal panes.
- sf.nvim target-org and Apex coverage statusline segments.

## Curriculum

The curriculum is split under `src/data/curriculum/` and mirrors the config:

- Modes and core navigation.
- Buffers/windows and netrw.
- Every core option and all five netrw globals.
- Telescope, gitsigns, LSP, formatting, linting, todo-comments.
- mini.ai, mini.surround, blink.cmp snippets/completion.
- Java/jdtls and Rust/rustaceanvim.
- Every active Salesforce mapping for orgs, metadata, Apex tests/coverage,
  SOQL, logs, ctags, and SObject refresh.
- Plugin-setting tradeoffs and an active Neo-tree arena covering every parked
  Neo-tree keymap/setting, so it can be learned before the real plugin is enabled.

## Progress

Correct answers award base XP plus a streak multiplier. The game records:

- XP and level (`200 XP` per level).
- Current and best streak.
- Per-topic accuracy/mastery.
- Miss counts used to prioritize weak mappings.

Progress is saved in browser `localStorage` under
`nvim-game.progress.v1`. Use **Reset saved progress** on the home screen to
clear it.

## Add or update a lesson

Add the entry to the matching file in `src/data/curriculum/` using
`keyLesson` or `settingLesson`, then export the array from `index.js`.

Keymap example:

```js
keyLesson({
  id: 'telescope.find_files',
  topic: 'telescope',
  keys: '<leader>sf',
  label: 'Search files',
  prompt: 'Show all project files through Telescope.',
  explains: 'Fuzzy-matches filenames from the working directory.',
  siblings: ['<leader>sg', '<leader>s.'],
  sim: 'telescope-picker',
});
```

Setting lessons use number keys (`1`–`4`) and explain the behavior of every
choice after the answer.

## Structure

```text
nvim-game/
├── src/
│   ├── components/          # Terminal panes and game UI
│   ├── data/curriculum/     # Keymaps/settings grouped by topic
│   ├── lib/                 # Capture, engine, and progress
│   ├── App.jsx
│   └── styles.css
├── index.html
├── package.json
└── vite.config.js
```

## Browser notes

Keystrokes are intercepted only while the simulated terminal has focus.
Meta/Command combinations are left to the browser. The app avoids browser
reserved shortcuts in its curriculum.
