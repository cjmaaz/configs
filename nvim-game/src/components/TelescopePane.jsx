const files = [
  'nvim/init.lua',
  'nvim/lua/core/keymaps.lua',
  'nvim/lua/plugins/salesforce.lua',
  'nvim/lua/plugins/telescope.lua',
  'nvim/README.md',
];

export default function TelescopePane({ lesson }) {
  return (
    <div className="overlay-pane telescope-pane" aria-label="Telescope simulation">
      <div className="telescope-input">
        <span className="token-function">Telescope</span>
        {'  '}
        <span className="muted">{lesson?.label || 'Find files'}</span>
        <br />
        <span className="token-keyword">❯</span> nvim
      </div>
      <div className="telescope-results">
        <div className="result-list">
          {files.map((file, index) => (
            <div className={`result-item ${index === 1 ? 'selected' : ''}`} key={file}>
              {index === 1 ? '› ' : '  '}
              {file}
            </div>
          ))}
        </div>
        <div className="preview">
          <span className="token-comment">-- SECTION 3: CORE KEYMAPS</span>
          <br />
          <span className="token-keyword">local</span> map = vim.keymap.set
          <br />
          <br />
          map(<span className="token-string">&quot;n&quot;</span>,{' '}
          <span className="token-string">&quot;&lt;leader&gt;sf&quot;</span>, ...)
        </div>
      </div>
    </div>
  );
}
