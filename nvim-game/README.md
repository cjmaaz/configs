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

## Scheduling and mastery

Both modes draw from the same scheduler, which fills a session in tiers:

1. Lessons you have never seen.
2. Lessons seen but not yet mastered, least-progressed first.
3. Mastered lessons, earliest solve first.

The chosen set is then shuffled before it is shown, so repeating a topic does not
train the order of the questions alongside the answers.

A lesson counts as mastered after **two consecutive correct answers**, and a wrong
answer resets it to unmastered. Topic percentages are mastered over total, so
100% is reachable for every topic: pick a session length of 12, 25, 50, or
**All remaining** on the menu, and the counter tells you how many are left.

Progress is stored under `nvim-game.progress.v2`. A `v1` save is migrated on
first load, with each previously mastered lesson carried over as one correct
answer, so percentages start lower against the stricter two-answer bar.

## Simulator

- Real browser `keydown` capture normalized to Neovim notation.
- Prefix-aware chord timing: the real config uses `timeoutlen=300`, while the
  trainer keeps valid `<leader>` prefixes active until the chord is completed
  or Escape cancels it, so learning tests recall rather than typing speed.
  Other partially typed mappings get 4s and unrecognized input 1.2s. Escape
  only cancels `<leader>` chords, so `<Esc><Esc>` stays typable.
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
- **Startup**: `init.lua`, every autocommand and `filetype.add` entry, and the
  lazy.nvim bootstrap and options.
- **Defaults**: options the config deliberately leaves alone. These values were
  read from `nvim --clean --headless` rather than recalled, so they are the real
  built-in defaults. Knowing what you did not change is as useful as knowing what
  you did.

Coverage is intentionally lopsided toward settings. Nearly every mapping in the
config already had a lesson, while only a fraction of the roughly 200 explicitly
set plugin options did.

## Progress

Correct answers award base XP plus a streak multiplier. The game records:

- XP and level (`200 XP` per level).
- Current and best streak.
- Per-lesson attempts, correct count, consecutive-correct streak, and the
  timestamps that drive review ordering.
- Per-topic mastered/total counts.

Use **Reset saved progress** on the home screen to clear it.

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

Setting lessons are answered with a number key and explain the behavior of every
choice after the answer. Two constraints are enforced by `npm test`:

- **At most nine choices.** Answer keys are single digits, so a tenth choice would
  make `1` a prefix of `10` and force every single-digit answer to wait out the
  chord timeout instead of resolving on the keypress.
- **The answer must survive shuffling.** Choice order is randomised per session, so
  the correct option is not always in the same slot. Without it the answer was `1`
  for 23 lessons and `2` for 17, and spamming `1` scored well.

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
Meta/Command combinations are left to the browser.

`<C-w>`, `<C-t>`, `<C-n>` and `<C-q>` cannot be intercepted by a web page, so they
are never used as an expected answer even where the real config binds them. A
smoke assertion enforces this.
