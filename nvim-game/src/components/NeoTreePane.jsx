const fileRows = [
  { depth: 0, marker: '▾', name: 'nvim', kind: 'folder' },
  { depth: 1, marker: '▾', name: 'lua', kind: 'folder' },
  { depth: 2, marker: '▸', name: 'core', kind: 'folder' },
  { depth: 2, marker: '▾', name: 'plugins', kind: 'folder' },
  { depth: 3, marker: '·', name: 'salesforce.lua', status: 'M' },
  { depth: 3, marker: '·', name: 'telescope.lua' },
  { depth: 1, marker: '·', name: 'init.lua' },
  { depth: 0, marker: '▸', name: 'nvim-game', kind: 'folder', status: '?' },
];

const gitRows = [
  { depth: 0, marker: '▾', name: 'Modified', kind: 'folder' },
  { depth: 1, marker: 'M', name: 'nvim/README.md', status: 'M' },
  { depth: 1, marker: 'M', name: 'nvim/lua/plugins/ui.lua', status: 'M' },
  { depth: 0, marker: '▾', name: 'Untracked', kind: 'folder' },
  { depth: 1, marker: '?', name: 'nvim-game/', status: '?' },
];

export default function NeoTreePane({ lesson }) {
  const gitSource = lesson?.id === 'neotree.git';
  const rows = gitSource ? gitRows : fileRows;

  return (
    <aside className="neotree-pane" aria-label="Neo-tree simulation">
      <div className="neotree-title">
        <span>{gitSource ? 'Git Status' : 'Filesystem'}</span>
        <span className="muted">neo-tree</span>
      </div>
      {rows.map((row, index) => (
        <div
          className={`tree-row ${index === (gitSource ? 1 : 4) ? 'selected' : ''}`}
          key={`${row.name}-${index}`}
          style={{ paddingLeft: `${8 + row.depth * 14}px` }}
        >
          <span className={row.kind === 'folder' ? 'token-function' : ''}>{row.marker}</span>{' '}
          {row.name}
          {row.status && (
            <span className={`neo-status ${row.status === '?' ? 'status-untracked' : 'status-modified'}`}>
              {row.status}
            </span>
          )}
        </div>
      ))}
      <div className="neotree-footer">34 cols · watcher on · follows buffer</div>
    </aside>
  );
}
