import { cloneEditorState } from './editorState.js';

function update(state, label, mutate) {
  const next = cloneEditorState(state);
  mutate(next);
  next.effectLabel = label;
  return next;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function lineContaining(state, needle, fallback = state.cursor.line) {
  const index = state.lines.findIndex((line) => line.includes(needle));
  return index === -1 ? fallback : index;
}

function setActiveTab(state, tabIndex) {
  const index = clamp(tabIndex, 0, state.tabs.length - 1);
  state.tabs.forEach((tab, itemIndex) => {
    tab.active = itemIndex === index;
  });
  const active = state.tabs[index];
  state.file = {
    path: active.path,
    filetype: active.filetype,
    encoding: 'utf-8',
  };
}

function centerOnCursor(state) {
  state.topLine = clamp(
    state.cursor.line - Math.floor(state.viewportRows / 2),
    0,
    Math.max(0, state.lines.length - state.viewportRows),
  );
}

function foldAtCursor(state) {
  return state.folds
    .filter((fold) => state.cursor.line >= fold.start && state.cursor.line <= fold.end)
    .sort((left, right) => (left.end - left.start) - (right.end - right.start))[0];
}

function shiftFoldsForInsert(state, lineIndex) {
  state.folds.forEach((fold) => {
    if (fold.start >= lineIndex) fold.start += 1;
    if (fold.end >= lineIndex) fold.end += 1;
  });
}

function insertLine(state, lineIndex, text) {
  state.lines.splice(lineIndex, 0, text);
  shiftFoldsForInsert(state, lineIndex);
}

function lineIndent(line) {
  return line.match(/^\s*/)?.[0] || '';
}

function commentLineText(line) {
  const indent = lineIndent(line);
  const body = line.slice(indent.length);
  if (body.startsWith('// ')) return `${indent}${body.slice(3)}`;
  if (body.startsWith('//')) return `${indent}${body.slice(2).trimStart()}`;
  return `${indent}// ${body}`;
}

function wordRange(line, col) {
  const safe = clamp(col, 0, Math.max(0, line.length - 1));
  const isWord = (char) => /[A-Za-z0-9_]/.test(char || '');
  let start = safe;
  let end = safe;
  while (start > 0 && isWord(line[start - 1])) start -= 1;
  while (end < line.length && isWord(line[end])) end += 1;
  return { start, end };
}

function surroundingPair(line, col) {
  const pairs = [
    ['(', ')'],
    ['[', ']'],
    ['{', '}'],
    ["'", "'"],
    ['"', '"'],
  ];

  for (const [open, close] of pairs) {
    const left = line.lastIndexOf(open, col);
    const right = line.indexOf(close, Math.max(col + 1, left + 1));
    if (left !== -1 && right !== -1 && left < col && right >= col) {
      return { left, right, open, close };
    }
  }
  return null;
}

export function setMode(mode, label = `Enter ${mode} mode`) {
  return (state) =>
    update(state, label, (next) => {
      next.mode = mode;
      next.message = `-- ${mode} --`;
      if (mode !== 'VISUAL') next.selection = null;
      if (mode === 'COMMAND') next.commandLine = ':';
    });
}

export function moveCursor(lineDelta, colDelta = 0, label = 'Move cursor') {
  return (state) =>
    update(state, label, (next) => {
      next.cursor.line = clamp(next.cursor.line + lineDelta, 0, next.lines.length - 1);
      next.cursor.col = clamp(
        next.cursor.col + colDelta,
        0,
        next.lines[next.cursor.line].length,
      );
      centerOnCursor(next);
    });
}

export function scrollHalfPage(direction) {
  const label = direction > 0 ? 'Scroll half a page down and centre' : 'Scroll half a page up and centre';
  return (state) =>
    update(state, label, (next) => {
      const distance = Math.floor(next.viewportRows / 2);
      next.cursor.line = clamp(
        next.cursor.line + direction * distance,
        0,
        next.lines.length - 1,
      );
      next.cursor.col = clamp(next.cursor.col, 0, next.lines[next.cursor.line].length);
      centerOnCursor(next);
    });
}

export function toggleFold(force) {
  return (state) =>
    update(state, force === true ? 'Close fold' : force === false ? 'Open fold' : 'Toggle fold', (next) => {
      const fold = foldAtCursor(next);
      if (!fold) return;
      fold.closed = force == null ? !fold.closed : force;
      if (fold.closed) next.cursor.line = fold.start;
    });
}

export function foldAll(closed) {
  return (state) =>
    update(state, closed ? 'Close every fold' : 'Open every fold', (next) => {
      next.folds.forEach((fold) => {
        fold.closed = closed;
      });
      if (closed) {
        next.cursor.line = next.folds[0]?.start || 0;
        next.topLine = 0;
      }
    });
}

export function revealCursor() {
  return (state) =>
    update(state, 'Reveal the cursor inside its folds', (next) => {
      next.folds.forEach((fold) => {
        if (next.cursor.line >= fold.start && next.cursor.line <= fold.end) {
          fold.closed = false;
        }
      });
      centerOnCursor(next);
    });
}

export function openPane(pane, label) {
  return (state) =>
    update(state, label, (next) => {
      next.activePane = pane;
      next.message = label;
    });
}

export function setOption(option, value, label = `${option} = ${String(value)}`) {
  return (state) =>
    update(state, label, (next) => {
      next.options[option] = value;
      next.message = label;
    });
}

function searchJump(direction) {
  return (state) =>
    update(state, direction > 0 ? 'Jump to the next match and centre it' : 'Jump to the previous match and centre it', (next) => {
      const count = next.search.matches.length;
      next.search.active = true;
      next.search.current = (next.search.current + direction + count) % count;
      const match = next.search.matches[next.search.current];
      next.cursor = { line: match.line, col: match.start };
      next.flash = { type: 'search', ranges: [{ ...match }] };
      centerOnCursor(next);
    });
}

function clearSearch() {
  return (state) =>
    update(state, 'Clear search highlighting', (next) => {
      next.search.active = false;
      next.message = 'Search highlighting cleared';
    });
}

function selectRange(kind, start, end, label) {
  return (state) =>
    update(state, label, (next) => {
      next.mode = 'VISUAL';
      next.selection = { kind, start: { ...start }, end: { ...end } };
      next.cursor = { ...end };
    });
}

function selectFunction(inside, previous = false) {
  return (state) =>
    update(
      state,
      `${inside ? 'Inside' : 'Around'} ${previous ? 'previous' : 'next'} text object`,
      (next) => {
        const fold = next.folds.find((item) =>
          previous ? item.id === 'find-active' : item.id === 'summarize',
        );
        const start = inside ? fold.start + 1 : fold.start;
        const end = inside ? fold.end - 1 : fold.end;
        next.mode = 'VISUAL';
        next.selection = {
          kind: 'line',
          start: { line: start, col: 0 },
          end: { line: end, col: next.lines[end].length },
        };
        next.cursor = { ...next.selection.end };
        next.topLine = Math.max(0, start - 3);
      },
    );
}

function swapSelectedLines(direction) {
  return (state) =>
    update(state, direction > 0 ? 'Move selected lines down' : 'Move selected lines up', (next) => {
      if (!next.selection) return;
      const start = next.selection.start.line;
      const end = next.selection.end.line;

      if (direction > 0 && end < next.lines.length - 1) {
        const following = next.lines[end + 1];
        next.lines.splice(end + 1, 1);
        next.lines.splice(start, 0, following);
        next.selection.start.line += 1;
        next.selection.end.line += 1;
      } else if (direction < 0 && start > 0) {
        const preceding = next.lines[start - 1];
        next.lines.splice(start - 1, 1);
        next.lines.splice(end, 0, preceding);
        next.selection.start.line -= 1;
        next.selection.end.line -= 1;
      }

      next.cursor.line = next.selection.end.line;
      next.message = 'Selection stays active after the move';
    });
}

function focusWindow(direction) {
  return (state) =>
    update(state, `Focus ${direction} window`, (next) => {
      next.windows = { active: direction };
      next.message = `Focused the ${direction} split`;
    });
}

function arrowNudge(direction, motion) {
  return (state) =>
    update(state, `Teach ${motion} instead of the ${direction} arrow`, (next) => {
      next.message = `Use ${motion} to move!`;
      next.flash = { type: 'message', ranges: [] };
    });
}

function jumpToTodo(direction) {
  return (state) =>
    update(state, direction > 0 ? 'Jump to next TODO' : 'Jump to previous TODO', (next) => {
      const todos = next.lines
        .map((line, index) => (line.includes('TODO') ? index : -1))
        .filter((index) => index !== -1);
      const eligible =
        direction > 0
          ? todos.find((line) => line > next.cursor.line) ?? todos[0]
          : [...todos].reverse().find((line) => line < next.cursor.line) ?? todos.at(-1);
      next.cursor = {
        line: eligible,
        col: next.lines[eligible].indexOf('TODO'),
      };
      next.flash = {
        type: 'search',
        ranges: [{
          line: eligible,
          start: next.cursor.col,
          end: next.cursor.col + 4,
        }],
      };
      centerOnCursor(next);
    });
}

function surroundWord(open, close) {
  return (state) =>
    update(state, `Surround word with ${open}${close}`, (next) => {
      const line = next.lines[next.cursor.line];
      const range = wordRange(line, next.cursor.col);
      next.lines[next.cursor.line] =
        `${line.slice(0, range.start)}${open}${line.slice(range.start, range.end)}${close}${line.slice(range.end)}`;
      next.cursor.col = range.end + 1;
      next.flash = {
        type: 'surround',
        ranges: [
          { line: next.cursor.line, start: range.start, end: range.start + 1 },
          { line: next.cursor.line, start: range.end + 1, end: range.end + 2 },
        ],
      };
    });
}

function deleteSurround() {
  return (state) =>
    update(state, 'Delete surrounding quotes', (next) => {
      const line = next.lines[next.cursor.line];
      const pair = surroundingPair(line, next.cursor.col + 1);
      if (!pair) return;
      next.lines[next.cursor.line] =
        `${line.slice(0, pair.left)}${line.slice(pair.left + 1, pair.right)}${line.slice(pair.right + 1)}`;
      next.cursor.col = Math.max(pair.left, pair.right - 1);
    });
}

function replaceSurround() {
  return (state) =>
    update(state, 'Replace parentheses with quotes', (next) => {
      const line = next.lines[next.cursor.line];
      const left = line.lastIndexOf('(', next.cursor.col);
      const right = line.indexOf(')', next.cursor.col);
      if (left === -1 || right === -1) return;
      next.lines[next.cursor.line] =
        `${line.slice(0, left)}'${line.slice(left + 1, right)}'${line.slice(right + 1)}`;
      next.flash = {
        type: 'surround',
        ranges: [
          { line: next.cursor.line, start: left, end: left + 1 },
          { line: next.cursor.line, start: right, end: right + 1 },
        ],
      };
    });
}

function commentCurrentLine(block = false) {
  return (state) =>
    update(state, block ? 'Toggle block comment' : 'Toggle line comment', (next) => {
      const line = next.lines[next.cursor.line];
      next.lines[next.cursor.line] = block
        ? `${lineIndent(line)}/* ${line.trim()} */`
        : commentLineText(line);
      next.cursor.col = clamp(next.cursor.col + (block ? 3 : 3), 0, next.lines[next.cursor.line].length);
      next.flash = {
        type: 'change',
        ranges: [{
          line: next.cursor.line,
          start: 0,
          end: next.lines[next.cursor.line].length,
        }],
      };
    });
}

function commentSelection(block = false) {
  return (state) =>
    update(state, block ? 'Wrap selection in a block comment' : 'Comment the selected lines', (next) => {
      const start = next.selection?.start.line ?? next.cursor.line;
      const end = next.selection?.end.line ?? start + 1;
      if (block) {
        next.lines[start] = `${lineIndent(next.lines[start])}/* ${next.lines[start].trimStart()}`;
        next.lines[end] = `${next.lines[end]} */`;
      } else {
        for (let line = start; line <= end; line += 1) {
          next.lines[line] = commentLineText(next.lines[line]);
        }
      }
      next.mode = 'VISUAL';
      next.selection = {
        kind: 'line',
        start: { line: start, col: 0 },
        end: { line: end, col: next.lines[end].length },
      };
      next.flash = {
        type: 'change',
        ranges: Array.from({ length: end - start + 1 }, (_, index) => ({
          line: start + index,
          start: 0,
          end: next.lines[start + index].length,
        })),
      };
    });
}

function insertComment(where) {
  return (state) =>
    update(state, where === 'above' ? 'Insert comment above' : 'Insert comment below', (next) => {
      const index = where === 'above' ? next.cursor.line : next.cursor.line + 1;
      const indent = lineIndent(next.lines[next.cursor.line]);
      insertLine(next, index, `${indent}// `);
      next.cursor = { line: index, col: indent.length + 3 };
      next.mode = 'INSERT';
      next.flash = {
        type: 'change',
        ranges: [{ line: index, start: 0, end: next.lines[index].length }],
      };
      centerOnCursor(next);
    });
}

function appendComment() {
  return (state) =>
    update(state, 'Append comment at end of line', (next) => {
      next.lines[next.cursor.line] = `${next.lines[next.cursor.line]} // `;
      next.cursor.col = next.lines[next.cursor.line].length;
      next.mode = 'INSERT';
      next.flash = {
        type: 'change',
        ranges: [{
          line: next.cursor.line,
          start: 0,
          end: next.lines[next.cursor.line].length,
        }],
      };
    });
}

function findSurround(direction) {
  return (state) =>
    update(state, direction > 0 ? 'Find right surrounding delimiter' : 'Find left surrounding delimiter', (next) => {
      const line = next.lines[next.cursor.line];
      const pair = surroundingPair(line, next.cursor.col);
      if (!pair) return;
      next.cursor.col = direction > 0 ? pair.right : pair.left;
      next.flash = {
        type: 'surround',
        ranges: [
          { line: next.cursor.line, start: pair.left, end: pair.left + 1 },
          { line: next.cursor.line, start: pair.right, end: pair.right + 1 },
        ],
      };
    });
}

function highlightSurround() {
  return (state) =>
    update(state, 'Highlight surrounding pair', (next) => {
      const line = next.lines[next.cursor.line];
      const pair = surroundingPair(line, next.cursor.col);
      if (!pair) return;
      next.flash = {
        type: 'surround',
        ranges: [
          { line: next.cursor.line, start: pair.left, end: pair.left + 1 },
          { line: next.cursor.line, start: pair.right, end: pair.right + 1 },
        ],
      };
    });
}

function updateSurroundRange() {
  return (state) =>
    update(state, 'Update surround search range', (next) => {
      next.message = 'mini.surround search range: 20 lines';
      next.flash = { type: 'message', ranges: [] };
    });
}

function goToTextObject(edge) {
  return (state) =>
    update(state, edge === 'left' ? 'Go to text-object start' : 'Go to text-object end', (next) => {
      const line = next.lines[next.cursor.line];
      const pair = surroundingPair(line, next.cursor.col);
      if (!pair) return;
      next.cursor.col = edge === 'left' ? pair.left : pair.right;
      next.flash = {
        type: 'surround',
        ranges: [
          { line: next.cursor.line, start: pair.left, end: pair.left + 1 },
          { line: next.cursor.line, start: pair.right, end: pair.right + 1 },
        ],
      };
    });
}

function switchTab(direction) {
  return (state) =>
    update(state, direction > 0 ? 'Switch to next buffer' : 'Switch to previous buffer', (next) => {
      const current = next.tabs.findIndex((tab) => tab.active);
      const target = (current + direction + next.tabs.length) % next.tabs.length;
      setActiveTab(next, target);
    });
}

function closeTab() {
  return (state) =>
    update(state, 'Delete current buffer', (next) => {
      const current = next.tabs.findIndex((tab) => tab.active);
      next.tabs.splice(current, 1);
      setActiveTab(next, Math.min(current, next.tabs.length - 1));
      next.message = 'Buffer deleted';
    });
}

function exitTerminal() {
  return (state) =>
    update(state, 'Leave terminal-input mode', (next) => {
      next.mode = 'NORMAL';
      next.activePane = 'sf-terminal';
      next.message = 'Terminal input released; Normal-mode keys are active';
    });
}

function toggleTerminal() {
  return (state) =>
    update(state, 'Toggle integrated Salesforce terminal', (next) => {
      next.mode = next.mode === 'TERMINAL' ? 'NORMAL' : 'TERMINAL';
      next.activePane = 'sf-terminal';
      next.message = next.mode === 'TERMINAL' ? 'Terminal input active' : 'Terminal hidden';
    });
}

const EXPLICIT_EFFECTS = {
  'modes.insert': setMode('INSERT', 'Enter Insert mode before the cursor'),
  'modes.append': (state) =>
    update(state, 'Enter Insert mode after the cursor', (next) => {
      next.mode = 'INSERT';
      next.cursor.col = clamp(next.cursor.col + 1, 0, next.lines[next.cursor.line].length);
      next.message = '-- INSERT --';
    }),
  'modes.visual': (state) => {
    const end = {
      line: state.cursor.line,
      col: clamp(state.cursor.col + 7, 0, state.lines[state.cursor.line].length),
    };
    return selectRange('char', state.cursor, end, 'Start characterwise Visual mode')(state);
  },
  'modes.visual_line': (state) =>
    selectRange(
      'line',
      { line: state.cursor.line, col: 0 },
      { line: state.cursor.line, col: state.lines[state.cursor.line].length },
      'Select the entire current line',
    )(state),
  'modes.normal': setMode('NORMAL', 'Return to Normal mode'),
  'modes.command': setMode('COMMAND', 'Open the command line'),
  'core.clear_search': clearSearch(),
  'core.search_next': searchJump(1),
  'core.search_previous': searchJump(-1),
  'core.half_page_down': scrollHalfPage(1),
  'core.half_page_up': scrollHalfPage(-1),
  'core.visual_move_down': swapSelectedLines(1),
  'core.visual_move_up': swapSelectedLines(-1),
  'core.window_left': focusWindow('left'),
  'core.window_right': focusWindow('right'),
  'core.window_lower': focusWindow('lower'),
  'core.window_upper': focusWindow('upper'),
  'core.arrow_left': arrowNudge('left', 'h'),
  'core.arrow_right': arrowNudge('right', 'l'),
  'core.arrow_up': arrowNudge('up', 'k'),
  'core.arrow_down': arrowNudge('down', 'j'),
  'core.fold_close': toggleFold(true),
  'core.fold_open': toggleFold(false),
  'core.fold_toggle': toggleFold(),
  'core.fold_open_all': foldAll(false),
  'core.fold_close_all': foldAll(true),
  'core.fold_view': revealCursor(),
  'editing.todo_next': jumpToTodo(1),
  'editing.todo_previous': jumpToTodo(-1),
  'editing.mini_around_next': selectFunction(false, false),
  'editing.mini_inside_next': selectFunction(true, false),
  'editing.surround_add': surroundWord('(', ')'),
  'editing.surround_delete': deleteSurround(),
  'editing.surround_replace': replaceSurround(),
  'editing.comment_line': commentCurrentLine(false),
  'editing.comment_block': commentCurrentLine(true),
  'editing.comment_operator': commentSelection(false),
  'editing.comment_block_operator': commentSelection(true),
  'editing.comment_above': insertComment('above'),
  'editing.comment_below': insertComment('below'),
  'editing.comment_eol': appendComment(),
  'editing.surround_find': findSurround(1),
  'editing.surround_find_left': findSurround(-1),
  'editing.surround_highlight': highlightSurround(),
  'editing.surround_lines': updateSurroundRange(),
  'editing.mini_around_last': selectFunction(false, true),
  'editing.mini_inside_last': selectFunction(true, true),
  'editing.mini_goto_left': goToTextObject('left'),
  'editing.mini_goto_right': goToTextObject('right'),
  'core.previous_buffer': switchTab(-1),
  'core.next_buffer': switchTab(1),
  'core.delete_buffer': closeTab(),
  'core.exit_terminal': exitTerminal(),
  'sf.toggle_terminal': toggleTerminal(),
};

const SIM_EFFECTS = {
  command: setMode('COMMAND', 'Open the command line'),
  'netrw-tree': openPane('netrw-tree', 'Open the netrw explorer'),
  neotree: openPane('neotree', 'Open the Neo-tree explorer'),
  'telescope-picker': openPane('telescope-picker', 'Open a Telescope picker'),
  gitsigns: (state) =>
    update(state, 'Show the Git change', (next) => {
      next.activePane = 'gitsigns';
      next.signs = { 8: '+', 13: '~', 34: '+' };
    }),
  'lsp-hover': openPane('lsp-hover', 'Show the LSP result'),
  completion: openPane('completion', 'Open the completion menu'),
  format: openPane('format', 'Format the buffer'),
  'sf-terminal': openPane('sf-terminal', 'Run the Salesforce action'),
  settings: openPane('settings', 'Compare the setting values'),
  'buffer-tabs': openPane(null, 'Update the buffer list'),
  buffer: (state) => state,
};

function settingEffect(lesson) {
  return (state) =>
    update(state, `Apply ${lesson.setting} = ${String(lesson.value)}`, (next) => {
      next.activePane = lesson.sim || 'settings';
      next.message = `${lesson.setting} = ${String(lesson.value)}`;

      if (Object.hasOwn(next.options, lesson.setting)) {
        next.options[lesson.setting] = lesson.value;
      }

      if (lesson.setting === 'number' || lesson.setting === 'relativenumber') {
        next.options[lesson.setting] = Boolean(lesson.value);
      } else if (lesson.setting === 'list + listchars') {
        next.options.list = lesson.value === 'visible';
      } else if (lesson.setting === 'wrap + linebreak') {
        next.options.wrap = lesson.value !== 'nowrap';
        next.options.linebreak = true;
      } else if (lesson.setting === 'splitright + splitbelow') {
        next.options.splitright = lesson.value === 'right-below';
        next.options.splitbelow = lesson.value === 'right-below';
      } else if (lesson.setting === 'expandtab + shiftwidth') {
        next.options.expandtab = lesson.value === 'spaces-2';
        next.options.shiftwidth = lesson.value === 'spaces-2' ? 2 : 8;
      } else if (lesson.setting === 'diagnostic signs' || lesson.setting === 'sign glyphs') {
        next.signs = { 8: 'E', 13: 'W', 34: 'I' };
      }
    });
}

const NO_EFFECT = (state) => state;

export function resolveLessonEffect(lesson) {
  if (EXPLICIT_EFFECTS[lesson?.id]) {
    return { source: 'lesson', effect: EXPLICIT_EFFECTS[lesson.id] };
  }
  if (lesson?.kind === 'setting') {
    return { source: 'setting', effect: settingEffect(lesson) };
  }
  if (SIM_EFFECTS[lesson?.sim]) {
    return { source: 'sim', effect: SIM_EFFECTS[lesson.sim] };
  }
  return { source: 'fallback', effect: NO_EFFECT };
}

export function applyLessonEffect(state, lesson) {
  return resolveLessonEffect(lesson).effect(state);
}

export const explicitEffectIds = Object.freeze(Object.keys(EXPLICIT_EFFECTS));
