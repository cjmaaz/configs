const outputFor = (lesson) => {
  if (!lesson) return ['Ready.'];
  if (/test/.test(lesson.id)) {
    return ['TEST NAME                         OUTCOME', 'AccountServiceTest.findActive   Pass', '', 'Tests Ran: 1, Failures: 0', 'Coverage: 87%'];
  }
  if (/retrieve|diff|metadata/.test(lesson.id)) {
    return ['Preparing retrieve request…', 'Status: Succeeded', 'Components: 1', 'AccountService.cls  Changed'];
  }
  if (/org/.test(lesson.id)) {
    return ['ALIAS      USERNAME                     STATUS', 'DevOrg     maaz@example.com.dev         Connected', 'Scratch    maaz@example.com.scratch     Connected'];
  }
  if (/soql/.test(lesson.id)) {
    return ['ID                  NAME', '001xx000003DGbYAAW  Acme', '001xx000003DGbZAAW  Global Media', '', 'Total number of records retrieved: 2'];
  }
  return [`Running: ${lesson.label}`, 'Target org: DevOrg', 'Status: Succeeded'];
};

export default function SfTerminalPane({ lesson }) {
  return (
    <div className="overlay-pane sf-terminal" aria-label="Salesforce terminal simulation">
      <div className="overlay-header">
        <span>SFTerm · integrated</span>
        <span className="muted">DevOrg</span>
      </div>
      <div>
        <span className="terminal-prompt">sf ❯ </span>
        {lesson?.label}
        <br />
        <br />
        {outputFor(lesson).map((line, index) => (
          <div key={`${line}-${index}`}>{line || '\u00a0'}</div>
        ))}
      </div>
    </div>
  );
}
