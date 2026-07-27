const lines = [
  <><span className="token-comment">-- Salesforce service used by the training arena</span></>,
  <><span className="token-keyword">public with sharing class</span> AccountService {'{'}</>,
  <>&nbsp;</>,
  <>&nbsp;&nbsp;<span className="token-keyword">public static</span> List&lt;Account&gt; findActive() {'{'}</>,
  <>&nbsp;&nbsp;&nbsp;&nbsp;<span className="token-keyword">return</span> [</>,
  <>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="token-keyword">SELECT</span> Id, Name, Industry</>,
  <>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="token-keyword">FROM</span> Account</>,
  <>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="token-keyword">WHERE</span> Active__c = <span className="token-keyword">true</span></>,
  <>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="token-keyword">ORDER BY</span> Name</>,
  <>&nbsp;&nbsp;&nbsp;&nbsp;];</>,
  <>&nbsp;&nbsp;{'}'}</>,
  <>{'}'}</>,
  <>&nbsp;</>,
  <><span className="token-comment">// TODO: add bulk-safe filtering</span></>,
];

export default function BufferPane({ lesson, mode, result }) {
  const current = 6;
  const gitActive = lesson?.topic === 'git' || lesson?.sim === 'gitsigns';
  const coverageActive = lesson?.topic === 'salesforce' && /coverage|uncovered/.test(lesson.id);
  const switched = lesson?.sim === 'buffer-tabs' && result?.status === 'correct';

  return (
    <div className="buffer-pane">
      <div className="buffer-tabs">
        <span className={`buffer-tab ${switched ? '' : 'active'}`}>AccountService.cls</span>
        <span className={`buffer-tab ${switched ? 'active' : ''}`}>AccountServiceTest.cls</span>
        <span className="buffer-tab">README.md</span>
      </div>
      <div className="code-area" aria-label="Simulated Neovim buffer">
        {lines.map((line, index) => {
          const isCurrent = index === current;
          const relative = isCurrent ? index + 1 : Math.abs(index - current);
          let sign = '';
          if (gitActive && [3, 7, 8].includes(index)) sign = index === 8 ? '~' : '+';
          if (coverageActive && [7, 8].includes(index)) sign = index === 8 ? '×' : '✓';

          return (
            <div className={`code-line ${isCurrent ? 'current' : ''}`} key={index}>
              <span className="sign">{sign}</span>
              <span className="line-number">{relative}</span>
              <span>
                {line}
                {isCurrent && mode === 'INSERT' && <span className="cursor-block"> </span>}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
