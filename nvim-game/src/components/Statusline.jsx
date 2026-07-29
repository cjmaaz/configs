import { displayTokens } from '../lib/keyNotation.js';

function CloudIcon() {
  return (
    <svg aria-hidden="true" className="status-icon" viewBox="0 0 24 24">
      <path d="M7 19a5 5 0 0 1-1-9.9A7 7 0 0 1 19.7 11 4 4 0 0 1 19 19H7Z" />
    </svg>
  );
}

function CoverageIcon() {
  return (
    <svg aria-hidden="true" className="status-icon" viewBox="0 0 24 24">
      <path d="M5 17a8 8 0 1 1 14 0" />
      <path d="m12 14 4-4" />
      <circle cx="12" cy="14" r="1.4" />
    </svg>
  );
}

export default function Statusline({ state, sequence, lesson }) {
  const mode = state.mode;
  return (
    <div className="statusline" aria-label={`Neovim mode: ${mode}`}>
      <span className={`status-mode ${mode.toLowerCase()}`}>{mode}</span>
      <span className="status-file">{state.file.path}</span>
      {lesson?.topic === 'salesforce' && (
        <>
          <span className="status-segment status-icon-label" aria-label="Salesforce target org DevOrg">
            <CloudIcon />
            DevOrg
          </span>
          <span className="status-segment status-icon-label" aria-label="Apex coverage 87 percent">
            <CoverageIcon />
            87%
          </span>
        </>
      )}
      {sequence && (
        <span className="status-segment key-buffer">
          {displayTokens(sequence)
            .map((token) => token.label)
            .join(' ')}
        </span>
      )}
      <span className="status-segment">{state.file.encoding}</span>
      <span className="status-segment">{state.file.filetype}</span>
      <span className="status-segment">
        {state.cursor.line + 1}:{state.cursor.col + 1}
      </span>
    </div>
  );
}
