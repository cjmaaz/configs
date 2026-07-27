export default function GitSignsPane({ lesson }) {
  return (
    <div className="overlay-pane gitsigns-popover" aria-label="Gitsigns simulation">
      <div className="overlay-header">
        <span>gitsigns · {lesson?.label}</span>
        <span className="muted">@@ -18,3 +18,5 @@</span>
      </div>
      <div>
        <span className="token-comment">  -- existing config</span>
        <br />
        <span style={{ color: 'var(--green)' }}>+ vim.g.netrw_liststyle = 3</span>
        <br />
        <span style={{ color: 'var(--green)' }}>+ vim.g.netrw_winsize = 25</span>
        <br />
        <span style={{ color: 'var(--red)' }}>- -- flat list</span>
      </div>
    </div>
  );
}
