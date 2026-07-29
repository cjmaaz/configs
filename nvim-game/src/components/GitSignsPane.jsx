function contentFor(lesson) {
  const id = lesson?.id || '';
  if (/blame/.test(id)) {
    return {
      meta: 'Maaz · 2 hours ago',
      lines: ['AccountService.cls:14', 'Add bulk-safe filtering TODO', '4c72a0b'],
    };
  }
  if (/quickfix/.test(id)) {
    return {
      meta: /repo/.test(id) ? 'repository · 7 changes' : 'current file · 3 changes',
      lines: ['AccountService.cls:8   added hunk', 'AccountService.cls:18  changed hunk', 'README.md:42           changed hunk'],
    };
  }
  if (/stage/.test(id)) {
    return {
      meta: 'hunk staged ✓',
      lines: ['+ List<Account> active = new List<Account>();', '+ return active;', 'index updated'],
    };
  }
  if (/reset/.test(id)) {
    return {
      meta: 'hunk reset',
      lines: ['  List<Account> active;', '  return accounts;', 'working tree restored'],
    };
  }
  if (/word_diff/.test(id)) {
    return {
      meta: 'word diff on',
      lines: ['- return accounts;', '+ return active;', 'changed words highlighted inline'],
    };
  }
  if (/coverage|uncovered/.test(id)) {
    return {
      meta: 'Apex coverage · 87%',
      lines: ['✓ line 8 covered', '× line 19 uncovered', '✓ line 35 covered'],
    };
  }
  return {
    meta: '@@ -18,3 +18,5 @@',
    lines: ['  // existing config', '+ vim.g.netrw_liststyle = 3', '+ vim.g.netrw_winsize = 25', '- -- flat list'],
  };
}

export default function GitSignsPane({ lesson }) {
  const content = contentFor(lesson);
  return (
    <div className="overlay-pane gitsigns-popover" aria-label="Gitsigns simulation">
      <div className="overlay-header">
        <span>gitsigns · {lesson?.label}</span>
        <span className="muted">{content.meta}</span>
      </div>
      <div>
        {content.lines.map((line) => (
          <div
            key={line}
            style={{
              color: line.startsWith('+')
                ? 'var(--green)'
                : line.startsWith('-')
                  ? 'var(--red)'
                  : undefined,
            }}
          >
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}
