const items = [
  ['findActive', 'method'],
  ['findAll', 'method'],
  ['filter', 'function'],
  ['final', 'keyword'],
];

export default function CompletionPane({ lesson }) {
  const previous = lesson?.id === 'editing.complete_previous';
  const accepted =
    lesson?.id === 'editing.complete_accept'
    || lesson?.id === 'editing.complete_accept_canonical';
  const hidden = lesson?.id === 'editing.complete_hide';
  const selected = previous ? 0 : 1;

  if (hidden) {
    return (
      <div className="overlay-pane completion-pane completion-dismissed">
        <span className="token-comment">Completion menu dismissed; typing continues unchanged.</span>
      </div>
    );
  }

  return (
    <div className="overlay-pane completion-pane" aria-label="Completion simulation">
      <div className="overlay-header">
        <span>blink.cmp · {lesson?.label}</span>
        <span className="muted">{accepted ? 'accepted' : 'selecting'}</span>
      </div>
      {accepted ? (
        <div className="completion-accepted">
          active.<span className="token-function">findActive</span>()
          <span className="cursor-glyph cursor-insert"> </span>
        </div>
      ) : (
        <div className="completion-items">
          {items.map(([label, kind], index) => (
            <div className={`completion-item ${index === selected ? 'selected' : ''}`} key={label}>
              <span>{label}</span>
              <span className="muted">{kind}</span>
            </div>
          ))}
        </div>
      )}
      <div className="completion-docs">
        <strong>AccountService.findActive</strong>
        <br />
        Returns the active accounts visible to the current user.
      </div>
    </div>
  );
}
