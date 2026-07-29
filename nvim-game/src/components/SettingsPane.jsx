import {
  displaySettingValue,
  settingComparison,
  visualSettingFor,
} from '../lib/visualSettings.js';

function enabled(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value > 0;
  return !['', 'none', 'no', 'off', 'false', '0'].includes(String(value).toLowerCase());
}

function MiniSettingBuffer({ category, setting, value }) {
  const on = enabled(value);

  if (category === 'gutter') {
    const relative = setting === 'relativenumber' && on;
    const showNumbers = !['number', 'relativenumber'].includes(setting) || on;
    const showSigns = setting.includes('sign') && on;
    return (
      <div className={`mini-editor mini-gutter ${setting === 'cursorline' && on ? 'show-current' : ''}`}>
        {[7, 8, 9].map((line, index) => (
          <div className="mini-code-line" key={line}>
            <span className="mini-sign">{showSigns && index === 1 ? 'W' : ''}</span>
            <span className="mini-number">
              {showNumbers ? (relative ? (index === 1 ? 8 : 1) : line) : ''}
            </span>
            <span>{index === 1 ? 'active.add(account);' : 'Account account;'}</span>
          </div>
        ))}
      </div>
    );
  }

  if (category === 'whitespace') {
    const indent = typeof value === 'number' ? Math.min(8, Math.max(1, value)) : on ? 2 : 8;
    const marker = setting.includes('list') && on ? '»·' : '  ';
    return (
      <div className="mini-editor mini-whitespace">
        <div>{marker}public static void run() {'{'}</div>
        <div style={{ paddingLeft: `${indent * 3}px` }}>{marker}save();</div>
        <div>{'}'}</div>
      </div>
    );
  }

  if (category === 'wrap') {
    return (
      <div className={`mini-editor mini-wrap ${on ? 'wrap-on' : ''}`}>
        AccountService.findActive returns all active accounts ordered by account name.
      </div>
    );
  }

  if (category === 'scroll') {
    const offset = typeof value === 'number' ? Math.min(45, value * 3) : on ? 24 : 4;
    return (
      <div className="mini-editor mini-scroll">
        <div className="mini-scroll-cursor" style={{ top: `${offset}%` }}>cursor</div>
        <span>top context</span>
        <span>middle</span>
        <span>bottom context</span>
      </div>
    );
  }

  if (category === 'search') {
    return (
      <div className="mini-editor mini-search">
        <div>{on ? <mark>Account</mark> : 'Account'} account;</div>
        <div>{String(value).includes('smart') ? 'account / Account' : 'account'}</div>
        <div className="mini-substitute">{setting === 'inccommand' ? 'preview: Customer' : ':s/Account/Customer/'}</div>
      </div>
    );
  }

  if (category === 'split') {
    const right = String(value).includes('right') || value === true || value === 1;
    return (
      <div className={`mini-editor mini-split ${right ? 'split-right' : 'split-left'}`}>
        <div className="mini-split-main">current</div>
        <div className="mini-split-new">new</div>
      </div>
    );
  }

  if (category === 'chrome') {
    return (
      <div className="mini-editor mini-chrome">
        {(setting === 'showtabline' ? Number(value) > 0 : true) && (
          <div className="mini-tabline">service.cls │ test.cls</div>
        )}
        <div className="mini-chrome-body">AccountService</div>
        {(setting !== 'laststatus' || Number(value) > 0) && (
          <div className="mini-statusline">
            {setting === 'showmode' && on ? '-- INSERT --' : 'NORMAL'} │ {displaySettingValue(value)}
          </div>
        )}
      </div>
    );
  }

  if (category === 'popup') {
    const rows = typeof value === 'number' ? Math.min(5, Math.max(2, Math.ceil(value / 4))) : 3;
    const preselect = setting !== 'completeopt' || !String(value).includes('noselect');
    return (
      <div className="mini-editor mini-popup">
        <div>active.</div>
        <div className="mini-completion" style={{ opacity: setting === 'pumblend' ? Math.max(0.35, 1 - Number(value) / 100) : 1 }}>
          {Array.from({ length: rows }, (_, index) => (
            <div className={preselect && index === 0 ? 'selected' : ''} key={index}>
              {['add', 'clear', 'clone', 'contains', 'size'][index]}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (category === 'fold') {
    const closed = value === 0 || value === 'manual' || value === false;
    return (
      <div className="mini-editor mini-fold">
        <div>▾ public class AccountService {'{'}</div>
        <div>  {closed ? '▸ findActive() ··· 9 lines' : '▾ findActive() {'}</div>
        {!closed && <div>      return active;</div>}
        {!closed && <div>    {'}'}</div>}
        <div>{'}'}</div>
      </div>
    );
  }

  if (category === 'diagnostics') {
    return (
      <div className="mini-editor mini-diagnostics">
        <div className={on ? 'diagnostic-line' : ''}>
          <span className="mini-sign">W</span> Account accunt
        </div>
        {setting.includes('virtual') && on && <div className="mini-virtual">spelling: unknown symbol</div>}
        {setting.includes('float') && (
          <div className={`mini-float ${String(value).includes('rounded') ? 'rounded' : ''}`}>
            apex_ls · Unknown identifier
          </div>
        )}
      </div>
    );
  }

  if (category === 'tree') {
    const wide = Number(value) >= 30;
    return (
      <div className={`mini-editor mini-tree ${wide ? 'wide' : ''}`}>
        <div>▾ nvim/</div>
        <div>│ ▾ lua/</div>
        <div>│ │ ▸ core/</div>
        <div>│ │ · plugins.lua</div>
      </div>
    );
  }

  return (
    <div className={`mini-editor mini-theme ${on ? 'is-on' : 'is-off'}`}>
      <span className="token-keyword">public static</span>{' '}
      <span className="token-function">findActive</span>()
      <br />
      <span className="token-comment">// {displaySettingValue(value)}</span>
    </div>
  );
}

export default function SettingsPane({ lesson, result }) {
  if (!lesson?.choices) return null;

  const descriptor = visualSettingFor(lesson.setting);
  const comparison = descriptor ? settingComparison(lesson) : [];
  const answered = result && result.status !== 'pending';

  return (
    <div className="overlay-pane settings-pane" aria-label="Setting alternatives">
      <div className="overlay-header">
        <span>:set · {lesson.setting}</span>
        <span className="muted">
          {answered ? `configured: ${displaySettingValue(lesson.value)}` : 'visual comparison'}
        </span>
      </div>
      {comparison.length ? (
        <div className="setting-comparison">
          {comparison.map((option) => (
            <div
              className={`setting-visual ${answered && option.configured ? 'configured' : ''}`}
              key={`${lesson.id}-${displaySettingValue(option.value)}`}
            >
              <div className="setting-visual-title">
                <span>Choice {option.key}</span>
                <strong>{option.label}</strong>
                {answered && option.configured && <span className="configured-badge">Configured</span>}
              </div>
              <MiniSettingBuffer
                category={descriptor.category}
                setting={lesson.setting}
                value={option.value}
              />
              <p>{option.effect}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="setting-concept">
          {lesson.choices.map((choice) => {
            const configured = JSON.stringify(choice.value) === JSON.stringify(lesson.value);
            return (
              <div
                className={`answer-row ${answered && configured ? 'configured-choice' : ''}`}
                key={choice.key}
              >
                <kbd>{choice.key}</kbd> {choice.label}
                {answered && configured && <span className="configured-badge">Configured</span>}
                <div className="muted">{choice.effect}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
