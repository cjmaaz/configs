import { canonicalizeNotation } from '../lib/keyNotation.js';

const leaderGroups = [
  { id: 'buffer', key: 'b', label: 'Buffer' },
  { id: 'code', key: 'c', label: 'Code' },
  { id: 'diagnostic', key: 'e', label: 'Diagnostic details' },
  { id: 'file', key: 'f', label: 'Format / File' },
  { id: 'git', key: 'g', label: 'Git' },
  { id: 'hunks', key: 'h', label: 'Git hunks' },
  { id: 'quickfix', key: 'q', label: 'Diagnostic quickfix' },
  { id: 'salesforce', key: 'S', label: 'Salesforce' },
  { id: 'search', key: 's', label: 'Search' },
  { id: 'toggle', key: 't', label: 'Toggle' },
  { id: 'workspace', key: 'w', label: 'Workspace' },
  { id: 'buffer-search', key: '/', label: 'Search current buffer' },
];

export default function WhichKeyPopup({ sequence, lessons }) {
  const prefix = canonicalizeNotation(sequence);
  if (!prefix.startsWith('<leader>')) {
    return null;
  }

  const entries =
    prefix === '<leader>'
      ? leaderGroups
      : lessons
          .filter((lesson) => lesson.kind === 'keymap')
          .filter((lesson) => canonicalizeNotation(lesson.keys).startsWith(prefix))
          .slice(0, 12)
          .map((lesson) => ({
            id: lesson.id,
            key: canonicalizeNotation(lesson.keys).slice(prefix.length) || '…',
            label: lesson.label,
          }));

  if (!entries.length) {
    return null;
  }

  return (
    <div className="overlay-pane which-key-pane" aria-label="Which-key suggestions">
      <div className="overlay-header">
        <span>which-key</span>
        <span className="muted">{sequence}</span>
      </div>
      <div className="which-grid">
        {entries.map((entry) => (
          <div className="which-entry" key={entry.id}>
            <span className="which-key">{entry.key}</span>
            <span>{entry.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
