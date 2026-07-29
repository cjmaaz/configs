export const ROW_HEIGHT = 24;
export const VIEWPORT_ROWS = 20;

export const SAMPLE_LINES = [
  '// Account service used by the visual keymap trainer',
  'public with sharing class AccountService {',
  '  private static final String ACTIVE = \'Active\';',
  '',
  '  @AuraEnabled(cacheable=true)',
  '  public static List<Account> findActive(List<Account> accounts) {',
  '    List<Account> active = new List<Account>();',
  '    for (Account account : accounts) {',
  '      if (account.Active__c == true) {',
  '        active.add(account);',
  '      }',
  '    }',
  '',
  '    // TODO: add bulk-safe filtering',
  '    return active;',
  '  }',
  '',
  '  public static String summarize(Account account) {',
  '    String industry = account.Industry;',
  '    if (String.isBlank(industry)) {',
  '      industry = \'Unknown\';',
  '    }',
  '',
  '    return account.Name + \' — \' + industry;',
  '  }',
  '',
  '  public static Boolean isEnterprise(Account account) {',
  '    Set<String> enterpriseTypes = new Set<String>{',
  '      \'Enterprise\',',
  '      \'Strategic\'',
  '    };',
  '    return enterpriseTypes.contains(account.Type);',
  '  }',
  '',
  '  // TODO: report accounts without an owner',
  '  public static Integer countUnowned(List<Account> accounts) {',
  '    Integer total = 0;',
  '    for (Account account : accounts) {',
  '      if (account.OwnerId == null) total++;',
  '    }',
  '    return total;',
  '  }',
  '}',
  '',
  '// End of AccountService',
];

export const BASE_OPTIONS = {
  number: true,
  relativenumber: true,
  numberwidth: 4,
  cursorline: true,
  cursorcolumn: false,
  signcolumn: 'yes',
  list: true,
  listchars: { tab: '» ', trail: '·', nbsp: '␣' },
  wrap: false,
  linebreak: true,
  scrolloff: 8,
  sidescrolloff: 8,
  showmode: false,
  showtabline: 1,
  laststatus: 2,
  conceallevel: 0,
  foldmethod: 'expr',
  foldenable: true,
  foldlevel: 99,
  pumheight: 12,
  pumwidth: 15,
  pumblend: 0,
  splitright: true,
  splitbelow: true,
  hlsearch: true,
  incsearch: true,
};

const KEYWORDS = new Set([
  'public',
  'private',
  'protected',
  'static',
  'final',
  'class',
  'with',
  'sharing',
  'return',
  'for',
  'if',
  'else',
  'true',
  'false',
  'null',
  'new',
]);

function collectMatches(lines, term) {
  const matches = [];
  lines.forEach((line, lineIndex) => {
    let start = line.indexOf(term);
    while (start !== -1) {
      matches.push({ line: lineIndex, start, end: start + term.length });
      start = line.indexOf(term, start + term.length);
    }
  });
  return matches;
}

export function initialModeForLesson(lesson) {
  if (lesson?.id === 'modes.normal') return 'INSERT';
  if (lesson?.id === 'core.exit_terminal') return 'TERMINAL';
  if (lesson?.mode === 'INSERT') return 'INSERT';
  if (lesson?.mode === 'VISUAL') return 'VISUAL';
  if (lesson?.mode === 'TERMINAL') return 'TERMINAL';
  return 'NORMAL';
}

function lineContaining(lines, needle, fallback = 0) {
  const index = lines.findIndex((line) => line.includes(needle));
  return index === -1 ? fallback : index;
}

function baseFolds() {
  return [
    { id: 'class', start: 1, end: 42, closed: false },
    { id: 'find-active', start: 5, end: 15, closed: false },
    { id: 'summarize', start: 17, end: 24, closed: false },
    { id: 'is-enterprise', start: 26, end: 32, closed: false },
    { id: 'count-unowned', start: 35, end: 41, closed: false },
  ];
}

function prepareForLesson(state, lesson) {
  if (!lesson) return state;

  const next = state;
  const id = lesson.id;
  const todoFirst = lineContaining(next.lines, 'TODO: add');
  const todoLast = lineContaining(next.lines, 'TODO: report');
  const activeAdd = lineContaining(next.lines, 'active.add');
  const summary = lineContaining(next.lines, 'return account.Name');
  const isBlank = lineContaining(next.lines, 'String.isBlank');
  const quoted = lineContaining(next.lines, "'Unknown'");

  if (id === 'core.clear_search' || id === 'core.search_next' || id === 'core.search_previous') {
    next.search.active = true;
    next.search.current = id === 'core.search_previous' ? next.search.matches.length - 1 : 0;
    const current = next.search.matches[next.search.current];
    next.cursor = { line: current.line, col: current.start };
    next.topLine = Math.max(0, current.line - 5);
  }

  if (id === 'core.half_page_up') {
    next.topLine = 16;
    next.cursor = { line: 25, col: 2 };
  }

  if (id === 'core.half_page_down') {
    next.topLine = 0;
    next.cursor = { line: 8, col: 6 };
  }

  if (id === 'core.visual_move_down' || id === 'core.visual_move_up') {
    next.mode = 'VISUAL';
    next.cursor = { line: 18, col: 4 };
    next.selection = {
      kind: 'line',
      start: { line: 18, col: 0 },
      end: { line: 20, col: next.lines[20].length },
    };
    next.topLine = 12;
  }

  if (id.startsWith('core.window_')) {
    next.windows = { active: 'center' };
  }

  if (id === 'core.fold_open' || id === 'core.fold_view') {
    const fold = next.folds.find((item) => item.id === 'find-active');
    fold.closed = true;
    next.cursor = {
      line: id === 'core.fold_view' ? 9 : fold.start,
      col: 4,
    };
  }

  if (id === 'core.fold_open_all') {
    next.folds.forEach((fold) => {
      fold.closed = true;
    });
  }

  if (id === 'core.fold_close_all') {
    next.folds.forEach((fold) => {
      fold.closed = false;
    });
  }

  if (id === 'editing.todo_next') {
    next.cursor = { line: Math.max(0, todoFirst - 5), col: 2 };
    next.topLine = Math.max(0, todoFirst - 8);
  }

  if (id === 'editing.todo_previous') {
    next.cursor = { line: Math.min(next.lines.length - 1, todoLast + 5), col: 2 };
    next.topLine = Math.max(0, todoLast - 3);
  }

  if (
    id === 'editing.comment_operator'
    || id === 'editing.comment_block_operator'
    || id === 'editing.mini_around_next'
    || id === 'editing.mini_inside_next'
    || id === 'editing.mini_around_last'
    || id === 'editing.mini_inside_last'
  ) {
    next.mode = 'VISUAL';
    next.cursor = { line: 18, col: 4 };
  }

  if (id === 'editing.surround_add') {
    const col = next.lines[activeAdd].indexOf('account');
    next.cursor = { line: activeAdd, col };
    next.topLine = Math.max(0, activeAdd - 5);
  }

  if (id === 'editing.surround_delete') {
    const col = next.lines[quoted].indexOf("'Unknown'");
    next.cursor = { line: quoted, col };
    next.topLine = Math.max(0, quoted - 5);
  }

  if (id === 'editing.surround_replace') {
    const col = next.lines[isBlank].indexOf('industry');
    next.cursor = { line: isBlank, col };
    next.topLine = Math.max(0, isBlank - 6);
  }

  if (
    id === 'editing.surround_find'
    || id === 'editing.surround_find_left'
    || id === 'editing.surround_highlight'
    || id === 'editing.surround_lines'
    || id === 'editing.mini_goto_left'
    || id === 'editing.mini_goto_right'
  ) {
    const col = next.lines[summary].indexOf('account.Name');
    next.cursor = { line: summary, col: Math.max(0, col + 3) };
    next.topLine = Math.max(0, summary - 6);
  }

  if (id === 'core.previous_buffer') {
    next.tabs[0].active = false;
    next.tabs[1].active = true;
    next.file = {
      path: next.tabs[1].path,
      filetype: next.tabs[1].filetype,
      encoding: 'utf-8',
    };
  }

  return next;
}

export function createEditorState(lesson) {
  const lines = [...SAMPLE_LINES];
  const searchMatches = collectMatches(lines, 'Account');
  const state = {
    lines,
    cursor: { line: 9, col: 8 },
    topLine: 0,
    viewportRows: VIEWPORT_ROWS,
    mode: initialModeForLesson(lesson),
    selection: null,
    folds: baseFolds(),
    signs: {},
    search: {
      term: 'Account',
      matches: searchMatches,
      current: 0,
      active: false,
    },
    message: '',
    commandLine: '',
    tabs: [
      {
        id: 'service',
        label: 'AccountService.cls',
        path: 'force-app/main/default/classes/AccountService.cls',
        filetype: 'apex',
        active: true,
      },
      {
        id: 'test',
        label: 'AccountServiceTest.cls',
        path: 'force-app/main/default/classes/AccountServiceTest.cls',
        filetype: 'apex',
        active: false,
      },
      {
        id: 'readme',
        label: 'README.md',
        path: 'README.md',
        filetype: 'markdown',
        active: false,
      },
    ],
    file: {
      path: 'force-app/main/default/classes/AccountService.cls',
      filetype: 'apex',
      encoding: 'utf-8',
    },
    options: {
      ...BASE_OPTIONS,
      listchars: { ...BASE_OPTIONS.listchars },
    },
    windows: null,
    activePane: null,
    flash: null,
    effectLabel: '',
    revision: 0,
  };

  return prepareForLesson(state, lesson);
}

export function cloneEditorState(state) {
  return {
    ...state,
    lines: [...state.lines],
    cursor: { ...state.cursor },
    selection: state.selection
      ? {
          ...state.selection,
          start: { ...state.selection.start },
          end: { ...state.selection.end },
        }
      : null,
    folds: state.folds.map((fold) => ({ ...fold })),
    signs: { ...state.signs },
    search: {
      ...state.search,
      matches: state.search.matches.map((match) => ({ ...match })),
    },
    tabs: state.tabs.map((tab) => ({ ...tab })),
    file: { ...state.file },
    options: {
      ...state.options,
      listchars: { ...state.options.listchars },
    },
    windows: state.windows ? { ...state.windows } : null,
    flash: state.flash
      ? {
          ...state.flash,
          ranges: state.flash.ranges?.map((range) => ({ ...range })),
        }
      : null,
  };
}

export function tokenizeLine(line) {
  const tokens = [];
  const pattern =
    /(\/\/.*$|--.*$|'[^']*'|"[^"]*"|@[A-Za-z]+|\b[A-Za-z_][A-Za-z0-9_]*(?=\s*\()|\b[A-Za-z_][A-Za-z0-9_]*\b)/g;
  let cursor = 0;
  let match;

  while ((match = pattern.exec(line)) !== null) {
    if (match.index > cursor) {
      tokens.push({ text: line.slice(cursor, match.index), type: null });
    }

    const text = match[0];
    let type = null;
    if (text.startsWith('//') || text.startsWith('--')) type = 'comment';
    else if (text.startsWith("'") || text.startsWith('"')) type = 'string';
    else if (text.startsWith('@') || KEYWORDS.has(text)) type = 'keyword';
    else if (line.slice(match.index + text.length).trimStart().startsWith('(')) type = 'function';

    tokens.push({ text, type });
    cursor = match.index + text.length;

    if (type === 'comment') break;
  }

  if (cursor < line.length) {
    tokens.push({ text: line.slice(cursor), type: null });
  }

  return tokens.length ? tokens : [{ text: line || ' ', type: null }];
}

export function isLineHidden(state, lineIndex) {
  return state.folds.some(
    (fold) => fold.closed && lineIndex > fold.start && lineIndex <= fold.end,
  );
}

export function closedFoldAt(state, lineIndex) {
  return state.folds.find((fold) => fold.closed && fold.start === lineIndex) || null;
}

export function validateEditorState(state) {
  const errors = [];
  if (!Array.isArray(state.lines) || state.lines.length === 0) {
    errors.push('lines must be a non-empty array');
    return errors;
  }

  if (state.cursor.line < 0 || state.cursor.line >= state.lines.length) {
    errors.push('cursor line is outside the buffer');
  } else if (state.cursor.col < 0 || state.cursor.col > state.lines[state.cursor.line].length) {
    errors.push('cursor column is outside the current line');
  }

  const maxTop = Math.max(0, state.lines.length - 1);
  if (state.topLine < 0 || state.topLine > maxTop) {
    errors.push('topLine is outside the buffer');
  }

  for (const fold of state.folds) {
    if (fold.start < 0 || fold.end < fold.start || fold.end >= state.lines.length) {
      errors.push(`fold ${fold.id} has an invalid range`);
    }
  }

  if (state.selection) {
    for (const point of [state.selection.start, state.selection.end]) {
      if (point.line < 0 || point.line >= state.lines.length) {
        errors.push('selection line is outside the buffer');
      } else if (point.col < 0 || point.col > state.lines[point.line].length) {
        errors.push('selection column is outside the buffer');
      }
    }
  }

  return errors;
}
