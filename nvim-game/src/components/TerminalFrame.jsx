import { forwardRef } from 'react';
import BufferPane from './BufferPane.jsx';
import CompletionPane from './CompletionPane.jsx';
import FormatPane from './FormatPane.jsx';
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
    editorState,
    effectPhase,
    effectIteration,
    effectReplayCount,
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
  const pane = editorState.activePane;
  const effectVisible =
    effectPhase === 'preview' || effectPhase === 'playing' || effectPhase === 'settled';
  const counter = effectIteration ? `${effectIteration}/${effectReplayCount}` : '';
  let phaseLabel = null;
  if (effectPhase === 'preview') phaseLabel = `Learn preview ${counter}`;
  if (effectPhase === 'preview-gap') {
    phaseLabel = `1s gap · next ${Math.min(effectIteration + 1, effectReplayCount)}/${effectReplayCount}`;
  }
  if (effectPhase === 'playing') phaseLabel = `Replay ${counter}`;
  if (effectPhase === 'playing-gap') {
    phaseLabel = `1s gap · next ${Math.min(effectIteration + 1, effectReplayCount)}/${effectReplayCount}`;
  }
  if (effectPhase === 'settled') {
    phaseLabel = `${result?.status === 'wrong' ? 'Correct action' : 'Action applied'} ${counter}`;
  }

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
        {pane === 'netrw-tree' && <NetrwPane />}
        {pane === 'neotree' && <NeoTreePane lesson={lesson} />}
        <BufferPane state={editorState} />
        {pane === 'telescope-picker' && <TelescopePane lesson={lesson} />}
        {pane === 'gitsigns' && <GitSignsPane lesson={lesson} />}
        {pane === 'lsp-hover' && <LspHoverPane lesson={lesson} />}
        {pane === 'completion' && <CompletionPane lesson={lesson} />}
        {pane === 'format' && <FormatPane lesson={lesson} />}
        {pane === 'sf-terminal' && <SfTerminalPane lesson={lesson} />}
        {lesson?.kind === 'setting' && effectVisible && (
          <SettingsPane
            lesson={lesson}
            result={result}
            editorState={editorState}
            effectPhase={effectPhase}
          />
        )}
        <WhichKeyPopup sequence={sequence} lessons={lessons} />
        {phaseLabel && (
          <div className={`effect-phase effect-phase-${effectPhase}`}>
            <span>{phaseLabel}</span>
            <strong>{editorState.effectLabel || lesson?.label}</strong>
          </div>
        )}
      </div>
      <Statusline state={editorState} sequence={sequence} lesson={lesson} />
    </div>
  );
});

export default TerminalFrame;
