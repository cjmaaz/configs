import { forwardRef } from 'react';
import BufferPane from './BufferPane.jsx';
import GitSignsPane from './GitSignsPane.jsx';
import LspHoverPane from './LspHoverPane.jsx';
import NeoTreePane from './NeoTreePane.jsx';
import NetrwPane from './NetrwPane.jsx';
import SettingsPane from './SettingsPane.jsx';
import SfTerminalPane from './SfTerminalPane.jsx';
import Statusline from './Statusline.jsx';
import TelescopePane from './TelescopePane.jsx';
import WhichKeyPopup from './WhichKeyPopup.jsx';

const TerminalFrame = forwardRef(function TerminalFrame(
  {
    lesson,
    mode,
    sequence,
    result,
    lessons,
    onKeyDown,
    isFocused,
    onFocus,
    onBlur,
  },
  ref,
) {
  const active = result?.status === 'correct' || result?.status === 'wrong';
  const sim = lesson?.sim;

  return (
    <div
      className={`terminal-frame ${isFocused ? 'is-focused' : ''}`}
      ref={ref}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
      onBlur={onBlur}
      aria-label="Interactive Neovim simulator; focus here and type the answer"
    >
      <div className="terminal-titlebar">
        <span className="terminal-dot red" />
        <span className="terminal-dot yellow" />
        <span className="terminal-dot green" />
        <span className="terminal-title">nvim · keymap-dojo</span>
      </div>
      <div className="editor-workspace">
        {active && sim === 'netrw-tree' && <NetrwPane />}
        {active && sim === 'neotree' && <NeoTreePane lesson={lesson} />}
        <BufferPane lesson={lesson} mode={mode} result={result} />
        {active && sim === 'telescope-picker' && <TelescopePane lesson={lesson} />}
        {active && sim === 'gitsigns' && <GitSignsPane lesson={lesson} />}
        {active && (sim === 'lsp-hover' || sim === 'completion' || sim === 'format') && (
          <LspHoverPane lesson={lesson} />
        )}
        {active && sim === 'sf-terminal' && <SfTerminalPane lesson={lesson} />}
        {active && sim === 'settings' && <SettingsPane lesson={lesson} />}
        <WhichKeyPopup sequence={sequence} lessons={lessons} />
      </div>
      <Statusline mode={mode} sequence={sequence} lesson={lesson} />
    </div>
  );
});

export default TerminalFrame;
