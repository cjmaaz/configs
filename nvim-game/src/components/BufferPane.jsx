import {
  ROW_HEIGHT,
  closedFoldAt,
  isLineHidden,
  tokenizeLine,
} from '../lib/editorState.js';

function normalizeSelection(selection) {
  if (!selection) return null;
  const startBeforeEnd =
    selection.start.line < selection.end.line
    || (selection.start.line === selection.end.line && selection.start.col <= selection.end.col);
  return startBeforeEnd
    ? selection
    : { ...selection, start: selection.end, end: selection.start };
}

function isSelected(selection, line, col, lineLength) {
  const normalized = normalizeSelection(selection);
  if (!normalized) return false;
  if (normalized.kind === 'line') {
    return line >= normalized.start.line && line <= normalized.end.line;
  }
  if (line < normalized.start.line || line > normalized.end.line) return false;
  const start = line === normalized.start.line ? normalized.start.col : 0;
  const end = line === normalized.end.line ? normalized.end.col : lineLength;
  return col >= start && col < end;
}

function isInRanges(ranges, line, col) {
  return Boolean(
    ranges?.some((range) => range.line === line && col >= range.start && col < range.end),
  );
}

function tokenTypes(line) {
  const types = [];
  let col = 0;
  for (const token of tokenizeLine(line)) {
    for (let index = 0; index < token.text.length; index += 1) {
      types[col + index] = token.type;
    }
    col += token.text.length;
  }
  return types;
}

function visibleWhitespace(line, options) {
  if (!options.list) return line;
  const trailStart = line.search(/\s+$/);
  return [...line]
    .map((char, index) => {
      if (char === '\t') return options.listchars.tab;
      if (char === '\u00a0') return options.listchars.nbsp;
      if (char === ' ' && trailStart !== -1 && index >= trailStart) return options.listchars.trail;
      return char;
    })
    .join('');
}

function renderLine(state, sourceLine, lineIndex) {
  const line = visibleWhitespace(sourceLine, state.options);
  const types = tokenTypes(sourceLine);
  const searchRanges = state.search.active ? state.search.matches : [];
  const flashRanges = state.flash?.ranges || [];
  const cursorAtEol = state.cursor.line === lineIndex && state.cursor.col >= line.length;
  const cells = [...line];
  if (!cells.length || cursorAtEol) cells.push(' ');

  const rendered = [];
  let run = null;
  const flush = () => {
    if (!run) return;
    rendered.push(
      <span className={run.className || undefined} key={`${lineIndex}-${run.start}-${state.revision}`}>
        {run.text}
      </span>,
    );
    run = null;
  };

  cells.forEach((char, col) => {
    const classes = [];
    const type = types[col];
    if (type) classes.push(`token-${type}`);
    if (isSelected(state.selection, lineIndex, col, line.length)) classes.push('visual-selection');
    if (isInRanges(searchRanges, lineIndex, col)) classes.push('search-match');
    if (isInRanges(flashRanges, lineIndex, col)) {
      classes.push(state.flash.type === 'surround' ? 'surround-flash' : 'effect-flash');
    }
    const className = classes.join(' ');
    if (run?.className === className) {
      run.text += char;
    } else {
      flush();
      run = { className, text: char, start: col };
    }
  });
  flush();
  return rendered;
}

function lineNumber(state, lineIndex) {
  const { number, relativenumber } = state.options;
  if (!number && !relativenumber) return '';
  if (!relativenumber) return lineIndex + 1;
  if (lineIndex === state.cursor.line) return number ? lineIndex + 1 : 0;
  return Math.abs(lineIndex - state.cursor.line);
}

function WindowMap({ active }) {
  const cells = [
    ['upper', '↑ upper'],
    ['left', '← left'],
    ['center', 'current'],
    ['right', 'right →'],
    ['lower', '↓ lower'],
  ];
  return (
    <div className="window-map" aria-label={`Focused split: ${active}`}>
      {cells.map(([id, label]) => (
        <div className={`window-cell window-${id} ${active === id ? 'active' : ''}`} key={id}>
          {label}
        </div>
      ))}
    </div>
  );
}

export default function BufferPane({ state }) {
  const signColumnVisible = state.options.signcolumn !== false && state.options.signcolumn !== 'no';
  const transform = `translateY(-${state.topLine * ROW_HEIGHT}px)`;
  const cursorHidden = isLineHidden(state, state.cursor.line);
  const gutterWidth = signColumnVisible ? 66 : 46;
  const cursorTransform =
    `translate(calc(${gutterWidth}px + ${state.cursor.col}ch), ${16 + state.cursor.line * ROW_HEIGHT}px)`;

  return (
    <div
      className={`buffer-pane ${state.options.wrap ? 'wrap-enabled' : 'nowrap'}`}
      data-revision={state.revision}
    >
      <div className={`buffer-tabs ${state.options.showtabline === 0 ? 'is-hidden' : ''}`}>
        {state.tabs.map((tab) => (
          <span className={`buffer-tab ${tab.active ? 'active' : ''}`} key={tab.id}>
            {tab.label}
          </span>
        ))}
      </div>
      <div className="code-area" aria-label="Simulated Neovim buffer">
        <div className="code-scroller" style={{ transform }}>
          {state.lines.map((sourceLine, index) => {
            const isCurrent = index === state.cursor.line;
            const hidden = isLineHidden(state, index);
            const closedFold = closedFoldAt(state, index);
            const displayLine = closedFold
              ? `${sourceLine.trimEnd()}  ··· ${closedFold.end - closedFold.start} lines`
              : sourceLine;
            const classes = [
              'code-line',
              isCurrent && state.options.cursorline ? 'current' : '',
              hidden ? 'is-folded-away' : '',
              closedFold ? 'fold-summary' : '',
              signColumnVisible ? '' : 'no-sign-column',
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <div className={classes} key={`${index}-${sourceLine}`}>
                {signColumnVisible && (
                  <span className="sign">
                    {closedFold ? '▸' : state.signs[index] || (index === 1 ? '▾' : '')}
                  </span>
                )}
                <span
                  className="line-number"
                  style={{ minWidth: `${Math.max(2, state.options.numberwidth)}ch` }}
                >
                  {lineNumber(state, index)}
                </span>
                <span className="line-content">{renderLine(state, displayLine, index)}</span>
              </div>
            );
          })}
          {!cursorHidden && (
            <span
              aria-hidden="true"
              className={`editor-cursor cursor-${state.mode.toLowerCase()}`}
              style={{ transform: cursorTransform }}
            />
          )}
        </div>
      </div>

      {state.windows && <WindowMap active={state.windows.active} />}
      {state.message && (
        <div className={`editor-message ${state.flash?.type === 'message' ? 'effect-flash' : ''}`}>
          {state.message}
        </div>
      )}
      {state.commandLine && (
        <div className="command-line" aria-label="Neovim command line">
          <span className="token-keyword">{state.commandLine}</span>
          <span className="command-cursor"> </span>
        </div>
      )}
    </div>
  );
}
