const specialKeys = {
  ArrowDown: '<Down>',
  ArrowLeft: '<Left>',
  ArrowRight: '<Right>',
  ArrowUp: '<Up>',
  Backspace: '<BS>',
  Delete: '<Del>',
  End: '<End>',
  Enter: '<CR>',
  Escape: '<Esc>',
  Home: '<Home>',
  PageDown: '<PageDown>',
  PageUp: '<PageUp>',
  Tab: '<Tab>',
};

const modifierKeys = new Set(['Alt', 'Control', 'Meta', 'Shift']);

export function eventToNotation(event) {
  if (modifierKeys.has(event.key) || event.key === 'Dead' || event.isComposing) {
    return null;
  }

  if (event.metaKey) {
    return null;
  }

  if (event.key === 'Tab' && event.shiftKey) {
    return '<S-Tab>';
  }

  const base = specialKeys[event.key] || (event.key === ' ' ? '<leader>' : event.key);

  if (event.ctrlKey) {
    const key = base.length === 1 ? base.toLowerCase() : base.replace(/[<>]/g, '');
    return `<C-${key}>`;
  }

  if (event.altKey) {
    const key = base.length === 1 ? base.toLowerCase() : base.replace(/[<>]/g, '');
    return `<A-${key}>`;
  }

  return base;
}

export function tokenizeNotation(sequence = '') {
  return sequence.match(/<[^>]+>|./g) || [];
}

export function canonicalizeNotation(sequence = '') {
  return tokenizeNotation(sequence)
    .map((token) => {
      const shiftedLetter = token.match(/^<S-([a-z])>$/i);
      if (shiftedLetter) {
        return shiftedLetter[1].toUpperCase();
      }
      if (/^<(esc|cr|tab|s-tab|bs|del|left|right|up|down|pagedown|pageup|home|end|leader)>$/i.test(token)) {
        const lookup = {
          esc: '<Esc>',
          cr: '<CR>',
          tab: '<Tab>',
          's-tab': '<S-Tab>',
          bs: '<BS>',
          del: '<Del>',
          left: '<Left>',
          right: '<Right>',
          up: '<Up>',
          down: '<Down>',
          pagedown: '<PageDown>',
          pageup: '<PageUp>',
          home: '<Home>',
          end: '<End>',
          leader: '<leader>',
        };
        return lookup[token.slice(1, -1).toLowerCase()];
      }
      const control = token.match(/^<C-(.+)>$/i);
      if (control) {
        return `<C-${control[1].toLowerCase()}>`;
      }
      return token;
    })
    .join('');
}

export function displayTokens(sequence = '') {
  return tokenizeNotation(sequence).map((token) => ({
    raw: token,
    label: token === '<leader>' ? 'SPC' : token.replace(/^<|>$/g, ''),
  }));
}
