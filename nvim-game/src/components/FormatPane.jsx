export default function FormatPane({ lesson }) {
  const toggled = lesson?.id === 'editing.toggle_format';
  return (
    <div className="overlay-pane format-pane" aria-label="Formatting simulation">
      <div className="overlay-header">
        <span>conform.nvim · {lesson?.label}</span>
        <span className="muted">{toggled ? 'format-on-save: disabled' : 'stylua / LSP fallback'}</span>
      </div>
      {toggled ? (
        <div className="format-notification">
          <span className="token-function">vim.notify</span>
          <br />
          Format-on-save disabled globally
        </div>
      ) : (
        <div className="format-diff">
          <div>
            <span className="muted">before</span>
            <pre>{'if(active){\\n save();\\n}'}</pre>
          </div>
          <span className="format-arrow">→</span>
          <div>
            <span className="muted">after</span>
            <pre>{'if (active) {\\n  save();\\n}'}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
