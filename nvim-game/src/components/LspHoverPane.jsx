export default function LspHoverPane({ lesson }) {
  return (
    <div className="overlay-pane lsp-popover" aria-label="LSP simulation">
      <div className="overlay-header">
        <span>LSP · {lesson?.label}</span>
        <span className="muted">apex_ls</span>
      </div>
      <div>
        <span className="token-keyword">List&lt;Account&gt;</span>{' '}
        <span className="token-function">AccountService.findActive</span>()
        <br />
        <br />
        Returns active Account records ordered by Name.
        <br />
        <span className="muted">force-app/main/default/classes/AccountService.cls:4</span>
      </div>
    </div>
  );
}
