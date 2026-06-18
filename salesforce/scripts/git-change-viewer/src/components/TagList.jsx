// Renders commit "tags" ({ label, group }) as color-coded chips. Groups
// (code/auto/ui/schema/sec/data/doc/misc) map to .tag-<group> styles.
// In `interactive` mode each chip is a toggle button; chips whose label is in
// `deselected` render dimmed (used to filter that commit's file list).
const EMPTY = new Set();

export default function TagList({ tags, interactive = false, deselected, onToggle, onToggleAll }) {
  if (!tags || tags.length === 0) return null;
  const sel = deselected || EMPTY;
  const showAllToggle = interactive && !!onToggleAll && tags.length > 1;
  const allSelected = showAllToggle && tags.every((t) => !sel.has(t.label));
  const noneSelected = showAllToggle && tags.every((t) => sel.has(t.label));
  return (
    <span className="tags">
      {showAllToggle && (
        <button
          type="button"
          className="tag tag-all-toggle"
          title={allSelected ? 'Clear all tags (hide all files)' : 'Select all tags (show all files)'}
          aria-label={allSelected ? 'Clear all tags' : 'Select all tags'}
          onClick={(e) => {
            e.stopPropagation();
            onToggleAll();
          }}
        >
          {allSelected ? '☑' : noneSelected ? '☐' : '▣'}
        </button>
      )}
      {tags.map((t) => {
        const off = interactive && sel.has(t.label);
        const cls = `tag tag-${t.group || 'misc'}${interactive ? ' clickable' : ''}${off ? ' off' : ''}`;
        if (interactive) {
          return (
            <button
              key={t.label}
              type="button"
              className={cls}
              title={off ? `Show ${t.label} files` : `Hide ${t.label} files`}
              onClick={(e) => {
                e.stopPropagation();
                onToggle?.(t.label);
              }}
            >
              {t.label}
            </button>
          );
        }
        return (
          <span key={t.label} className={cls}>{t.label}</span>
        );
      })}
    </span>
  );
}
