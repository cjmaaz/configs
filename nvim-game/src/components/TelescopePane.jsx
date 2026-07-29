const files = ['nvim/init.lua', 'nvim/lua/core/keymaps.lua', 'nvim/lua/plugins/salesforce.lua', 'nvim/lua/plugins/telescope.lua', 'nvim/README.md'];

function pickerData(lesson) {
  const id = lesson?.id || '';
  if (/help/.test(id)) {
    return { query: 'keymap', rows: ['keymap.txt', 'map.txt', 'usr_40.txt', 'which-key.nvim'], preview: ':map-listing' };
  }
  if (/keymaps/.test(id)) {
    return { query: 'leader', rows: ['<leader>sf  Search files', '<leader>sg  Live grep', '<leader>fe  Toggle explorer', '<leader>Sb  Open org'], preview: 'buffer-local and global mappings' };
  }
  if (/grep|references/.test(id)) {
    return { query: 'Account', rows: ['AccountService.cls:1', 'AccountService.cls:18', 'AccountServiceTest.cls:7', 'README.md:42'], preview: 'public static List<Account> findActive' };
  }
  if (/diagnostics/.test(id)) {
    return { query: '', rows: ['E AccountService.cls:9 Unknown field', 'W AccountService.cls:19 Nullable value', 'I AccountServiceTest.cls:4 Inlay hint'], preview: 'apex_ls · diagnostic details' };
  }
  if (/symbols/.test(id)) {
    return { query: 'find', rows: ['findActive · method', 'summarize · method', 'isEnterprise · method', 'countUnowned · method'], preview: 'List<Account> findActive(List<Account>)' };
  }
  if (/buffers|open_files/.test(id)) {
    return { query: '', rows: ['AccountService.cls', 'AccountServiceTest.cls', 'README.md', 'keymaps.lua'], preview: 'loaded buffer · modified' };
  }
  if (/metadata/.test(id)) {
    return { query: 'Apex', rows: ['ApexClass · AccountService', 'ApexTrigger · AccountTrigger', 'LightningComponentBundle · accountList', 'PermissionSet · Developer'], preview: 'Salesforce metadata picker via fzf-lua' };
  }
  if (/commands|builtins/.test(id)) {
    return { query: 'Telescope', rows: ['Telescope find_files', 'Telescope live_grep', 'Telescope diagnostics', 'Telescope resume'], preview: ':Telescope resume' };
  }
  return { query: 'nvim', rows: files, preview: '-- SECTION 3: CORE KEYMAPS\\nlocal map = vim.keymap.set' };
}

export default function TelescopePane({ lesson }) {
  const data = pickerData(lesson);
  const selected =
    lesson?.id === 'telescope.move_next'
      ? 2
      : lesson?.id === 'telescope.move_previous'
        ? 0
        : 1;
  return (
    <div className="overlay-pane telescope-pane" aria-label="Telescope simulation">
      <div className="telescope-input">
        <span className="token-function">Telescope</span>
        {'  '}
        <span className="muted">{lesson?.label || 'Find files'}</span>
        <br />
        <span className="token-keyword">❯</span> {data.query}
      </div>
      <div className="telescope-results">
        <div className="result-list">
          {data.rows.map((file, index) => (
            <div className={`result-item ${index === selected ? 'selected' : ''}`} key={file}>
              {index === selected ? '› ' : '  '}
              {file}
            </div>
          ))}
        </div>
        <div className="preview">
          {data.preview.split('\n').map((line, index) => (
            <div key={`${line}-${index}`}>
              <span className={index === 0 ? 'token-comment' : 'token-keyword'}>{line}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
